# Hacker News — Show HN Post

## Başlık

```
Show HN: Agent Audit – MCP server that turns Lighthouse into coding-agent fix packs
```

## İlk Yorum (açıklama metni)

Lighthouse is great for diagnosing web performance problems. What it doesn't do
is tell a coding agent which file to open or what specifically to change.

I built Agent Audit to close that gap. It's an MCP server (stdio transport) that:

1. Runs Lighthouse in mobile + desktop profiles (1 or 3 runs depending on mode)
2. Adds same-page inspection: broken links, canonical tags, robots signals,
   JSON-LD, Open Graph, LLM crawler visibility, `llms.txt` readiness
3. Merges and deduplicates findings across both profiles
4. Generates `fixPacks` — each one has a priority rank, repo search hints
   (CSS selectors / URLs from the failing audit), implementation steps, and
   acceptance criteria the agent can verify by re-running

The output is strict MCP `structuredContent` (JSON schema validated) plus
equivalent Markdown. Claude Code, Cursor, Codex, and GitHub Copilot can all
consume it.

Security note: it launches Chrome against user-provided URLs so URL policy matters.
Localhost and private ranges are blocked unless you explicitly pass `--local`.
Private LAN, link-local, cloud metadata addresses stay blocked regardless.

MIT, no signup, no API key:

    npx -y @fullstackdegen/agent-audit

Source: https://github.com/fullstackdegen/agent-audit

Happy to discuss the fix pack schema, the Lighthouse aggregation approach, or
the security model.
