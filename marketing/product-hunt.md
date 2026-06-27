# Product Hunt Launch İçeriği

**Önerilen gün:** Salı veya Çarşamba (PST 00:01'de yayına alın)

---

## Ürün Adı

Agent Audit

## Tagline (60 karakter max)

> Turn Lighthouse audits into coding-agent fix packs

## Kısa Açıklama (260 karakter)

Agent Audit is an MCP server that runs Google Lighthouse and converts raw
performance, accessibility, and SEO results into structured fix packs that
Claude Code, Cursor, Copilot, and Codex can execute autonomously.

## Uzun Açıklama

Lighthouse is excellent for diagnosing web performance problems. But a 200-line
audit report isn't something a coding agent can act on directly.

**Agent Audit changes that.**

It wraps Lighthouse in an MCP server and reformats every finding into a fix pack:
a prioritized, evidence-backed task with repo search hints, implementation steps,
and acceptance criteria the agent can verify by re-running the audit.

**What it audits:**
- Performance — FCP, LCP, CLS, TBT, Speed Index
- Accessibility — WCAG-level issues with selectors
- Technical SEO — canonical tags, robots signals, metadata, JSON-LD, Open Graph
- LLM visibility — AI crawler signals, `llms.txt` readiness
- Broken links, missing alt text, image optimization

**Works with:** Claude Code, Claude Desktop, Cursor, GitHub Copilot, Codex

**Install in 10 seconds:**
```
claude mcp add agent-audit -- npx -y @fullstackdegen/agent-audit
```

Open source (MIT), no API key needed, no account required.

## Topics / Categories

- Developer Tools
- Artificial Intelligence
- Web Performance
- SEO
- Open Source

## Links

- Website / GitHub: https://github.com/fullstackdegen/agent-audit
- npm: https://www.npmjs.com/package/@fullstackdegen/agent-audit

---

## Maker Comment (launch günü ilk yorum)

Hey Product Hunt! 👋

I built Agent Audit because I kept running Lighthouse audits and then spending 20
minutes translating the report into a task list my AI agent could actually work from.

The core insight: a coding agent doesn't need scores — it needs to know **which file**
to open, **what specifically** to change, and **how to verify** the fix worked.

Agent Audit generates exactly that. Each fix pack includes:
- The specific selectors or URLs from the failing audit
- `repoSearchHints` to locate the right component or route
- Step-by-step implementation instructions
- Acceptance criteria (re-run the audit, check this metric passes)

Happy to answer questions about how the fix pack schema works or the security model
(it runs Chrome, so URL policy matters a lot).

npx -y @fullstackdegen/agent-audit — no signup, MIT licensed.
