# X / Twitter Launch Thread

Tweetleri sırayla at. Her biri bir öncekine reply olarak.

---

**Tweet 1 — Hook**
```
I kept running Lighthouse audits and then spending 20 minutes turning the
results into tasks for my AI coding agent.

So I built a tool that does it automatically.

🧵 Agent Audit — an MCP server that turns Lighthouse into agent-ready fix packs
```

---

**Tweet 2 — Problem**
```
The problem with Lighthouse for AI agents:

A score of 67 doesn't tell Claude Code which file to open.
"Eliminate render-blocking resources" doesn't tell Cursor what to change.
"Links do not have a discernible name" doesn't tell Copilot which selector to fix.

Agents need structured, actionable data — not a PDF-style report.
```

---

**Tweet 3 — Solution**
```
Agent Audit converts each Lighthouse finding into a fix pack:

📍 Priority rank
🔍 CSS selectors & URLs from the failing audit (evidence)
📁 Repo search hints — where to look in your codebase
🛠️ Step-by-step implementation instructions
✅ Acceptance criteria — re-run the audit, check this metric passes

Your agent gets a backlog, not a report.
```

---

**Tweet 4 — Coverage**
```
What it audits:

⚡ Performance — FCP, LCP, CLS, TBT
♿ Accessibility — WCAG issues with selectors
🔎 Technical SEO — canonical, robots, JSON-LD, Open Graph
🤖 LLM visibility — AI crawler signals, llms.txt readiness
🔗 Broken links, images, missing alt text

Mobile + desktop. 3-run medians in reliable mode.
```

---

**Tweet 5 — Setup**
```
Works with Claude Code, Cursor, Copilot, and Codex.

Claude Code setup:
```
claude mcp add agent-audit -- npx -y @fullstackdegen/agent-audit
```

Then: "Run Agent Audit on https://mysite.com and fix the issues in priority order."

No signup. No API key. MIT.
```

---

**Tweet 6 — CTA**
```
Open source, MIT licensed.

⭐ GitHub: https://github.com/fullstackdegen/agent-audit
📦 npm: https://www.npmjs.com/package/@fullstackdegen/agent-audit

If you use Claude Code, Cursor, or Copilot for web dev — try it on your site.
```
