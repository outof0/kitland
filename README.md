# Kitland

**Tools out. Work on.**

Everyday developer tools, in one place — local-first, open source, no account.

| | |
| --- | --- |
| **Author** | OutOf0 \<hello.outof0@gmail.com\> |
| **License** | MIT |
| **Version** | 0.1.0 |

## Layout

```text
apps/web/       Public landing (Vite · React · Tailwind)
brand/          Logos, icons, tokens, voice
design/         design.pen + HTML export reference
```

## Develop

Node **≥ 22**, pnpm **9**.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm typecheck
pnpm build
```

## Deploy — Cloudflare Pages

Two options (pick one).

### A. Git integration (dashboard)

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → connect GitHub repo.
2. Build settings:

| Field | Value |
| --- | --- |
| Framework preset | Vite (or None) |
| Root directory | `/` (repo root) |
| Build command | `pnpm install && pnpm build` |
| Build output directory | `apps/web/dist` |

3. Environment variables (build):

| Name | Value |
| --- | --- |
| `NODE_VERSION` | `22` |

Cloudflare detects pnpm via `packageManager` in root `package.json`.

4. Custom domain: project **Custom domains** → add `kitland.dev` (DNS on Cloudflare).

### B. GitHub Actions (already wired)

Workflow: `.github/workflows/ci.yml`  
On push to `main`: typecheck → build → `wrangler pages deploy`.

Add repository secrets:

| Secret | Where to get it |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → create token with **Cloudflare Pages: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Workers & Pages right sidebar / Overview |

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

## License

MIT © 2026 OutOf0
