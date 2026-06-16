# Localhost Dev Mode And README Cleanup Design

## Goal

Make Lighthouse MCP practical for local development without weakening the
default security posture of the public npm package. At the same time, clean the
public repository surface and make MCP installation guidance fair across common
agent clients.

## Problem

Version `0.1.0` intentionally rejects `localhost`, loopback, and private
network targets. That default is appropriate for a public MCP server package
because the tool navigates to user-provided URLs, but it creates a bad developer
workflow: users fixing Lighthouse issues in a local app would need to deploy or
expose the site publicly before every validation run.

The README also currently gives detailed instructions for Claude Desktop and
Codex but not equivalent coverage for Claude Code, VS Code, Cursor, and generic
MCP clients. Finally, the public repository includes internal Superpowers
planning/specification documents that were useful during development but add
noise for open-source readers.

## Design Summary

Add an explicit localhost-only development mode controlled by an environment
variable:

```bash
LIGHTHOUSE_MCP_ALLOW_LOCALHOST=true npx -y mcp-server-lighthouse
```

When the variable is absent or set to any value other than `true`, behavior is
unchanged: only public HTTP and HTTPS targets are allowed.

When the variable is set to `true`, these local targets are allowed:

- `localhost`;
- `localhost.localdomain`;
- any hostname ending in `.localhost`;
- IPv4 loopback addresses in `127.0.0.0/8`;
- IPv6 loopback `::1`.

All other non-public ranges remain blocked, including:

- private LAN addresses such as `10.0.0.0/8`, `172.16.0.0/12`, and
  `192.168.0.0/16`;
- link-local addresses;
- cloud metadata addresses;
- multicast, unspecified, carrier-grade NAT, and reserved ranges.

This keeps local development useful while avoiding a broad "allow private
network" mode.

## URL Policy Architecture

`src/url-policy.ts` remains the single URL policy boundary.

New exported behavior:

- `isLocalhostAllowedFromEnv(env = process.env): boolean`
- `parseAuditTargetUrl(input, options?)`
- `assertAuditTargetUrl(input, resolveHostname?, options?)`

The current public names can remain as compatibility aliases if useful:

- `parsePublicHttpUrl`
- `assertPublicHttpUrl`

The server dependency injection shape remains simple. `createLighthouseServer`
continues to accept `validateUrl`, and the default validator reads the
environment at call time so tests can control `process.env` safely.

## Error Handling

Invalid URL forms still return MCP `InvalidParams`.

Localhost rejection should produce an actionable error:

> Localhost targets are disabled by default. Start the server with
> `LIGHTHOUSE_MCP_ALLOW_LOCALHOST=true` to audit local development sites.

Private-network rejection should remain distinct:

> The target must resolve exclusively to publicly routable addresses.

This distinction helps users understand that localhost has a deliberate
development path, while LAN/internal network targets are still outside scope.

## README Installation Coverage

The README will add or revise installation sections for:

- Claude Desktop: standard `mcpServers` JSON.
- Claude Code: official stdio command form:
  `claude mcp add lighthouse -- npx -y mcp-server-lighthouse`.
- Codex: `codex mcp add lighthouse -- npx -y mcp-server-lighthouse` and TOML.
- VS Code / GitHub Copilot: `.vscode/mcp.json` or user `mcp.json` using
  `servers`, `command`, and `args`, matching official VS Code docs.
- Cursor: generic stdio MCP configuration using command `npx` and args
  `["-y", "mcp-server-lighthouse"]`; avoid claiming an exact file path or
  schema beyond what can be verified from current public docs.
- Generic MCP clients: stdio command and args.

The README will also add a "Local Development Audits" section with examples:

```bash
LIGHTHOUSE_MCP_ALLOW_LOCALHOST=true npx -y mcp-server-lighthouse
```

```json
{
  "url": "http://localhost:3000",
  "mode": "fast"
}
```

For clients that support environment variables in MCP server config, examples
may include:

```json
{
  "command": "npx",
  "args": ["-y", "mcp-server-lighthouse"],
  "env": {
    "LIGHTHOUSE_MCP_ALLOW_LOCALHOST": "true"
  }
}
```

Where client-specific environment syntax is not verified, the README will say
to set the variable in the shell that launches the client.

## Security Documentation

README and `SECURITY.md` will state:

- localhost mode is intended for a developer's own machine;
- do not enable it in shared, hosted, CI, or server environments unless the
  surrounding network is already isolated;
- the mode does not permit LAN or cloud metadata targets;
- production operators should keep outbound network controls in place.

## Repository Cleanup

Remove internal Superpowers planning and specification files from the public
tree:

```text
docs/superpowers/
```

Keep:

- `docs/assets/lighthouse-mcp-overview.svg`;
- `examples/commalabs-fast-report.json`;
- `examples/commalabs-fast-report.md`;
- `.github/`;
- `scripts/`;
- `src/`;
- `test/`.

The implementation plan and this spec may exist temporarily on the feature
branch to satisfy the workflow, but the final public tree should not include
`docs/superpowers/`.

## Testing

Add URL policy tests for:

- default rejection of `http://localhost:3000`;
- default rejection of `http://127.0.0.1:3000`;
- allowed `http://localhost:3000` with explicit localhost mode;
- allowed `http://127.0.0.1:3000` with explicit localhost mode;
- allowed `http://[::1]:3000` with explicit localhost mode;
- allowed `http://app.localhost:3000` with explicit localhost mode;
- continued rejection of `http://192.168.1.10` with localhost mode;
- continued rejection of a hostname resolving to a private address with
  localhost mode;
- env helper returns true only for exact string `true`.

Add server tests confirming that, with the environment enabled, localhost URLs
reach the injected audit function.

Run:

```bash
npm test
npm run check
npm run build
npm run validate:release
npm audit --omit=dev
npm pack --dry-run
```

Also run a local smoke test against a trivial local HTTP server if possible:

```bash
LIGHTHOUSE_MCP_ALLOW_LOCALHOST=true npm run --silent smoke -- http://localhost:<port> fast
```

## Release Plan

Ship this as `0.1.1`.

The release note should say:

- adds explicit localhost audit support for local development;
- keeps public URL policy as the default;
- improves README setup coverage across MCP clients;
- removes internal planning docs from the public repository tree.

## Success Criteria

- Developers can audit `http://localhost:3000` without deploying.
- Public default behavior remains secure.
- Private LAN and metadata-network targets remain blocked.
- README gives fair, verified setup guidance across major MCP clients.
- Public GitHub tree no longer contains internal planning/spec files.
- All tests and release validation pass.
