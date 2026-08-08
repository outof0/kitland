# Kitland

**Tools out. Work on.**

Everyday developer tools, in one place — local-first, open source, no account.

| | |
| --- | --- |
| **Author** | [OutOf0](mailto:hello.outof0@gmail.com) |
| **License** | MIT |
| **Domain** | [kitland.dev](https://kitland.dev) |
| **Version** | 0.1.0 |

## Repository layout

```text
apps/
  web/                 Public landing (Vite · React · Tailwind)
brand/                 Kitland brand kit (logos, tokens, voice)
design/
  design.pen           Canonical product design (Pencil)
  export/              HTML exports for implementation reference
docs/                  Architecture, ADR, kanban index
packages/              Shared packages (workbench slice — planned)
scripts/               Design export / tooling helpers
hermes.md              Delivery operating guide
```

## Develop

Requirements: **Node ≥ 22**, **pnpm 9**.

```bash
pnpm install
pnpm dev
```

Landing: [http://localhost:5173](http://localhost:5173)

```bash
pnpm build
pnpm typecheck
```

## What’s shipping in 0.1.0

Public **landing page** matching `design/design.pen` (desktop / tablet / mobile):

- Dark product marketing surface
- Catalog families, principles, local-first messaging
- Responsive layouts + motion (respects `prefers-reduced-motion`)
- Official brand marks from `brand/`

Workbench tools, Nitro server, VS Code / Chrome extensions are **next** (see `hermes.md`).

## Brand & design

- Brand assets: `brand/` — do not redraw logos.
- Design source: `design/design.pen`.
- Re-export landing HTML from Pencil: `python3 scripts/export-landing-from-pencil.py`

## License

MIT © 2026 OutOf0
