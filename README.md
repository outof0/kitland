# Kitland

**Tools out. Work on.**

Local-first developer tools for the web, browser extensions, VS Code, and MCP.
Inputs stay on the device; Kitland has no account requirement, telemetry, or
default payload persistence.

> **Release status — 0.1.1 candidate.** A public release exists only after the
> tagged release workflow has published every required distribution, deployed the
> verified web artifact, and created the GitHub Release. A merged branch, an
> artifact, or a locally built extension is not a release.

|             |                                   |
| ----------- | --------------------------------- |
| **Author**  | OutOf0 \<hello.outof0@gmail.com\> |
| **License** | MIT                               |
| **Version** | 0.1.1                             |

## Repository layout

```text
apps/web/                 Astro landing, registry, and lazy React tool islands
apps/browser-extension/   Permission-free MV3 registry and local adapters
apps/vscode-extension/    Desktop/web extension host and secure tool panel
packages/core/            Pure bounded tool logic (no platform APIs)
packages/tools/           Tool identity, platform contracts, release readiness
packages/ui/              Shared shell, editor primitives, and visual tokens
docs/                     ADRs, architecture contracts, UX evidence, rollout
```

## Develop and verify locally

Requires Node **22.12.0+** and pnpm **9.12.0**.

```bash
pnpm install --frozen-lockfile
pnpm dev                   # http://localhost:4321
pnpm dev:browser-extension # popup development host
pnpm quality:check         # format, lint, types, tests, builds, packages, e2e
pnpm release:preflight     # full local release gate plus workflow/config checks
```

`release:preflight` is the command to run before pushing a release branch or
tag. It runs the full quality/artifact gate, the pinned VS Code Extension Host
integration suite, and release-configuration validation: four synchronized
package versions, `kitland` VS Code publisher, immutable action pins, required
credential gates, Pages production deployment, and GitHub Release ordering. It
does not read or print store credentials; real ownership/permission checks
happen in the protected release job.

For focused host work:

```bash
pnpm --filter @kitland/web test:e2e
pnpm --filter @kitland/browser-extension test:smoke
pnpm test:integration:vscode
pnpm artifacts:all
```

The coordinated product gate requires the exact 65-tool registry. A smaller
web-only certification remains available for explicitly approved rollout
targets with `pnpm release:check:rollout`; it does not authorize extension or
npm publication. Read the [rollout playbook](docs/product/tool-rollout.md) and
[platform capability contract](docs/architecture/platform-capabilities.md)
before changing a tool surface.

## Distribution and release

| Surface | Public destination                           | Release guard                                                              |
| ------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| Web     | Cloudflare Pages (`kitland.dev`)             | deploy verified `apps/web/dist` to `main` only after stores succeed        |
| MCP     | npm `@kitland/mcp`                           | package allowlist, live stdio smoke, provenance, immutable integrity check |
| VS Code | Marketplace publisher `kitland` and Open VSX | VSIX smoke/package checks and both store APIs                              |
| Browser | Chrome Web Store and Firefox AMO             | deterministic ZIPs, manifest/CSP checks, both store APIs                   |

The release workflow is all-or-nothing for npm, both browser stores, and the
web deployment. VS Code Marketplace and Open VSX publish only when their PAT is
configured; otherwise the workflow warns and continues with the verified VSIX
attached to the GitHub Release. A rejected configured-store submission still
stops the release.

Follow the exact setup and release checklist in [RELEASING.md](RELEASING.md).
The release workflow reads publishing credentials directly from GitHub Actions
repository secrets. `NPM_TOKEN` is the single npm secret; the job maps it to
the runtime variable `NODE_AUTH_TOKEN` expected by npm.

## Cloudflare Pages setup

Create the Pages project once (project name `kitland`, production branch
`main`), then configure the two repository secrets documented in
[RELEASING.md](RELEASING.md): `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`.

```bash
pnpm exec wrangler login
pnpm exec wrangler pages project create kitland --production-branch=main
pnpm pages:dev # local preview of the production build
```

Do not manually deploy a public release from a local directory. The tagged
workflow deploys the exact artifact that passed the release gate and pins it to
the Pages production branch.

## Project policies

- [Contributing](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Support](SUPPORT.md)
- [Changelog](CHANGELOG.md)
- [Architecture](docs/architecture/README.md)

## License

MIT © 2026 OutOf0
