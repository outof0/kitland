# Packages

Shared packages for the Kitland monorepo. Planned per `hermes.md`:

- `core` — pure domain logic
- `tool-catalog` — tool definitions
- `contracts` — shared DTOs / validation
- `ui` — AstryX × Kitland composition
- `config` — shared TS / Vite / lint / Tailwind config
- platform adapters (`platform-web`, `platform-vscode`, `platform-chrome`)

Landing (`apps/web`) ships first; packages land with the workbench vertical slice.
