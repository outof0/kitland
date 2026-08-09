# Kitland

**Tools out. Work on.**

Everyday developer tools, in one place — local-first, open source, no account.

> **Pre-release development snapshot:** the first production release is gated on
> the exact, product-approved 64-tool catalog across the repository's platform
> contracts. Individual reference implementations do not make the suite
> release-ready.

|             |                                   |
| ----------- | --------------------------------- |
| **Author**  | OutOf0 \<hello.outof0@gmail.com\> |
| **License** | MIT                               |
| **Version** | 0.1.0                             |

## Layout

```text
apps/web/                 Astro catalog/landing + lazy React tool islands
apps/browser-extension/   Permission-free MV3 catalog + lazy tool adapters
apps/vscode-extension/    Desktop/web extension host + secure tool panel
packages/core/            Pure bounded tool logic (no platform APIs)
packages/tool-catalog/    Identity, platform contracts, release readiness
brand/                    Logos, tokens, voice, and handoff rules
design/                   Pencil source + committed export evidence
docs/                     ADRs, architecture contracts, UX audit, rollout
```

## Develop

Node **≥ 22.12.0**, pnpm **9**.

```bash
pnpm install
pnpm dev                   # web: http://localhost:5173
pnpm dev:browser-extension # popup development host
pnpm test
pnpm typecheck
pnpm build                 # all three product surfaces
pnpm quality:check         # normal incremental CI gate
```

`pnpm release:verify` is deliberately stricter than normal CI. It stays red
until all 64 Pencil-approved tools are release-ready with resolved platform
contracts. The inventory is committed; 63 tool slices are intentionally still
planned, so a partial suite cannot be deployed.

Start with the [64-tool rollout playbook](docs/product/tool-rollout.md),
[interaction pattern contracts](docs/architecture/tool-patterns.md), and
[platform capability contract](docs/architecture/platform-capabilities.md).
The current Base64 route is a conformance fixture for the transform pattern,
not the catalog scope.

## Platform checks

```bash
pnpm --filter @kitland/web test:e2e
pnpm --filter @kitland/browser-extension check
pnpm --filter kitland-developer-tools package:smoke
pnpm test:integration:vscode # downloads the pinned VS Code test host
```

Production artifact creation is reserved for the coordinated release gate:

```bash
pnpm artifacts:check # browser ZIP + VSIX package validation
pnpm release:check   # quality + exact catalog gate + artifacts
```

## Deploy — Cloudflare Pages

Two options (pick one).

### A. Git integration (dashboard)

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

### B. GitHub Actions (already wired)

Workflow: `.github/workflows/ci.yml`  
On push to `main`: formatting → lint → typecheck → unit tests → dependency
audit → all-surface builds → web/extension package budgets → web and browser
extension smoke tests → pinned VS Code Extension Host tests → static SEO and
delivery verification. Production deploy then runs the separate exact-suite
gate before downloading and deploying the already verified web artifact.

Run the normal development gate locally with `pnpm quality:check`. It expects
the Playwright Chromium runtime installed; `pnpm --filter @kitland/web exec
playwright install chromium` installs it once. `pnpm release:check` additionally
enforces the intentionally incomplete product-release contract.

Add repository secrets:

| Secret                  | Where to get it                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare → My Profile → API Tokens → create token with **Cloudflare Pages: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Workers & Pages right sidebar / Overview                                            |

After both secrets exist, add the repository variable
`CLOUDFLARE_PAGES_ENABLED=true`. Deployment is explicit opt-in; leaving the
variable unset keeps the deploy job skipped while CI still verifies the build.
Even when enabled, CI blocks production deployment until the machine-readable
64-tool catalog release gate passes.

Create the Pages project once (name must match `kitland`):

```bash
pnpm install
pnpm exec wrangler login
pnpm exec wrangler pages project create kitland --production-branch=main
pnpm pages:deploy
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
