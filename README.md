# Kitland

**Tools out. Work on.**

Local-first developer tools for the web, browser extensions, VS Code, and MCP.
Inputs stay on the device; Kitland has no account requirement, telemetry, or
default payload persistence.

> **Release status — 0.1.1 candidate.** A public release exists only after the
> tagged release workflow has published every distribution, deployed the
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

The full release workflow is deliberately all-or-nothing: a missing token,
rejected store submission, or failed Pages deployment stops before the GitHub
Release is created. The workflow attaches the produced VSIX, browser ZIPs, and
MCP tarball to that release.

Follow the exact setup and release checklist in [RELEASING.md](RELEASING.md).
It explains where the npm token belongs: its Secret Manager key is `npm-token`
and the job exposes it only as `NODE_AUTH_TOKEN`; there is no `NPM_TOKEN`
GitHub secret in this repository.

## Cloudflare Pages setup

Create the Pages project once (project name `kitland`, production branch
`main`), then configure the two production-environment secrets documented in
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
