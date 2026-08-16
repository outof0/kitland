# @kitland/ui

Host-agnostic Kitland tool shells. **Same UI for every host tool surface** —
web workspace, extension popup, VS Code webview, and other wraps only supply:

- registry slug + `HostTransformSpec`
- `HostRuntime` (crypto / bcrypt / RSA)

## Non-goals (host wrap)

- Share links (Web-only injected feature, per tool: `share` prop on Base64Tool)
- Network
- Persistence

## Shared Tailwind theme (single source of truth)

Every host compiles Tailwind against the same Kitland design tokens:

- `tokens.css` — design.pen light/dark variables (`--bg`, `--surface`, …).
- `theme.css` — Tailwind entry: tokens + `@theme inline` mappings
  (`bg-bg`, `text-on-muted`, `border-outline`, …) + base resets. Hosts import
  it after `@import "tailwindcss";`.
- `sources.css` — `@source` scan targets for hosts that mount the shared
  React components. Hosts that only use the theme (VS Code webview) skip it.

```css
@import "tailwindcss";
@import "@kitland/ui/theme.css";
@import "@kitland/ui/sources.css"; /* only when mounting ui components */
```

The VS Code webview maps VS Code theme variables onto the same token names,
so webview chrome matches the web workspace 1:1 while following the active
IDE theme.

## Usage

```tsx
import { GenericTransformTool } from "@kitland/ui";
import { createRoot } from "react-dom/client";

const root = createRoot(container);
root.render(
  <GenericTransformTool
    slug="case-converter"
    spec={getHostTransformSpec("case-converter")}
    getRuntime={() => getHostRuntime()}
    capabilities={{ fileOpen: false, fileSave: false }}
  />,
);
```

Patterns follow registry `pattern` (transform / generate / diff / inspect) and
host-spec flags (`allowEmptyInput`, `secondaryInput`). Diff tools render the
shared editor's A | Swap | B layout with the secondary input passed to
`spec.transform` as `secondaryInput`.

`capabilities` (`ToolCapabilities`) declares host powers: `fileOpen` /
`fileSave` show or hide upload/save controls. Defaults to `FULL_CAPABILITIES`;
privacy-constrained hosts pass `LOCAL_ONLY_CAPABILITIES`. Share is never part
of capabilities — hosts that must not create links simply omit the `share` prop.
