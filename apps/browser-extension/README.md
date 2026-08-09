# Kitland Browser Extension

The permission-free Manifest V3 host for the Kitland developer tool suite. The
extension is designed for the 64-tool catalog; Base64 is the first reference
adapter used to prove the shell, renderer, privacy, accessibility, worker, and
packaging contracts. It is not the extension's product identity or release
scope.

Kitland will ship the extension only when the full planned tool set and release
gates are complete. Until then, the artifact in this directory is a foundation
and development fixture.

## Architecture

```text
popup.html + main.ts             Generic searchable catalog and tool host
registry.ts                      Explicit metadata + lazy renderer registrations
tools/<slug>/adapter.ts          One host adapter, mounted only when selected
tools/<slug>/domain.ts           Thin orchestration around shared core logic
tools/<slug>/*.worker.ts         Optional route-local compute worker
@kitland/tool-catalog            Host-neutral identity/capability metadata
@kitland/core                    Platform-neutral operations
```

Each registration uses a dynamic import, so adding a renderer does not add its
JavaScript to the initial shell. A renderer receives an isolated root and must
return cleanup logic for tool switches. Catalog presence alone never exposes a
tool: extension registration remains an explicit, reviewable decision.

## Privacy and platform boundary

- Chromium-first, using only common MV3 popup primitives supported by Firefox.
- No `permissions` or `host_permissions`.
- No network calls, analytics, remote code, account, or payload storage.
- No background worker or content script.
- Tool Web Workers are short-lived and owned by the selected adapter.
- Clipboard writes use user-initiated Web Clipboard plus a local fallback; no
  `clipboardWrite` extension permission is requested.
- Blob downloads require no `downloads` permission.

## Develop and verify

After workspace integration:

```bash
pnpm install
pnpm --filter @kitland/browser-extension check
```

Useful scoped commands:

```bash
pnpm --filter @kitland/browser-extension dev
pnpm --filter @kitland/browser-extension test
pnpm --filter @kitland/browser-extension build
pnpm --filter @kitland/browser-extension package:check
pnpm --filter @kitland/browser-extension test:smoke
pnpm --filter @kitland/browser-extension package
```

`package` creates a deterministic store-ready ZIP under `artifacts/`. Both
`dist/` and `artifacts/` are ignored source artifacts.

## Add a tool adapter

1. Implement and test pure operations in `@kitland/core`.
2. Add host-neutral metadata, capabilities, and explicit browser-extension
   availability in `@kitland/tool-catalog`.
3. Add `src/tools/<slug>/adapter.ts`; keep browser APIs inside that adapter.
4. Register one lazy loader in `src/registry.ts`.
5. Add adapter unit/smoke tests, maximum-input tests, cleanup tests, and review
   the final permissions/package output.

Build-time validation requires every catalog entry marked browser-extension
`available` to have exactly one renderer, and every renderer must point at such
an entry. The invariant already applies to the reference adapter and remains
exhaustive as the catalog expands.

## Load the production build

### Chromium

1. Run `pnpm --filter @kitland/browser-extension build`.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable Developer mode and choose **Load unpacked**.
4. Select `apps/browser-extension/dist`.
5. Inspect extension details: it must show no requested permissions.

### Firefox

1. Build the same artifact.
2. Open `about:debugging#/runtime/this-firefox`.
3. Choose **Load Temporary Add-on** and select
   `apps/browser-extension/dist/manifest.json`.

The common manifest avoids background/service-worker declarations and vendor
APIs. A signed Firefox release may add a Gecko add-on ID through a packaging
variant without changing runtime capabilities.

## Manual release smoke

Load unpacked `dist/` in clean Chromium and Firefox profiles, then verify:

1. The searchable catalog, selection, deep-link hash, and lazy renderer loading
   work without console or CSP errors.
2. Each tool's primary workflow, file/clipboard/export capability, failure
   states, maximum input, keyboard path, and cleanup pass its contract.
3. Closing and reopening restores no previous payload.
4. The browser reports zero extension and host permissions.
5. The full 64-tool inventory matches the shared platform contract; no planned
   or unsupported tool is accidentally exposed.

## Release integration remaining

Workspace build, unit, production-popup smoke, package verification, CI artifact
upload, per-entry budgets, and catalog ↔ renderer exhaustiveness are wired. The
remaining release work is deliberately external to the runtime foundation:

1. Add clean-profile unpacked-extension automation and Firefox compatibility CI.
2. Establish Chrome Web Store and Firefox Add-ons ownership, signing,
   provenance, review accounts, and rollback procedures outside pull-request
   jobs.
3. Add store listing assets and privacy/support URLs after the complete catalog
   copy is approved.
4. Add a keyboard command palette after a meaningful number of the committed
   catalog tools have browser adapters.
