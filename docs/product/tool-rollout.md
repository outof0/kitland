# 64-tool rollout playbook

Status: foundation ready; canonical 64-tool inventory committed; 63 tool slices pending
Release policy: [ADR 0003](../adr/0003-release-the-complete-tool-suite.md)

## Product scope is committed

`design/design.pen` contains the 64 authoritative tool artboards. Its ordered
identity list is committed in the release manifest, and every artboard now has
one matching `ToolDefinition`. The definitions are intentionally `planned`
until an agent delivers the vertical slice. The catalog is the metadata source
of truth for:

- stable id, slug, public name, short name, family, and search keywords;
- UI pattern (`transform`, `generate`, `diff`, or `inspect`);
- web, browser-extension, and VS Code status plus capabilities;
- core input/output contract, limits, and deterministic test vectors;
- design frame or an explicit design-needed state;
- complexity/risk tier and dependencies on shared libraries.

The identity manifest is the reviewed product scope; the matching catalog
definitions own all descriptive and platform metadata so the repository does
not maintain two copies that can drift. A catalog test reads `design.pen` and
fails if artboard order, count, or stable frame ids diverge from the catalog.
The strict release gate compares every catalog id/slug to the manifest.

## Agent ownership model

Each agent owns complete vertical slices, not one horizontal layer for many
tools:

```text
tool definition → pure core → unit vectors → host renderers → docs/SEO → package tests
```

Recommended assignment size:

| Tier | Typical work                                                              | Tools per agent |
| ---- | ------------------------------------------------------------------------- | --------------: |
| S    | deterministic text transforms sharing an established pattern              |             4–6 |
| M    | option-rich generator, parser, or structured inspector                    |             2–4 |
| L    | cryptography, large-file work, diff visualization, or risky platform APIs |             1–2 |

Do not mix two agents in the same tool. One integration owner updates generated
catalog indexes after a wave; agents add isolated definition/renderer files so
parallel changes do not collide in central registries.

## Wave order

1. **Conformance wave:** one non-Base64 tool for each UI pattern. This proves
   the shell is not accidentally specialized for transform tools. Use the
   committed catalog rather than inventing additional tool identities.
2. **Low-risk breadth:** deterministic format/encode/text tools with shared
   primitives and small payloads.
3. **Generators and inspectors:** option schemas, entropy contracts, structured
   result views, and active-editor integration.
4. **High-risk tools:** crypto, large input, complex diff, filesystem, or host
   APIs. Require explicit threat models and performance budgets.
5. **Catalog closure:** missing design/SEO/accessibility evidence, naming
   consistency, cross-tool search, and platform packaging.

Every wave should keep normal CI green. It must not weaken the release gate to
make an incomplete catalog appear shippable.

## Per-tool definition of done

- Catalog definition is immutable, unique, searchable, and exhaustive for all
  platform statuses.
- Core has success, malformed, boundary, Unicode, empty, and size-limit tests.
- Errors are typed and actionable; sensitive data is not logged or persisted.
- Web route is static and meaningful before the interactive renderer loads.
- Tool UI follows its pattern and passes keyboard, 390 px, light/dark, and
  reduced-motion checks.
- Browser and VS Code adapters expose only declared capabilities and validate
  every host message at runtime.
- Documentation explains what the tool does, what it does not do, privacy, and
  security caveats.
- Bundle/package budgets and platform smoke checks pass.

## Suite release gate

The product is release-ready only when all of these are true:

1. the committed inventory contains exactly the agreed 64 unique tools;
2. every inventory tool has a matching catalog definition and core contract;
3. every required platform entry is available and has an exhaustive renderer;
4. all route, search, accessibility, unit, integration, bundle, security audit,
   browser-package, and VS Code-package checks pass from a clean checkout;
5. no public copy says “Foundation”, “planned”, or “reference ready”;
6. marketplace metadata, icons, privacy statements, changelog, and provenance
   artifacts are ready for one coordinated release.

## Merge discipline for parallel agents

- Assign disjoint tool ids and directories.
- Do not hand-edit a shared registry from every branch; generate it from tool
  definitions or reserve one integration pass per wave.
- Rebase/check the catalog before merge so slug and command collisions fail
  locally, not during the final wave.
- Require one reviewer to compare output semantics across tools in the same
  family; visual consistency alone is not sufficient.
