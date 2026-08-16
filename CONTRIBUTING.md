# Contributing to Kitland

Thanks for helping make Kitland useful, predictable, and safe for people who
handle developer data.

## Before you start

- Use Node 22 or newer and pnpm 9, as pinned in `.nvmrc` and `package.json`.
- Read the [architecture index](docs/architecture/README.md) and the
  [tool UI contract](docs/architecture/tool-ui-contract.md) before adding a
  tool.
- For a security issue, follow [SECURITY.md](SECURITY.md) rather than opening a
  public issue.

## Local workflow

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @kitland/web exec playwright install chromium # first run only
pnpm quality:check
```

`pnpm build` builds all three product surfaces and generates the web sitemap
from available registry entries. `pnpm quality:check` adds formatting, linting,
typechecks, unit tests, dependency audit, bundle/SEO/package gates, and web plus
browser-extension smoke suites. The browser suites serve production output,
not development servers. `pnpm release:check` is intentionally unavailable to
incomplete product work because it also requires the exact 64-tool release
inventory and coordinated artifacts.

## Contribution rules

1. Keep tool logic platform-neutral in `packages/core`; do not import browser,
   extension, or UI APIs there.
2. Register a tool in the registry and add focused tests for its core behavior.
   Declare every platform explicitly; `planned` is not permission to expose a
   tool, and `unsupported` must have no capabilities. Follow the
   [platform capability contract](docs/architecture/platform-capabilities.md).
3. Do not persist tool payloads, log secrets, or add telemetry without an
   approved privacy decision.
4. Preserve accessible names, keyboard behavior, visible focus, and responsive
   behavior. Test desktop, tablet, and narrow mobile widths for UI changes.
5. Keep changes small and explain any intentional deviation from a documented
   contract.
6. Do not commit generated build output, local environment files, credentials,
   or real user payloads.
7. Treat new clipboard, file, editor, persistence, telemetry, network, or remote
   processing behavior as a capability/security change and document its least-
   privilege impact in the pull request.

## Pull requests

Describe the user problem, implementation, tests run, and any privacy,
security, accessibility, compatibility, or performance impact. A maintainer
may ask for a reproduction, a regression test, or a design/architecture record
before merging.

By contributing, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
