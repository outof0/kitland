# ADR 0001: Astro static delivery with React islands and Shadcn

- **Status:** accepted
- **Date:** 2026-08-15
- **Owner:** Kitland maintainers

## Context

Kitland is intended to grow from one Base64 sample into roughly 64
browser-local developer tools. Every public tool route must be independently
indexable, carry its own title/description/canonical/Open Graph data, and
return a real 404 when it does not exist. The current Vite React SPA ships one
document for every route and therefore cannot meet those requirements without
a separate, fragile prerender pipeline.

The existing UI is already authored with Tailwind v4. Astryx was considered as
an alternative design system, but it is currently beta and would require a
large StyleX-oriented migration of an existing Tailwind codebase. Introducing
it beside Tailwind would create two competing component and token systems.

## Decision

Use the following web architecture:

```text
Astro (static routes, HTML, SEO metadata, 404s, sitemap)
└── React 19 islands (interactive tool workspace and editors only)
    └── Tailwind v4 + Shadcn/Radix (the single UI component system)
        ├── @kitland/core (pure bounded transforms)
        └── @kitland/tools (tool and SEO metadata)
```

- Astro is the route and document owner. It statically generates `/`, the
  `/explore` catalog/status page, and each available `/explore/<slug>` route
  from the catalog. The suite catalog never redirects to the first reference
  implementation.
- React is retained only where browser state and interactions are needed. Tool
  workspaces mount with `client:only="react"` because each renderer is a lazy
  route chunk; Astro owns the static h1 fallback and substantive SEO guide so
  React does not emit streaming fallback scripts into prerendered HTML.
  Nonessential landing interactions use a later hydration directive or plain
  HTML.
- Tailwind is the styling implementation layer. Local shadcn source in
  `apps/web/src/components/ui` owns static controls, focus behavior, and form
  semantics. CSS variables map semantic tokens onto the Kitland palette; no
  second palette is introduced.
- Strict CSP is a product requirement. Radix primitives that inject inline
  positioning or roving-focus styles are not adopted until they have a
  CSP-compatible adapter and browser regression test. The current drawer and
  icon affordances use semantic HTML plus local Button composition instead.
- Custom CSS is limited to layout and tool-specific content (for example a
  two-pane code editor). New raw buttons, dialogs, tooltips, segmented
  controls, cards, and form fields are prohibited when a Shadcn primitive
  exists.
- Launch uses Astro `output: "static"`. There is no request-time transform or
  SSR runtime at launch. A Cloudflare Worker adapter is considered only if a
  future approved feature needs authenticated or on-demand server rendering.

## Alternatives considered

### Vite React SPA + Shadcn

Retaining Vite would minimize short-term migration, but route-specific SEO,
canonical documents, social metadata, and real 404s would depend on a custom
prerender/rewrites system. The current single initial JS chunk already exceeds
the 500 kB warning threshold, so a SPA shell is the wrong delivery default for
mostly static search-entry pages.

### Astryx + React

Astryx has a coherent token and component offering, but it is beta. It is a
good future candidate for a greenfield Meta/StyleX product, not the least-risk
choice for this existing Tailwind project and its public OSS template. Do not
mix Astryx components or StyleX tokens into this app.

### Astro without React

This would optimize static pages further but would force a needless rewrite of
the local editor, clipboard, upload, focus management, and future tool UI.
React islands preserve the tested interactive boundary while Astro removes the
SPA routing and SEO problem.

## Consequences

### Positive

- Each tool is a real static page with crawlable, route-specific metadata.
- Client JavaScript is explicitly scoped to interactive islands instead of
  booting a whole-site SPA for every search visitor.
- The existing pure core and catalog package boundaries remain valid for web,
  future adapters, and an optional local MCP adapter.
- Shadcn component source remains owned and reviewable by this repository;
  Tailwind v4 and React 19 remain first-class supported paths.

### Costs and risks

- The host migration replaces the Vite entry point and client router with
  Astro pages. It must not be mixed with a catch-all SPA rewrite.
- Shadcn is source-owned rather than a frozen black-box package. Maintainers
  must review CLI component updates and keep the UI contract current.
- A React island is still client JavaScript. Large transformations need a
  Worker before broad large-input rollout; Astro does not solve main-thread
  computation.

## Cutover and rollback

1. Add Astro, the React integration, and a static `astro.config` while keeping
   `@kitland/core`, the catalog, and current React tool components intact.
2. Create Astro layout/pages with `getStaticPaths()` sourced from the catalog,
   route metadata, JSON-LD, sitemap, robots, and a true 404 page.
3. Render the current workspace as a React island, then remove `App.tsx`, the
   history router, Vite SPA redirects, and Vite-only SEO generation once
   parity checks pass.
4. Convert static landing content out of the full-page React island
   incrementally. Public route changes are deliberate cutovers: do not retain
   legacy duplicate routes or redirects.
   The `/tools` → `/explore` change is one such cutover: `/tools` is not a
   supported alias and must return 404 rather than redirect.
5. Rollback is a deployment rollback to the previously verified static
   artifact. Do not retain a second live route implementation after cutover.

## Acceptance criteria

- View source for every public tool route contains correct route-specific
  title, description, canonical URL, Open Graph fields, and JSON-LD before
  hydration.
- Unknown tool routes return HTTP 404.
- The sitemap and generated page set derive from the same catalog release.
- The Base64 tool works with JavaScript enabled; its static document still
  gives a useful purpose, privacy statement, and usage guidance without it.
- CI checks route HTML, sitemap/robots, headers, accessibility, bundle budget,
  and browser behavior before deployment.
