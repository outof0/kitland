# Tool factory and conformance harness (KIT-0004)

## Purpose

Agents add **vertical slices** for identities already in the product inventory.
They do not invent unplanned slugs or hand-edit competing registries without
conformance checks.

## Committed identity gate

```bash
node scripts/tool-scaffold-check.mjs <tool-id>
```

Exit `0` only when `<tool-id>` is listed in
`packages/tools/src/inventory.ts`. Arbitrary ids fail.

## Conformance scan

```bash
node scripts/tool-conformance.mjs
```

Writes a deterministic report to `docs/generated/tool-conformance-report.json`
and verifies inventory size plus web registry slug membership.

Unit evaluation lives in `packages/tools/src/conformance.ts` and
`conformance.test.ts`: available platform contracts require adapters; every
tool has a reportable budget via `tool-budgets.ts`.

## Parallel ownership

1. One agent owns one **disjoint set of tool ids** (see KIT-0006 plan matrix).
2. Add core + tests, registry definition, web renderer, SEO when web-available.
3. Append the renderer to `apps/web/src/tools/registry.tsx` exhaustively.
4. Do not promote `browser-extension` / `vscode-extension` without host adapters.
5. Integration owner runs conformance + package gates before merge.

## Adding a tool

1. Confirm id in inventory (`tool-scaffold-check`).
2. Implement `packages/core/src/tools/<id>.ts` + tests.
3. Declare registry definition (wave file / `defineTool`).
4. Implement web tool + registry entry + SEO.
5. Run `pnpm --filter @kitland/core test`, registry tests, web typecheck/build.
6. Attach evidence on the owning kanban card.
