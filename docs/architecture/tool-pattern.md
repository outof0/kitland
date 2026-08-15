# Tool vertical-slice pattern (reference: Base64)

> **Golden path:** Base64 is the first reference implementation. Clone its
> interaction contract, not an older KIT-0001 spike or a screenshot in
> isolation. The authoritative UI boundary is
> [the Tool UI design-system contract](./tool-ui-contract.md).

**Card:** `.hermes/kanban/cards/KIT-0001.md`
**Plan:** `.hermes/plans/KIT-0001.md`
**Board:** `docs/kanban/BOARD.md`

## Locked product rules

| Rule                    | Choice                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| UI system               | shadcn/ui primitive contracts + Tailwind token-backed composition; see the UI contract                                    |
| Transform               | **Live** on input change via `@kitland/core`; use a true explicit Run only when a tool specification requires it          |
| Direction change        | Encode/Decode and Swap transfer a valid, fitting visible result into input before changing direction                      |
| Unsafe direction change | Disable during processing; retain the safe direction and explain a target-limit block without creating a validation error |
| Header actions          | Tool-global actions only: Sample and explicit Share-input disclosure for Base64; avoid duplicate pane actions             |
| Pane actions            | Input owns Copy/Upload/Clear; output owns Copy/Save                                                                       |
| Center rail             | Transform-only Swap; never duplicate Copy or Save there                                                                   |
| Confirmation            | Copy/Share succeeds with a short control-local check plus announcement; errors/info are actionable and readable           |
| Wrap chrome             | Out by default; the editor wraps long values without a separate toggle unless a tool design requires one                  |
| Persist (localStorage)  | `theme`, `favorites` only                                                                                                 |
| Do **not** persist      | Tool input / output drafts                                                                                                |
| Design source           | `design/design.pen` frames; evidence at 3 breakpoints                                                                     |
| Landing entry           | Generic primary CTA → `/explore`; only explicit implementation-status entries link to `/explore/<slug>`                   |

### Anti-patterns (do not clone)

- A visible label such as Encode/Decode that secretly copies output
- Duplicate Copy, Clear, or Save actions across header, rail, and pane toolbar
- A center rail that mixes transform controls with result actions
- A persistent or layout-shifting success message for Copy/Share
- A mode switch that turns an existing valid result into a red validation error
- Persisting tool payload in localStorage by default
- Treating the reference tool as the product center instead of one conformance fixture

## Design source of truth

- **`design/design.pen`** is canonical for visual hierarchy, tool workspace,
  sidebar, and responsive handoff.
- Base64 sample frames: **`Base64` (`Z1RWQB`)**, **`Sidebar` (`YAKHt`)**, **`Tool Screen Template` (`ryysV`)**, **`KitlandResponsiveHandoff`**.
- Use the [Tool UI design-system contract](./tool-ui-contract.md) for primitive
  behavior, focus, disabled, error, tooltip, and drawer states that a static
  frame does not specify.
- Prefer Pencil MCP with the file open in Pen. If the editor is unavailable,
  use a committed HTML/image export as review evidence; never read `.pen` files
  directly.
- Missing frame or committed export → design-needed; do not invent layout.

## Package boundaries

```text
packages/core            Pure encode/decode (no React, no DOM host APIs)
packages/tools    Metadata: id, slug, family, UI pattern, status
apps/web                 Thin workspace shell + pattern UI for the tool
```

```text
apps/web → tool-catalog → (metadata only)
apps/web → core         → pure run*
```

Do **not** put platform APIs (`window`, `vscode`, `chrome`) inside `core`.

## How to add each catalog tool

1. **Core** — `packages/core/src/tools/<name>.ts` + tests, return `ToolResult<T>`.
2. **Catalog** — declare the tool with `defineTool()`, including explicit web,
   browser-extension, and vscode-extension capability contracts, then register
   it in `TOOLS`. See [the platform contract](./platform-capabilities.md).
3. **Design** — identify frame id/name in `design.pen` before UI.
4. **Web UI** — compose the local shadcn primitives and proven tool composites;
   add an exhaustive lazy loader in the typed registry; implement the declared
   interaction contract from [tool-patterns.md](./tool-patterns.md). Do not
   eagerly import renderer code into the shared workspace chunk, copy raw shell
   CSS, or invent alternate action placement.
5. **Verify** — `pnpm test && pnpm typecheck && pnpm build` + keyboard/manual
   matrix at desktop, tablet, and 320 px mobile in light and dark themes.

## Sample routes

| Path              | Behavior                                 |
| ----------------- | ---------------------------------------- |
| `/`               | Suite landing (generic CTAs → catalog)   |
| `/explore`        | Static catalog and implementation status |
| `/explore/base64` | Golden Base64 tool                       |

## localStorage keys

```text
kitland.theme
kitland.favorites          // string[] of slugs; first-run seed []
```

Both preferences use the versioned `{ version, value }` envelope and runtime
decoders in `apps/web/src/lib/storage.ts`. Raw pre-versioned values migrate on
read. Unknown future versions are preserved until the user explicitly changes
that preference, so an older deployment cannot silently downgrade stored data.

## Boundaries of the golden sample

- Installing or migrating shadcn primitives as a side effect of one tool (use a dedicated UI-foundation change)
- Server routes (tools are browser-local)
- Copying host-specific VS Code / browser adapter behavior back into the web
  component; catalog exposure is declared explicitly and is never inferred
  from availability on another host
- Global ⌘K search
- The other 63 tool implementations; the suite rollout is tracked separately
