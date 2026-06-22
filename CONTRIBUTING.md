# Contributing

Agent Audit contributions are welcome through focused issues and pull requests.

## Development Setup

```bash
npm install
npm test
npm run check
npm run build
```

## Pull Requests

- Keep changes scoped to one concern.
- Add or update tests for behavior changes.
- Preserve stdout for MCP protocol traffic; write diagnostics to stderr.
- Do not weaken the public-network URL policy without a documented threat model.
- Keep Markdown derived exclusively from the canonical structured report.
- Preserve the 10-issue and 10-evidence-row response limits.
- Add fixture-based tests for new Lighthouse detail shapes or audit mappings.
- Run the complete verification commands before requesting review.

Use clear commit messages that explain the behavior being changed.
