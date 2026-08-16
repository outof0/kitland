# Security Policy

## Reporting a vulnerability

Do **not** open a public issue for a suspected vulnerability. Send a concise
report to `hello.outof0@gmail.com` with the subject `[Kitland security]`.

Include the affected component or URL, reproduction steps, impact, and a safe
proof of concept. Do not include live credentials, private keys, tokens, or
other sensitive user data.

Maintainers will validate the report, coordinate a fix, and agree on disclosure
timing with the reporter when appropriate.

Response targets are an acknowledgement within three business days and an
initial severity/scope assessment within seven business days. These are
best-effort targets rather than a service-level agreement. If investigation
takes longer, the maintainer will provide a status update at least every 14 days
while a report remains active.

## Supported releases

The current `0.1.x` line is a maintained development line, not a completed
public production release. Reference implementations do not bypass the
complete 64-tool release gate. Security fixes are made on the latest source
snapshot unless a future release note establishes another supported line.

## Scope

Reports are welcome for the web application, browser extension, VS Code
extension, `@kitland/core`, tool registry, build/deployment workflow, and
first-party dependencies. Third-party hosted services should also be reported
when the issue is caused by Kitland's configuration or integration.

Dependency-confusion reports, malicious release artifacts, compromised GitHub
Actions, extension permission escalation, and package/deployment provenance
issues are also in scope. Reports that only identify an outdated dependency
without a demonstrated affected path may be handled as ordinary maintenance.
