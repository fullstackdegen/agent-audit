# Lighthouse MCP Server Design

## Goal

Provide a small, production-oriented MCP server that runs Google Lighthouse
against a public HTTP or HTTPS URL and returns a concise Markdown summary.

## Architecture

The package is split into focused modules:

- `url-policy.ts` parses input and blocks localhost, private, loopback,
  link-local, and metadata-network targets.
- `report.ts` converts a Lighthouse result into stable, readable Markdown.
- `audit.ts` owns Chrome startup, Lighthouse execution, and guaranteed cleanup.
- `server.ts` declares the MCP tool and maps tool calls to audit results.
- `index.ts` is the stdio entry point and writes diagnostics only to stderr.

## Security

User-controlled URLs are an SSRF boundary. The server accepts only HTTP and
HTTPS URLs, rejects embedded credentials and non-public literal IP addresses,
and resolves hostnames before navigation to reject private network addresses.
DNS is checked again immediately before the audit. This reduces, but cannot
fully eliminate, DNS rebinding risk without network-level egress controls.

Chrome sandboxing remains enabled by default. Operators may explicitly set
`LIGHTHOUSE_CHROME_NO_SANDBOX=true` only in an already isolated environment.

## Error Handling

Expected validation and audit failures are returned as MCP tool errors. Internal
errors are normalized without exposing stack traces. Chrome cleanup runs in a
`finally` block and cleanup failures are written to stderr.

## Testing

Unit tests cover URL policy decisions and report formatting, including zero
scores. Server-level behavior is exercised with injected audit dependencies so
tests do not require Chrome or network access. TypeScript compilation and the
test suite form the release gate.
