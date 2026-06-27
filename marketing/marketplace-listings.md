# Marketplace Listing İçerikleri

Her platform için hazır metinler. Copy-paste ile kullanılabilir.

---

## Smithery.ai

**Name:** Agent Audit

**Tagline:**
> Turn Lighthouse audits into coding-agent fix packs

**Description:**
Agent Audit is an MCP server that runs Google Lighthouse against any URL and converts
the raw output into structured fix packs your coding agent can actually execute.
Instead of reading a 200-line performance report, Claude Code, Cursor, Copilot, or
Codex gets a prioritized backlog with repo search hints, implementation steps, and
measurable acceptance criteria.

Covers performance (Core Web Vitals), accessibility, technical SEO, LLM visibility,
and `llms.txt` readiness.

**Install command:**
```
npx -y @fullstackdegen/agent-audit
```

**Category:** Developer Tools / Web Performance / SEO

**Tags:** lighthouse, mcp, core-web-vitals, accessibility, seo, ai-agent, coding-agent

**GitHub:** https://github.com/fullstackdegen/agent-audit
**npm:** https://www.npmjs.com/package/@fullstackdegen/agent-audit

---

## mcp.so

**Name:** agent-audit

**Short description (1 satır):**
> Lighthouse-powered MCP server — turns audits into coding-agent fix packs

**Full description:**
Agent Audit bridges the gap between Lighthouse diagnostics and autonomous code fixes.
It runs mobile and desktop audits, aggregates results across multiple runs, adds
same-page intelligence for SEO and LLM visibility, and returns `fixPacks` with:

- Prioritized issues with evidence and selectors
- Repo search hints for locating the relevant source files
- Step-by-step implementation instructions
- Acceptance criteria and verification guidance

Works out of the box with Claude Code, Claude Desktop, Cursor, GitHub Copilot,
and any MCP-compatible client.

**npm package:** `@fullstackdegen/agent-audit`

**Command:**
```
npx -y @fullstackdegen/agent-audit
```

---

## Glama.ai

**Title:** Agent Audit — Lighthouse MCP Server

**Description:**
An MCP server that converts Google Lighthouse performance, accessibility, SEO,
and LLM-visibility audits into structured fix packs for AI coding agents.
Supports fast (1 run) and reliable (3-run median) audit modes. Returns strict
MCP `structuredContent` plus equivalent Markdown.

**Use cases:**
- Automate Core Web Vitals improvements with Claude Code or Cursor
- Generate accessibility fix queues from Lighthouse data
- Audit LLM discoverability and `llms.txt` readiness
- Run technical SEO checks (canonical, robots, structured data, Open Graph)

**Setup:**
```json
{
  "mcpServers": {
    "agent-audit": {
      "command": "npx",
      "args": ["-y", "@fullstackdegen/agent-audit"]
    }
  }
}
```

---

## PulseMCP.com

**Tool name:** agent-audit

**One-liner:**
> MCP server: run Lighthouse, get agent-ready fix packs

**Description:**
Agent Audit wraps Google Lighthouse in an MCP server and reformats the output
for coding agents. Raw scores become a ranked issue list; each issue becomes a
fix pack with file search hints, implementation steps, and pass/fail criteria
the agent can verify by re-running the audit.

Supports Claude Code, Cursor, Codex, VS Code Copilot. MIT licensed.

**npm:** `@fullstackdegen/agent-audit`
**Repo:** https://github.com/fullstackdegen/agent-audit
