# Anthropic MCP Repo — PR Submission Guide

## Hedef Repo

`modelcontextprotocol/servers` (resmi MCP server listesi)

## PR Adımları

1. https://github.com/modelcontextprotocol/servers adresine git
2. Repoyu fork et
3. Aşağıdaki değişikliği yap
4. PR aç

## README.md'ye Eklenecek İçerik

`README.md` içindeki **Community Servers** bölümüne alfabetik sıraya göre ekle:

```markdown
- **[Agent Audit](https://github.com/fullstackdegen/agent-audit)** - Lighthouse-powered audits that turn performance, accessibility, SEO, and LLM-visibility findings into structured fix packs for coding agents (Claude Code, Cursor, Copilot, Codex).
```

## PR Başlığı

```
feat: add Agent Audit — Lighthouse MCP server for coding-agent fix packs
```

## PR Açıklaması

```markdown
## Summary

Adds **Agent Audit** (`@fullstackdegen/agent-audit`) to the Community Servers list.

**What it does:** Runs Google Lighthouse (mobile + desktop) and bounded page-inspection
against a target URL, then returns structured `fixPacks` with repo search hints,
implementation steps, and measurable acceptance criteria — so coding agents can
execute fixes autonomously rather than interpreting raw audit output.

**Audits covered:**
- Performance (Core Web Vitals: FCP, LCP, CLS, TBT)
- Accessibility
- Technical SEO (canonical, robots, metadata, JSON-LD, Open Graph)
- LLM visibility & `llms.txt` readiness
- Broken links, images, assets

**MCP clients supported:** Claude Code, Claude Desktop, Cursor, Codex, VS Code / GitHub Copilot

**Install:**
\```bash
npx -y @fullstackdegen/agent-audit
\```

**Links:**
- npm: https://www.npmjs.com/package/@fullstackdegen/agent-audit
- GitHub: https://github.com/fullstackdegen/agent-audit
- License: MIT
```

---

## Alternatif: Anthropic Docs / Claude Integrations

Eğer `modelcontextprotocol/servers` dışında Anthropic'in kendi dokümantasyonuna
eklenmek istersen, https://docs.anthropic.com/en/docs/claude-code/mcp sayfasında
"community tools" bölümü için aynı içeriği kullanabilirsin — bunun için
Anthropic'e doğrudan e-posta veya Twitter DM ile ulaşmak gerekiyor.
