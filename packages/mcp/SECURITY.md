# Security Policy

## Reporting a Vulnerability

Do **not** open a public GitHub issue for security vulnerabilities. Send a concise report to `hello.outof0@gmail.com` with the subject `[Kitland MCP Security]`.

Include the affected package version, reproduction steps, impact, and a safe proof of concept. Do not include sensitive user data.

## Security Boundary & Supported Releases

The `@kitland/mcp` package runs locally over `stdio` without external network connections or persistence. Vulnerability reports regarding local privilege escalation, unexpected capability exposure (such as unintended filesystem, network, or process execution), or memory/envelope denial-of-service are in scope.

Security fixes are provided for the latest published release.
