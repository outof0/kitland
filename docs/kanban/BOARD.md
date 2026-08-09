# Kitland Kanban board

> Generated index. **Source of truth:** `.hermes/kanban/cards/*.md`
> Last updated: 2026-08-09

## WIP

| Column       | Count | Limit |
| ------------ | ----: | ----: |
| In Progress  |     0 |     2 |
| Review       |     0 |     3 |
| Verification |     1 |     2 |
| Expedite     |     0 |     1 |

No WIP violations.

## By column

### Verification

| Id                                                 | Title                    | Priority | Owner | Notes                                                                    |
| -------------------------------------------------- | ------------------------ | -------- | ----- | ------------------------------------------------------------------------ |
| [KIT-0001](../../.hermes/kanban/cards/KIT-0001.md) | Base64 golden-path UI/UX | P0       | grok  | Gates green; **needs human visual sign-off** vs `design.pen` before Done |

### Blocked

| Id                                                 | Title                              | Priority | Blocker                  |
| -------------------------------------------------- | ---------------------------------- | -------- | ------------------------ |
| [KIT-0003](../../.hermes/kanban/cards/KIT-0003.md) | Canonical 64-tool inventory        | P0       | Product list not in repo |
| [KIT-0004](../../.hermes/kanban/cards/KIT-0004.md) | Tool factory + conformance harness | P0       | KIT-0003 inventory       |

### Ready

| Id                                                 | Title                   | Priority | Owner      |
| -------------------------------------------------- | ----------------------- | -------- | ---------- |
| [KIT-0002](../../.hermes/kanban/cards/KIT-0002.md) | Second UI-pattern slice | P1       | unassigned |

### Inbox / In Progress / Review / Done

_None (or see archive later)._

## Next recommended pull

1. **Product owner:** commit or identify the authoritative 64-tool list for KIT-0003.
2. Pull KIT-0002 to prove a non-transform UI pattern without waiting on more Base64 polish.
3. After KIT-0003, build KIT-0004 and distribute disjoint vertical slices in waves.

## Recently completed

_None marked Done yet._

## Notes

- Current interaction model is in `docs/architecture/tool-ui-contract.md`; the
  early D1–D9 plan is retained as historical delivery context only.
- Base64 is a conformance reference, not the landing/product focus and no
  longer a blocker for parallel tool work.
- `pnpm test` / `typecheck` / `build` passed 2026-08-09.
