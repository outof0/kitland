# Tool UI design-system contract

**Status:** current contract for the web tool workspace and every new tool.
**Scope:** `apps/web`; it does not introduce a dependency or migrate existing
components by itself.
**Supersedes:** the early KIT-0001 interaction choices that treated a visible
`Encode`/`Decode` button as a copy action, omitted Swap, or put Copy/Save in the
center rail.

## Decision

Kitland standardizes its web UI on **shadcn/ui component contracts** and
**Tailwind CSS token-backed composition**.

shadcn/ui is a local, composable component source rather than a hosted runtime
design system. The current application has Tailwind, Kitland tokens, and the
first local layer at `apps/web/src/components/ui/*` (Button, Card, Textarea,
and Toggle). When another primitive is introduced, add it once to that local UI
layer and use it from product components; do not copy a second version into
each of the 64 tools.

The official shadcn/ui catalog is the component reference. This project stages
primitives only after they pass its static-CSP browser check. In particular,
Radix overlays and roving-focus groups can inject inline styles, so they are
not a drop-in fit for this policy.

## Audit snapshot

The contract is based on the current three-layer workspace rather than an
abstract component inventory:

- `ToolWorkspace` owns responsive navigation state, background inertness,
  Escape handling, and focus return. Its current semantic drawer is deliberate:
  a Sheet migration needs a CSP-compatible adapter and equivalent browser
  evidence before replacing it.
- `ToolSidebar` owns catalog/favorite state and currently implements drawer
  focus containment itself. Sidebar/Collapsible primitives must replace only
  the duplicated interaction mechanics, not its product data rules.
- `Base64Tool` owns domain state and safe conversion semantics, but its editor
  cards and control groups compose local Button and Textarea primitives. The
  tool must not become another primitive factory.
- `tool-workspace.css` currently centralizes much of the shell's visual and
  interactive styling. New work should move to token-backed utility composition
  at the owning component boundary instead of adding a second CSS control
  system.
- The previous golden-path docs contradicted the tested interaction model
  (primary Copy disguised as Encode/Decode, no Swap, and Copy/Save in the rail).
  This contract and the updated pattern document remove that fork before more
  tools are rolled out.

## Ownership boundary

| Owner                             | Owns                                                                                                                     | Does not own                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `apps/web/src/components/ui/*`    | Generated/adapted shadcn primitives, their accessible behavior, variants, focus, disabled state, and token bindings      | Tool domain state, routing, catalog data, or per-tool copy                                                |
| `apps/web/src/components/tools/*` | Reusable Kitland shell composites assembled from primitives: navigation, workspace chrome, and shared tool affordances   | A second Button/Card/Textarea implementation or raw Radix wiring                                          |
| `apps/web/src/tools/*`            | Domain-specific workflow, calls to `@kitland/core`, tool copy, and composition of the shared primitives                  | Global layout CSS, bespoke primitive variants, or browser-platform behavior in `core`                     |
| Tailwind utilities                | Token-backed layout, spacing, responsive composition, and a one-off presentational adjustment inside an owning component | Reimplementing interactive states, colors, focus rings, or disabled behavior already owned by a primitive |
| `tokens.css`                      | Kitland semantic colors, typography, elevation, and theme values                                                         | Page-specific pixel values or component-specific state logic                                              |

### Required implementation rules

1. A new interactive primitive starts in `components/ui`, not in a tool file or
   a large page stylesheet. Use the shadcn primitive contract before adding a
   bespoke control.
2. Product composites can expose product props (for example `activeSlug` or
   `onSwap`), but they must compose `Button`, `Textarea`, and related local
   primitives rather than recreate their DOM and state behavior.
3. Tailwind classes may arrange primitives and apply Kitland token utilities.
   They must not fork a primitive's hover, focus-visible, disabled, or semantic
   status behavior with arbitrary values.
4. A CSS rule is justified only for a shared shell/layout concern that Tailwind
   cannot express cleanly. Keep it co-located with that shell and token-backed.
   Do not add a new all-tools stylesheet for one tool.
5. Icon-only actions require an accessible name; visible context or text is
   preferred, and a native `title` is only supplemental. Do not add a Radix
   tooltip until it passes the static-CSP browser check. Their visible hit
   target is at least 32 × 32 px; 40–44 px is preferred for primary touch
   actions.
6. Use semantic status text as well as color. Error/info feedback stays readable
   (the current Base64 reference keeps it for about four seconds or clears it on
   a relevant state change); transient successful Copy/Share confirmation is
   local to the invoked control, announced, and clears in about one second.
7. A static design frame defines visual hierarchy. When it does not specify
   keyboard, focus, loading, disabled, error, drawer, or tooltip behavior, the
   shadcn primitive contract governs those states.

## Current audit and target primitive map

This is a migration map, not permission to make three equivalent controls while
the migration is underway.

| Current surface              | Evidence in the current code                                                                                                             | Target shadcn/ui primitive(s)                                | Kitland ownership / invariant                                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ToolWorkspace`              | `components/tools/ToolWorkspace.tsx` owns theme, route selection, responsive drawer state, inert background, skip link, and focus return | `Button` for trigger/backdrop; semantic drawer composite     | The workspace remains the app-owned composite. It owns route, persistence, and focus-return policy; do not replace the drawer with a Radix overlay until strict-CSP behavior is tested.            |
| `ToolSidebar`                | `components/tools/ToolSidebar.tsx` owns favorites, section expansion, and focus containment                                              | `Button` and semantic navigation                             | Catalog/favorite logic stays in the composite. It should not grow a second icon-button implementation.                                                                                             |
| `ToolTopBar`                 | `components/tools/ToolTopBar.tsx` renders navigation, theme buttons, and favorite action                                                 | `Button`, fieldset-based pressed controls                    | It remains a shell composite. Theme and favorite persistence remain outside the primitive.                                                                                                         |
| Base64 header actions        | `tools/Base64Tool.tsx` has Sample and an explicit Share-input action                                                                     | `Button` variants; visible privacy notice                    | Header actions are global/session actions only. Share is opt-in, hash-only, and must disclose that the input is in the link. Do not put pane-local Copy/Clear here.                                |
| Base64 direction and format  | `Base64Tool.tsx` uses pressed Encode/Decode and Standard/Base64URL buttons                                                               | `Button` segments grouped by a semantic fieldset             | Direction is a workflow state, not a fake submit CTA. Switching moves a valid visible result into input; invalid/oversize transfers keep the safe state and explain why.                           |
| Base64 input editor          | `EditorCard` contains a textarea plus Copy, Upload, and Clear icons                                                                      | `Textarea`, icon `Button`, semantic card composite           | Input remains the source of truth. Copy/Upload/Clear belong to this pane because they operate on input.                                                                                            |
| Center conversion rail       | `Base64Tool.tsx` has the `ArrowLeftRight` Swap action                                                                                    | icon `Button` plus visible label                             | The rail is **transformation-only**. Swap invokes the same safe direction-change behavior as the selector; it is disabled while processing and must not turn a limit case into a validation error. |
| Base64 output editor         | `EditorCard` contains a read-only textarea with Copy and Save icons                                                                      | read-only `Textarea`, icon `Button`, semantic card composite | Copy and Save belong to the derived-result pane. There must be no duplicate center-rail Copy/Save control.                                                                                         |
| Errors, feedback, and status | Base64 uses alert/status text, per-control confirmation, and a status chip                                                               | `Alert`, `Toast`/Sonner, `Badge`                             | Validation is inline/adjacent to the input. Success confirmation must not reserve or shift editor layout; long-lived error/info messages must be actionable.                                       |

## Transform-tool interaction contract

These rules are the reusable behavior for Base64 and future live
transformations. A tool with a genuinely expensive or remote operation may
define a different, explicit run pattern in its own design/specification.

| Concern           | Required behavior                                                                                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Derivation        | Valid results update from input; do not label a copy action as Encode, Decode, Run, or Convert.                                                                                                                               |
| Direction switch  | Select Encode/Decode or press center Swap. When the visible result is valid and fits the next input contract, make it the new input before changing direction.                                                                |
| Unsafe swap       | While processing, disable direction-changing controls. If the next input limit would be exceeded, retain the current direction and show a concise explanation; never flash a red validation error caused only by the control. |
| Action placement  | Header: Sample + Share-input only. Input pane: Copy, Upload, Clear. Center rail: Swap only. Output pane: Copy, Save.                                                                                                          |
| Copy and Share    | Show a check state on the invoked control for about one second and announce it. Do not use a persistent page-level success message or cause a layout shift. Clipboard failure is an actionable error.                         |
| Share privacy     | Create a URL fragment only after explicit activation. The disclosure must say that the link contains the current input and should not be used for secrets. Never put tool input in a query string or persist it by default.   |
| Textarea metadata | Keep input/output metadata equally compact: one concise line in the pane footer. Put long contracts in an accessible description; do not make one editor visually taller because of helper copy.                              |

## Adoption sequence for the 64-tool rollout

1. Treat this contract and `docs/architecture/tool-pattern.md` as the source of
   truth for new tool UI decisions.
2. Extend the existing local shadcn foundation in a dedicated UI change. Button,
   Card, Textarea, and Toggle are staged. The next primitives (Alert, Badge,
   Separator, Sidebar, ScrollArea, Toast, Sheet, Tooltip, and ToggleGroup) need
   a static-CSP compatibility check before adoption. Review any new dependency
   and lockfile change in that change; do not install packages as a side effect
   of implementing one tool.
3. Migrate the workspace shell (`ToolWorkspace`, `ToolSidebar`, `ToolTopBar`)
   once, retaining its tested routing, persistence, and drawer-focus behavior.
4. Migrate Base64 as the reference composition, then extract only proven
   composites such as `ToolEditorCard` or `TransformRail` for reuse.
5. Every new tool composes the local primitives and the proven composites. It
   may not clone `tool-workspace.css` or invent an alternative control model.

## Review checklist

- Does the PR use a local shadcn primitive where one exists, rather than new
  hand-rolled interactive markup?
- Are all colors, focus, disabled states, and spacing token-backed?
- Can a keyboard user reach, understand, and dismiss/leave every transient
  state without a pointer?
- Does mobile reflow preserve one clear owner for every action and avoid
  duplicate Copy/Clear/Save controls?
- Does a visual review cover light/dark plus desktop, tablet, and 320 px mobile?
- Is any payload persistence/share behavior explicit, bounded, and
  privacy-reviewed?

## Historical note

The initial KIT-0001 plan/card recorded an early spike interaction model. It is
kept as delivery history, but its old D2/D4/B2/B3/B5/B9 control decisions are
not a template for later tools. The live code and this contract define the
current Base64 reference behavior.
