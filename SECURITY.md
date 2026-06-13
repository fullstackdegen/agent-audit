# Security Policy

## Reporting a Vulnerability

Do not disclose suspected vulnerabilities in a public issue. Use the repository
owner's private security reporting channel after the project is published.
Include reproduction steps, affected versions, and the expected security
impact.

## Deployment Guidance

This server launches a browser against user-provided URLs. Application-level URL
validation is defense in depth, not a complete isolation boundary. Production
deployments should:

- Deny egress to loopback, private, link-local, and cloud metadata networks.
- Run the process with the least operating-system privileges available.
- Keep Chrome sandboxing enabled whenever the environment supports it.
- Update the MCP SDK, Lighthouse, Chrome launcher, and Chrome regularly.
- Avoid exposing the stdio process through an unauthenticated network service.

The maintainers will document remediation and release information after a
reported issue has been investigated.
