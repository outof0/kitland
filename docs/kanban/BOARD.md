# Kitland Kanban board

> Generated index. **Source of truth:** `.hermes/kanban/cards/*.md`
> Last updated: 2026-08-15

## WIP

| Column       | Count | Limit |
| ------------ | ----: | ----: |
| In Progress  |     0 |     2 |
| Review       |    18 |     3 |
| Verification |     2 |     2 |
| Expedite     |     0 |     1 |

## Path B + shared UI (agent complete)

| Surface           | Tools | UI                                                                         |
| ----------------- | ----: | -------------------------------------------------------------------------- |
| Web               |    64 | React ToolChrome / pattern workspaces                                      |
| Browser extension |    64 | **@kitland/ui** shell (61) + specialty Base64/cURL/JSON                    |
| VS Code           |    64 | Webview **ktu-*** shell (shared tokens from `@kitland/ui`) + host adapters |

- Package: `packages/ui` → **`@kitland/ui`** (renamed from tool-ui).
- No file-open / share / network on host shells.
- Registry: 64 available on all three platforms; all 64 tools release-ready.

## By column

### Verification (human)

- KIT-0001, KIT-0005 — visual sign-off vs design.pen

### Review

- KIT-0002, 0004, 0006–0020 — agent evidence ready

### Done

- KIT-0003 — 64-tool inventory

## Human next

1. Pencil / visual sign-off
2. ~~Promote remaining implemented → release-ready~~ — complete: all 64 tools release-ready (2026-08-15)
3. Marketplace publish decision (KIT-0020)
