---
title: "How I Automated Lighthouse Fixes with an MCP Server"
tags: [mcp, lighthouse, webperformance, claudecode]
cover_image: (add a screenshot of a fix pack output here)
---

# How I Automated Lighthouse Fixes with an MCP Server

Every time I ran a Lighthouse audit, I'd end up doing the same thing: reading
through 20+ audit items, copying out the failing ones, figuring out which files
in the repo were responsible, and writing a task list my coding agent could
actually follow.

That translation layer was taking longer than the fixes themselves. So I automated it.

## The Problem with Lighthouse for AI Agents

Lighthouse produces excellent diagnostics. But the output format is built for humans
scanning a report in a browser — not for an AI coding agent that needs to know:

- Which file to open
- Exactly what to change
- How to verify the fix worked

A score of 67 doesn't answer any of those questions. Neither does "Eliminate
render-blocking resources" without knowing which script tag, in which component,
loaded by which route.

## What Agent Audit Does

[Agent Audit](https://github.com/fullstackdegen/agent-audit) is an MCP server
that runs Lighthouse and reformats the output into **fix packs** — structured
tasks an AI coding agent can execute directly.

Here's what a fix pack looks like:

```json
{
  "id": "fix-link-name",
  "priority": 2,
  "goal": "Fix Links do not have a discernible name.",
  "category": "accessibility",
  "severity": "critical",
  "affectedProfiles": ["mobile", "desktop"],
  "repoSearchHints": [
    "div.border-t-2 > div.flex > div.flex > a.text-gray-600",
    "https://www.linkedin.com/company/commalabs"
  ],
  "implementationSteps": [
    "Inspect the repository for the evidence listed in repoSearchHints before editing.",
    "Give every link a discernible accessible name.",
    "Keep changes focused on source issue IDs: link-name."
  ],
  "acceptanceCriteria": [
    "All link elements pass the Lighthouse link-name audit.",
    "Raise the median accessibility score to at least 90/100."
  ],
  "verification": {
    "rerunMode": "reliable",
    "expectedAuditIds": ["link-name"]
  }
}
```

The `repoSearchHints` come directly from the Lighthouse audit evidence — the actual
CSS selectors and URLs that triggered the failure. The coding agent can use these
to find the right component without guessing.

## Real Example: CommaLabs

I ran Agent Audit against [CommaLabs](https://commalabs.com) in reliable mode
(3 Lighthouse runs per profile, median aggregation).

The report returned 6 prioritized fix packs covering:

1. Missing `aria-label` on social links (accessibility, critical)
2. Render-blocking script (performance, high)
3. Missing `meta description` (SEO, medium)
4. Images without explicit `width` and `height` (CLS, medium)
5. No `llms.txt` file (LLM visibility, low)
6. Open Graph image missing (social sharing, low)

Claude Code executed all 6 fix packs in order, searched the repo using the provided
hints, applied the fixes, and verified each one by re-running the audit. Total time:
under 15 minutes, including the verification runs.

[Full report JSON](https://github.com/fullstackdegen/agent-audit/blob/main/examples/commalabs-fast-report.json) |
[Full report Markdown](https://github.com/fullstackdegen/agent-audit/blob/main/examples/commalabs-fast-report.md)

## What It Audits

- **Performance** — FCP, Speed Index, LCP, TBT, CLS (mobile + desktop, 3-run medians)
- **Accessibility** — WCAG-level issues with failing element selectors
- **Technical SEO** — canonical tags, robots directives, title, description, heading hierarchy
- **Structured data** — JSON-LD presence and validity
- **Social** — Open Graph tags, og:image
- **LLM visibility** — AI crawler signals, `llms.txt` readiness, GEO signals
- **Links and images** — broken links, missing alt text, image sizing

## How to Set It Up

Requirements: Node.js 20+, Google Chrome or Chromium.

**Claude Code:**
```bash
claude mcp add agent-audit -- npx -y @fullstackdegen/agent-audit
```

**Claude Desktop / Cursor / Copilot (`.mcp.json`):**
```json
{
  "servers": {
    "agent-audit": {
      "command": "npx",
      "args": ["-y", "@fullstackdegen/agent-audit"]
    }
  }
}
```

**Local development (localhost URLs):**
```bash
claude mcp add agent-audit-local -- npx -y @fullstackdegen/agent-audit --local
```

Then tell your agent:

```
Run Agent Audit on https://mysite.com in reliable mode.
Read the structuredContent. Work through each fixPack in priority order.
For each one: search the repo using repoSearchHints, implement the fix,
run tests, then rerun Agent Audit to verify against acceptanceCriteria.
```

## The Audit Modes

- **`fast`** — one mobile + one desktop run. Good for quick iterations during development.
- **`reliable`** — three runs per profile, returns median scores and variability ranges.
  Use this before claiming a fix is complete.

## Security Notes

Agent Audit launches Chrome against user-provided URLs. By default it blocks:

- Localhost and loopback (unless `--local` flag is set)
- Private LAN ranges, link-local addresses
- Cloud metadata addresses (e.g. `169.254.169.254`)
- Non-HTTP/HTTPS protocols
- Embedded credentials in URLs

Page content (titles, descriptions, selectors) is treated as untrusted data and
sanitized before it reaches the agent.

## Links

- **GitHub:** https://github.com/fullstackdegen/agent-audit
- **npm:** https://www.npmjs.com/package/@fullstackdegen/agent-audit
- **License:** MIT

---

*Have you used Agent Audit or built something similar? I'd be curious what other
"translation layer" problems people are hitting with AI coding agents.*
