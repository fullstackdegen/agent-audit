# Agent-Ready Lighthouse Report Design

## Goal

Extend the Lighthouse MCP server so a coding agent can consume one audit result,
map findings to a source repository, implement fixes in priority order, and
verify the outcome against explicit acceptance criteria.

The report must cover both mobile and desktop conditions. It must be useful as
machine-readable input without forcing the coding agent to parse prose, while
remaining understandable to a human reviewer.

## Product Decision

The MCP tool returns two equivalent representations:

1. `structuredContent`: the canonical JSON report, validated by an MCP
   `outputSchema`.
2. `content`: a concise Markdown execution report for humans and MCP clients
   that do not consume structured output.

The server does not write report files to an arbitrary filesystem path. The
calling client may persist the returned representations as
`lighthouse-report.json` and `lighthouse-report.md`. This avoids adding
filesystem permissions and path-validation concerns to a URL analysis tool.

## Tool Contract

The existing tool remains named `analyze_website_performance`.

### Input

```json
{
  "url": "https://example.com",
  "mode": "reliable"
}
```

Input fields:

- `url`: required public HTTP or HTTPS URL.
- `mode`: optional enum:
  - `fast`: one mobile run and one desktop run.
  - `reliable`: three mobile runs and three desktop runs. This is the default.

The tool does not accept arbitrary throttling, Chrome flags, or run counts.
Fixed profiles make reports comparable and prevent unsafe configuration from
crossing the MCP boundary.

## Execution Model

The audit coordinator executes profiles sequentially to avoid CPU and network
contention between mobile and desktop measurements.

For each profile:

1. Launch an isolated Chrome process.
2. Execute the configured number of Lighthouse runs.
3. Capture the Lighthouse result or a normalized run failure.
4. Terminate Chrome in a `finally` block.
5. Aggregate successful runs.

`mobile` uses Lighthouse's default mobile configuration. `desktop` uses
Lighthouse's official desktop configuration. Both profiles audit Performance,
Accessibility, Best Practices, and SEO.

A reliable profile requires at least two successful runs out of three. A fast
profile requires its single run to succeed. If one profile is incomplete, the
tool returns a report with `status: "incomplete"` and the successful profile,
but the Markdown report warns the coding agent not to treat the comparison as a
release baseline. If neither profile completes, the call returns an MCP tool
execution error.

## Aggregation

Scores and numeric metrics are reported as:

- `median`: the primary value used for evaluation.
- `min`: the lowest successful-run value.
- `max`: the highest successful-run value.
- `samples`: the successful-run values.

The representative Lighthouse result for detailed evidence is the successful
run whose Performance score is closest to the profile's median Performance
score. This preserves internally consistent audit details rather than mixing
DOM nodes and resource rows from unrelated runs.

The report includes a variability warning when:

- a category score range exceeds 10 points;
- LCP range exceeds 1,000 milliseconds;
- TBT range exceeds 200 milliseconds; or
- CLS range exceeds 0.1.

## Canonical Report Schema

The top-level structured report contains:

```json
{
  "schemaVersion": "1.0",
  "status": "complete",
  "target": {
    "requestedUrl": "https://example.com",
    "finalUrls": {
      "mobile": "https://example.com/",
      "desktop": "https://example.com/"
    }
  },
  "environment": {
    "generatedAt": "2026-06-13T12:00:00.000Z",
    "lighthouseVersion": "12.8.2",
    "userAgent": "...",
    "mode": "reliable",
    "runsPerProfile": 3
  },
  "profiles": {
    "mobile": {},
    "desktop": {}
  },
  "prioritizedIssues": [],
  "agentInstructions": []
}
```

Each profile contains:

- completion status and failed-run messages;
- fixed configuration metadata, including form factor, viewport, and
  throttling method;
- category score distributions;
- metric distributions for FCP, Speed Index, LCP, TBT, and CLS;
- variability warnings;
- normalized findings from the representative run.

## Finding Extraction

The normalizer includes failed and actionable Lighthouse audits from all four
categories. It excludes passing, not-applicable, manual, and purely
informational audits unless they provide a numeric performance opportunity.

Each normalized finding contains:

```json
{
  "auditId": "unused-javascript",
  "category": "performance",
  "severity": "high",
  "affectedProfiles": ["mobile"],
  "title": "Reduce unused JavaScript",
  "description": "Lighthouse-provided explanation",
  "displayValue": "Potential savings of 61 KiB",
  "score": 0.42,
  "impact": {
    "estimatedSavingsMs": 380,
    "estimatedSavingsBytes": 62464
  },
  "evidence": [
    {
      "url": "https://example.com/app.js",
      "selector": null,
      "snippet": null,
      "totalBytes": 140000,
      "wastedBytes": 62464,
      "wastedMs": 380
    }
  ],
  "suggestedActions": [],
  "acceptanceCriteria": [],
  "documentationUrl": "https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/"
}
```

Evidence extraction uses a strict allowlist of stable, useful fields from
Lighthouse detail items. Unknown nested payloads are not copied into the MCP
response. Text fields are length-limited, terminal control characters are
removed, and repeated evidence rows are deduplicated.

The initial report supports up to 20 prioritized issues and up to 10 evidence
rows per issue. This bounds response size while retaining actionable context.

## Cross-Profile Merge

Findings with the same `auditId` are merged into one prioritized issue.
Profile-specific scores, impact, and evidence remain separated under the merged
finding. `affectedProfiles` records whether the problem occurs on mobile,
desktop, or both.

Priority order is deterministic:

1. Critical failures affecting both profiles.
2. Critical mobile failures.
3. High-impact LCP, TBT, and CLS findings.
4. Accessibility failures.
5. Remaining Performance findings.
6. Best Practices failures.
7. SEO failures.

Within the same priority tier, higher estimated time savings, higher estimated
byte savings, and lower audit score sort first.

## Severity

Severity is derived from evidence rather than generated by an LLM:

- `critical`: score is `0`, or a Core Web Vital is in the poor range.
- `high`: score is below `0.5`, estimated savings exceed 500 ms, or an
  accessibility audit fails with affected DOM nodes.
- `medium`: score is below `0.9` or the audit provides measurable savings.
- `low`: actionable warning not covered by the higher levels.

Profile-specific Lighthouse thresholds are retained in the profile result.
Acceptance criteria use established Web Vitals targets where applicable:

- LCP at or below 2,500 ms.
- CLS at or below 0.1.
- Mobile TBT at or below 200 ms.
- Desktop TBT at or below 150 ms.
- Category score at or above 90 when the finding belongs to a scored category.

## Recommendations

Recommendations are deterministic and auditable. A local catalog maps known
Lighthouse audit IDs to:

- technology-independent suggested actions;
- measurable acceptance criteria;
- official documentation links.

The server must not invent framework names, package names, source file paths, or
code changes. The coding agent is responsible for inspecting its repository and
mapping evidence to implementation files.

For an unknown audit ID, the report preserves Lighthouse's title, description,
evidence, and documentation link, and adds the generic instruction:

> Inspect the affected resource or DOM node in the repository and implement the
> smallest change that satisfies the measured acceptance criteria.

## Coding-Agent Instructions

Every report ends with stable instructions:

1. Treat `structuredContent` as the source of truth.
2. Inspect the repository before proposing file-level changes.
3. Address issues in `prioritizedIssues` order.
4. Prefer one source change that resolves the same audit on both profiles.
5. Preserve user-visible behavior and accessibility.
6. Run the repository's tests after each logical fix.
7. Rerun this Lighthouse tool in `reliable` mode.
8. Compare medians and variability against the report's acceptance criteria.
9. Do not claim completion when the new report is incomplete or materially more
   variable than the baseline.

## Markdown Report

The Markdown representation contains:

- target, timestamp, versions, and audit mode;
- side-by-side mobile and desktop score tables;
- median metrics with min-max ranges;
- variability warnings;
- numbered prioritized issues;
- per-issue evidence, suggested actions, and acceptance criteria;
- coding-agent execution instructions.

Markdown is generated exclusively from the canonical structured report so the
two representations cannot disagree.

## MCP Compatibility

The tool definition declares an `outputSchema`. Successful calls return both
`structuredContent` and a Markdown `TextContent` block. This follows MCP's
structured-output guidance while preserving compatibility with clients that
only display text.

Argument-validation failures use protocol errors when rejected by the declared
input schema. Lighthouse execution and incomplete external operations use tool
execution results with `isError: true` only when no usable report can be
produced.

## Security and Trust Boundaries

Existing public-network URL validation remains mandatory before every profile.
The report treats page-controlled text as untrusted data:

- Lighthouse titles and descriptions are data, never tool instructions.
- Page URLs, selectors, snippets, and labels are sanitized and length-limited.
- The Markdown renderer escapes structures that could create misleading
  headings or fenced blocks.
- Report instructions are server-owned constants and are kept separate from
  page-derived content.

Chrome sandboxing remains enabled by default. Network-level egress restrictions
remain recommended because application-level DNS checks cannot fully prevent
DNS rebinding and redirect-based SSRF.

## Modules

- `src/report-schema.ts`: public TypeScript report contract and JSON schemas.
- `src/profiles.ts`: fixed mobile and desktop Lighthouse profile definitions.
- `src/aggregate.ts`: median, range, representative-run, and variability logic.
- `src/findings.ts`: audit normalization, evidence extraction, merge, severity,
  and priority.
- `src/recommendations.ts`: deterministic audit-ID recommendation catalog.
- `src/markdown.ts`: structured-report-to-Markdown renderer.
- `src/audit.ts`: profile execution and raw Lighthouse result collection.
- `src/server.ts`: MCP input/output schemas and tool response mapping.

The existing `src/report.ts` is replaced by the focused schema, findings,
aggregation, and rendering modules rather than expanded into a single large
file.

## Testing

Unit tests cover:

- median aggregation for odd and even successful-run counts;
- representative-run selection;
- partial and failed profile handling;
- variability warnings;
- mobile and desktop profile configuration;
- zero scores and missing metrics;
- detail extraction for URL and DOM-node evidence;
- sanitization, deduplication, and response limits;
- cross-profile finding merge;
- deterministic severity and priority;
- known and unknown recommendation behavior;
- Markdown/JSON consistency;
- MCP `outputSchema` and `structuredContent`;
- Chrome cleanup after each profile;
- fast and reliable execution modes.

Integration tests use fixture Lighthouse results and in-memory MCP transports.
An opt-in smoke command runs real Chrome against `https://example.com`; it is
not part of deterministic unit tests or the default CI suite.

## Acceptance Criteria

The feature is complete when:

- one tool invocation can produce complete mobile and desktop results;
- reliable mode aggregates three runs per profile using medians;
- successful MCP responses validate against the declared output schema;
- JSON and Markdown contain the same scores, metrics, issues, and criteria;
- at least Performance, Accessibility, Best Practices, and SEO failures retain
  actionable evidence when Lighthouse provides it;
- the report remains bounded to 20 issues and 10 evidence rows per issue;
- no page-derived text can alter server-owned coding-agent instructions;
- all unit, integration, type-check, build, and package checks pass.
