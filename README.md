# Kitland

**Tools out. Work on.**

Everyday developer tools, in one place — local-first, open source, no account.

> **Pre-release development snapshot:** the coordinated product launch remains
> gated on the exact, product-approved 65-tool registry across the repository's
> platform contracts. Finished tools can be certified for rollout on a specific
> surface without shrinking the public 65-tool registry or publishing an
> extension marketplace artifact.

|             |                                   |
| ----------- | --------------------------------- |
| **Author**  | OutOf0 \<hello.outof0@gmail.com\> |
| **License** | MIT                               |
| **Version** | 0.1.1                             |

## Layout

```text
apps/web/                 Astro registry/landing + lazy React tool islands
apps/browser-extension/   Permission-free MV3 registry + lazy tool adapters
apps/vscode-extension/    Desktop/web extension host + secure tool panel
packages/core/            Pure bounded tool logic (no platform APIs)
packages/tools/    Identity, platform contracts, release readiness
brand/                    Logos, tokens, voice, and handoff rules
design/                   Pencil source + committed export evidence
docs/                     ADRs, architecture contracts, UX audit, rollout
```

## Develop

Node **≥ 22.12.0**, pnpm **9**.

```bash
pnpm install
pnpm dev                   # web: http://localhost:4321
pnpm dev:browser-extension # popup development host
pnpm test
pnpm typecheck
pnpm build                 # all three product surfaces
pnpm quality:check         # normal incremental CI gate
```

`pnpm release:verify` is deliberately stricter than normal CI. It stays red
until all 65 tools are release-ready with resolved Pencil and platform
contracts. `pnpm release:verify:rollout` is separate and certifies only the
tools explicitly declared for the web surface in `releasePlatforms`. Each
target must be canonical, `release-ready`, and available on that surface.
Certification never changes the 65-tool landing page, Explore registry, or
which registry-available editor routes ship in the web artifact.

Start with the [65-tool rollout playbook](docs/product/tool-rollout.md),
[interaction pattern contracts](docs/architecture/tool-patterns.md), and
[platform capability contract](docs/architecture/platform-capabilities.md).
Each rollout target follows the same registry and surface contract; no one tool
defines the public registry scope.

## Platform checks

```bash
pnpm --filter @kitland/web test:e2e
pnpm --filter @kitland/browser-extension check
pnpm --filter kitland-tools package:smoke
pnpm test:integration:vscode # downloads the pinned VS Code test host
```

Use the coordinated release gate for the complete product launch:

```bash
pnpm artifacts:check # browser ZIP + VSIX package validation
pnpm release:check   # quality + exact registry gate + artifacts
```

For a certified public web rollout, use the separate gate. It runs the normal
quality suite first, then certifies the web targets against their host
contracts. It deploys the normal full web artifact: every registry-available
tool keeps its editor route, while planned tools remain visible as planned:

```bash
pnpm release:check:rollout
```

This command does not publish the browser extension or VS Code extension.

## Deploy — Cloudflare Pages

Two options (pick one).

### A. Git integration (dashboard, complete-suite launch only)

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → connect GitHub repo.
2. Build settings:

| Field                  | Value                                   |
| ---------------------- | --------------------------------------- |
| Framework preset       | None (static Astro output)              |
| Root directory         | `/` (repo root)                         |
| Build command          | `pnpm release:verify && pnpm build:web` |
| Build output directory | `apps/web/dist`                         |

3. Environment variables (build):

| Name           | Value     |
| -------------- | --------- |
| `NODE_VERSION` | `22.12.0` |

Cloudflare detects pnpm via `packageManager` in root `package.json`.

4. Custom domain: project **Custom domains** → add `kitland.dev` (DNS on Cloudflare).

### B. GitHub Actions (complete suite or certified web rollout)

Workflow: `.github/workflows/ci.yml`  
On push to `main`: formatting → lint → typecheck → unit tests → dependency
audit → all-surface builds → web/extension package budgets → web and browser
extension smoke tests → pinned VS Code Extension Host tests → static SEO and
delivery verification. The `web-rollout` job downloads that same normal web
artifact, verifies the web certification contract and full public route set,
then smoke-tests it before it is eligible for deployment. The complete-suite
deploy continues to run the separate exact-suite gate against the same normal
web artifact.

Run the normal development gate locally with `pnpm quality:check`. It expects
the Playwright Chromium runtime installed; `pnpm --filter @kitland/web exec
playwright install chromium` installs it once. `pnpm release:check` additionally
enforces the intentionally incomplete product-release contract.

Add repository secrets:

| Secret                  | Where to get it                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare → My Profile → API Tokens → create token with **Cloudflare Pages: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Workers & Pages right sidebar / Overview                                            |

For a certified web rollout, leave `CLOUDFLARE_PAGES_ENABLED` unset and add
the repository variable `CLOUDFLARE_PAGES_ROLLOUT_ENABLED=true`. GitHub
Actions then deploys the normal full-registry web artifact after validating the
web rollout targets. It never uploads the browser extension ZIP or VS Code
VSIX to a marketplace.

For the coordinated 65-tool product launch, unset
`CLOUDFLARE_PAGES_ROLLOUT_ENABLED` and set `CLOUDFLARE_PAGES_ENABLED=true`.
That deploy remains blocked until the machine-readable complete-suite registry
gate passes. Keeping both variables unset leaves all deploy jobs skipped.

Create the Pages project once (name must match `kitland`):

```bash
pnpm install
pnpm exec wrangler login
pnpm exec wrangler pages project create kitland --production-branch=main
pnpm pages:deploy
```

For a local web deployment after the rollout gate passes:

```bash
pnpm pages:deploy:rollout
```

Local preview of the production build:

```bash
pnpm pages:dev
```

## Community, security, and release process

- [Contributing guide](CONTRIBUTING.md)
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Changelog](CHANGELOG.md)
- [Architecture index](docs/architecture/README.md), including the
  [SEO and prerender decision record](docs/architecture/seo-prerender.md)

## License

MIT © 2026 OutOf0
