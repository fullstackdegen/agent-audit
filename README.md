# Lighthouse MCP Server

Run Google Lighthouse audits from any Model Context Protocol (MCP) client and
receive a compact Markdown report covering performance, accessibility, best
practices, SEO, key metrics, and the highest-impact opportunities.

## Features

- Performance, Accessibility, Best Practices, and SEO scores
- FCP, Speed Index, LCP, and Total Blocking Time metrics
- The two opportunities with the largest estimated time savings
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
  "url": "https://example.com"
}
```

The response includes:

- Four Lighthouse category scores
- Key rendering and responsiveness metrics
- Up to two optimization opportunities, ordered by estimated savings

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
