# ADR 0003: Release the complete 64-tool suite

- **Status:** accepted
- **Date:** 2026-08-15
- **Owner:** Kitland maintainers

## Context

Base64 began as the first reference implementation used to stabilize tool
contracts, workspace behavior, accessibility, and platform adapters. A small
set of complete vertical slices can be ready before the entire registry, but
presenting any one of them as the whole product or redirecting `/explore` to it
would still misrepresent Kitland's intended scope: a coherent suite of roughly
64 developer tools across web, browser extension, and VS Code.

The repository still needs fast incremental development. “Release everything
together” must therefore be a product-release rule, not a reason to make every
branch or CI build red while the registry is under construction.

## Decision

1. A tool may enter an explicit rollout on one product surface only when its
   registry stage is `release-ready` and that surface is declared in
   `releasePlatforms`. Certification is per surface: no individual tool or
   rollout makes Kitland product-release-ready as a coordinated 64-tool suite.
2. `/explore` is a static registry and implementation-status page. It never
   redirects generic intent to the first implemented tool.
3. The coordinated product launch remains pre-release until the agreed 64-tool
   inventory is registered and every required tool passes its core, UX,
   accessibility, security, platform, documentation, and packaging gates.
4. Normal CI remains green for valid incremental work. A distinct
   complete-suite product release gate checks registry completeness and blocks
   coordinated deployment/publication until the suite is complete. A separate
   web rollout gate certifies selected web targets, then deploys the normal
   full-registry web artifact.
5. Platform shells are registry-driven. A host may use Base64 to prove its
   adapter, but the host architecture and product copy must remain generic.

## Consequences

### Positive

- Marketing and route structure match the actual product strategy while
  finished tools can be certified and deployed through the normal web artifact.
- Agents can work on independent vertical slices without creating separate
  one-tool products or host-specific registrys.
- Release readiness becomes machine-checkable rather than inferred from a
  passing build or one polished reference screen.

### Costs and risks

- The exact 64-tool inventory must be committed as a source of truth before
  parallel implementation can be planned safely.
- A whole-suite launch increases coordination and integration risk; conformance
  gates and small tool waves are mandatory.
- A per-surface Pages rollout must not be confused with browser/VS Code
  marketplace publication or the full product launch.

## Rollout

1. Commit the canonical 64-tool inventory with family, pattern, platform, and
   capability declarations.
2. Add a non-release quality gate and a separate strict product-release gate.
3. Implement tools in bounded waves; each agent owns complete vertical slices,
   not a layer shared by many unfinished tools.
4. Run cross-tool search, navigation, bundle, accessibility, and packaging
   conformance after every wave.
5. For a web rollout, certify the `release-ready` targets declared for web and
   verify that the normal artifact retains every registry-available route,
   sitemap URL, link, and renderer chunk; do not publish extension packages as
   a side effect.
6. Change product and platform labels from “Foundation” only when the complete
   release gate passes.
