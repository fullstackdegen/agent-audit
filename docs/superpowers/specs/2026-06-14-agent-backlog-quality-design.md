# Agent Backlog Quality Design

## Goal

Reduce Lighthouse report noise so a coding agent receives a short,
non-duplicated, evidence-backed implementation backlog.

## Normalization

Equivalent Lighthouse audits are mapped to one canonical task before
cross-profile merging:

- `legacy-javascript-insight` becomes `legacy-javascript`.
- `render-blocking-insight` becomes `render-blocking-resources`.

Profile evidence and the highest measured impact are retained when aliases
merge.

## Task Eligibility

Numeric metrics remain in profile metric tables and do not become backlog
tasks. This excludes FCP, Speed Index, LCP, TBT, CLS, Time to Interactive, and
Max Potential FID audit IDs.

Unknown insight and diagnostic audits are included only when they contain
allowlisted evidence or have a deterministic recommendation. Known category
failures such as accessibility, SEO, and Best Practices remain eligible even
without evidence.

## Evidence

Evidence extraction additionally supports console and network table fields:

- `source` or `sourceLocation.url` becomes the evidence URL when available.
- `description` or `failureReason` becomes the evidence snippet.

Page-controlled values remain sanitized and length-limited.

## Severity

Severity is based on category and impact:

- `critical`: poor Core Web Vital, accessibility failure with affected DOM
  nodes, security/HTTPS failure, or estimated savings above 1,000 ms.
- `high`: failed actionable audit, estimated savings above 500 ms, or measurable
  byte waste above 50 KiB.
- `medium`: partial score or measurable savings.
- `low`: remaining eligible warning.

A zero audit score alone is not sufficient for `critical`.

## Backlog Size

`prioritizedIssues` contains at most 10 canonical tasks. The JSON schema and
Markdown documentation use the same limit.

## Acceptance Criteria

- Alias audits appear only once.
- Raw metric audits do not appear as tasks.
- Console errors preserve available source and description evidence.
- Unknown evidence-free insights are excluded.
- CommaLabs produces no more than 10 prioritized tasks.
- Mobile LCP remains represented through profile metrics and the known
  LCP-element recommendation when available.
- Existing schema, security, MCP, and aggregation tests continue to pass.
