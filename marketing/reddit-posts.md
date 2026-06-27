# Reddit Post Taslakları

---

## r/ClaudeAI

**Başlık:**
```
I built an MCP server that turns Lighthouse audits into Claude Code fix packs
```

**Post:**
Been using Claude Code to fix web performance issues and kept hitting the same
problem: Lighthouse gives you a score and a list of audits, but it doesn't tell
Claude *which file* to open or *what exactly* to change.

So I built **Agent Audit** — an MCP server that runs Lighthouse and reformats
the output into structured fix packs Claude can actually execute.

Each fix pack has:
- The specific failing audit IDs
- CSS selectors / URLs as evidence (straight from the Lighthouse output)
- `repoSearchHints` so Claude knows where to look in your codebase
- Implementation steps
- Acceptance criteria Claude can verify by re-running the audit

**Setup with Claude Code:**
```bash
claude mcp add agent-audit -- npx -y @fullstackdegen/agent-audit
```

Then just ask Claude: *"Run Agent Audit on https://mysite.com and fix the issues."*

It also covers accessibility, technical SEO, and LLM/AI crawler visibility
(checks for `llms.txt`, AI crawler signals, structured data).

MIT licensed, no signup. Repo: https://github.com/fullstackdegen/agent-audit

---

## r/webdev

**Başlık:**
```
Built an MCP server that converts Lighthouse audits into actionable coding-agent tasks
```

**Post:**
Lighthouse scores are useful for humans but pretty useless for AI coding agents.
A score of 67 doesn't tell Cursor or Copilot what to actually do.

I built **Agent Audit** to fix that. It's an MCP server that:

1. Runs Lighthouse (mobile + desktop, multiple runs for reliable medians)
2. Adds extra checks: broken links, canonical tags, Open Graph, JSON-LD, robots,
   image optimization, LLM visibility signals
3. Returns a prioritized `fixPacks` list with:
   - The specific failing audit IDs
   - CSS selectors and URLs as evidence
   - Repository search hints
   - Step-by-step implementation guide
   - Acceptance criteria for verification

Works with any MCP client: Claude Code, Cursor, Copilot, Codex.

The Core Web Vitals use 3-run median aggregation in `reliable` mode to smooth
out the variance that makes single Lighthouse runs unreliable in CI.

```bash
npx -y @fullstackdegen/agent-audit
```

https://github.com/fullstackdegen/agent-audit — MIT, open source.

---

## r/SEO

**Başlık:**
```
Open source MCP server for automated technical SEO audits with AI coding agents
```

**Post:**
Sharing something I built that might be useful for devs doing technical SEO work
with AI coding agents.

**Agent Audit** is an MCP server that runs Lighthouse + bounded page inspection
and returns structured technical SEO findings an agent can fix autonomously.

**What it checks:**
- Canonical tags (present, correct, self-referential vs. pointing elsewhere)
- Robots directives (meta robots, X-Robots-Tag, robots.txt signals)
- Title, description, heading hierarchy
- JSON-LD structured data (presence and basic validity)
- Open Graph tags
- Broken links and missing link accessible names
- Image alt text and optimization signals
- `llms.txt` and AI/LLM crawler visibility (new GEO signals)
- Indexability signals

Each finding comes as a fix pack with implementation steps and acceptance
criteria — so your coding agent knows what to change and how to verify it worked.

Not a replacement for a full SEO platform (no backlinks, no SERP data), but great
for catching technical issues and fixing them fast.

Free, MIT licensed: https://github.com/fullstackdegen/agent-audit
