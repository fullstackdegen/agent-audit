# Lighthouse MCP Server

Run repeatable mobile and desktop Google Lighthouse audits from any Model
Context Protocol (MCP) client. The tool returns a schema-validated JSON report
for coding agents and an equivalent Markdown execution summary for humans.

## Features

- Mobile and desktop Performance, Accessibility, Best Practices, and SEO scores
- Fast mode with one run per profile
- Reliable mode with three runs per profile and median aggregation
- FCP, Speed Index, LCP, TBT, and CLS distributions
- Bounded, prioritized findings with resource and DOM evidence
- Deterministic suggested actions and measurable acceptance criteria
- MCP `structuredContent` validated by an advertised `outputSchema`
- Public-network URL policy to reduce server-side request forgery (SSRF) risk
- Chrome process cleanup on both successful and failed audits
- Stdio-safe logging: protocol messages use stdout; diagnostics use stderr
- Strict TypeScript and deterministic unit tests

## Requirements

- Node.js 20 or later
- A locally installed Google Chrome or Chromium browser

## Installation

```bash
npm install
npm run build
```

Run the server directly:

```bash
node dist/index.js
```

## MCP Client Configuration

After publishing the package, configure an MCP client to invoke it through
`npx`:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["-y", "mcp-server-lighthouse"]
    }
  }
}
```

For local development, use the absolute path to `dist/index.js`:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "node",
      "args": ["/absolute/path/to/lighthouse-mcp/dist/index.js"]
    }
  }
}
```

## Tool

### `analyze_website_performance`

Runs Lighthouse against a public HTTP or HTTPS URL.

```json
{
  "url": "https://example.com",
  "mode": "reliable"
}
```

`mode` is optional:

- `fast`: one mobile run and one desktop run.
- `reliable`: three runs per profile, median results, and variability ranges.
  This is the default.

The successful MCP response contains:

- `structuredContent`: canonical JSON for automation and coding agents.
- `content`: Markdown generated from the same canonical report.

The report contains at most 10 prioritized issues and 10 evidence rows per
issue. Equivalent Lighthouse audits are merged under canonical task IDs across
profiles, while duplicate resource evidence keeps the highest measured impact.
Raw metric audits remain in the profile metrics instead of becoming coding
tasks. Findings without actionable evidence or a deterministic recommendation
are omitted from the backlog. Page-controlled text is sanitized and kept
separate from server-owned agent instructions.

If only one profile produces enough successful runs, the report has
`status: "incomplete"`. It remains useful for diagnosis but must not be treated
as a release baseline. Material score or metric variation is included as a
profile warning.

## Coding-Agent Workflow

Persist `structuredContent` as `lighthouse-report.json` and the text content as
`lighthouse-report.md` when file artifacts are useful. The MCP server does not
accept arbitrary output paths.

Use this instruction with the report:

> Read `lighthouse-report.json` as the source of truth and
> `lighthouse-report.md` as the execution summary. Inspect the repository before
> mapping findings to files. Implement issues in `prioritizedIssues` order,
> preserve behavior and accessibility, run repository tests after each logical
> fix, then rerun Lighthouse in reliable mode and compare medians, ranges, and
> acceptance criteria. Do not claim completion from an incomplete baseline.

## Security Model

The URL policy rejects:

- Protocols other than HTTP and HTTPS
- URLs containing embedded credentials
- Localhost names
- Loopback, private, link-local, multicast, reserved, and metadata-network IPs
- Hostnames that resolve to any non-public address

These checks reduce SSRF exposure but do not replace infrastructure controls.
Production operators should run the server in an isolated environment and deny
outbound access to private networks and cloud metadata services. Redirects and
DNS rebinding are best controlled at the network boundary.

Chrome sandboxing is enabled by default. Only isolated container environments
that cannot support the Chrome sandbox should set:

```bash
LIGHTHOUSE_CHROME_NO_SANDBOX=true
```

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Development

```bash
npm test
npm run check
npm run build
```

Run an opt-in real Chrome smoke audit:

```bash
npm run --silent smoke -- https://example.com fast
npm run --silent smoke -- https://example.com reliable
```

The smoke command writes canonical JSON to stdout and Markdown to stderr.

## Troubleshooting

**Chrome cannot be found**

Install Google Chrome or Chromium in the environment running the MCP server.

**Chrome fails to start in a container**

Prefer a container configuration that supports the Chrome sandbox. As a last
resort, set `LIGHTHOUSE_CHROME_NO_SANDBOX=true` only when the surrounding
container or virtual machine provides an equivalent isolation boundary.

**The target URL is rejected**

Only publicly routable HTTP and HTTPS targets are accepted. Local development
sites and private network addresses are intentionally blocked.

## License

[MIT](LICENSE)
