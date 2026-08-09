# ADR 0003: Release the complete 64-tool suite

- **Status:** accepted
- **Date:** 2026-08-09
- **Owner:** Kitland maintainers

## Context

Base64 is the first reference implementation used to stabilize tool contracts,
workspace behavior, accessibility, and platform adapters. Presenting it as the
main product, redirecting `/explore` to it, or shipping one tool at a time would
misrepresent Kitland's intended scope: a coherent suite of roughly 64 developer
tools across web, browser extension, and VS Code.

The repository still needs fast incremental development. “Release everything
together” must therefore be a product-release rule, not a reason to make every
branch or CI build red while the catalog is under construction.

## Decision

1. Base64 remains a reference/conformance fixture. It is not the landing-page
   focus and does not make the Kitland product release-ready.
2. `/explore` is a static catalog and implementation-status page. It never
   redirects generic intent to the first implemented tool.
3. The repository is explicitly pre-release until the agreed 64-tool inventory
   is registered and every required tool passes its core, UX, accessibility,
   security, platform, documentation, and packaging gates.
4. Normal CI remains green for valid incremental work. A distinct product
   release gate checks catalog completeness and blocks deployment/publication
   until the suite is complete.
5. Platform shells are catalog-driven. A host may use Base64 to prove its
   adapter, but the host architecture and product copy must remain generic.

## Consequences

### Positive

- Marketing and route structure match the actual product strategy.
- Agents can work on independent vertical slices without creating separate
  one-tool products or host-specific catalogs.
- Release readiness becomes machine-checkable rather than inferred from a
  passing build or one polished reference screen.

### Costs and risks

- The exact 64-tool inventory must be committed as a source of truth before
  parallel implementation can be planned safely.
- A whole-suite launch increases coordination and integration risk; conformance
  gates and small tool waves are mandatory.
- “Foundation” and “reference ready” must not be confused with marketplace or
  production availability.

## Rollout

1. Commit the canonical 64-tool inventory with family, pattern, platform, and
   capability declarations.
2. Add a non-release quality gate and a separate strict product-release gate.
3. Implement tools in bounded waves; each agent owns complete vertical slices,
   not a layer shared by many unfinished tools.
4. Run cross-tool search, navigation, bundle, accessibility, and packaging
   conformance after every wave.
5. Change product and platform labels from “Foundation” only when the complete
   release gate passes.
