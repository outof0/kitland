# Kitland Developer Tools for VS Code

The VS Code surface for Kitland's local, privacy-first developer-tool suite. This package is a
catalog-driven foundation for the full tool set; Base64 is the first reference adapter and vertical
slice, not the product boundary or a claim that the complete suite is ready.

## Current reference slice

- `Kitland: Open Tool...` discovers tools from the extension catalog and opens the shared workbench.
- `Kitland: Base64: Encode and Replace Selection` transforms one or more non-overlapping selections
  in a single undoable edit.
- `Kitland: Base64: Decode and Replace Selection` validates every selection before applying any edit.
- The Base64 workbench supports Standard and URL-safe variants through `@kitland/core`.
- The same runtime is bundled for desktop, remote, and VS Code for the Web.

## Architecture for the full catalog

`@kitland/tool-catalog` owns immutable product identity and platform capability metadata;
`src/toolCatalog.ts` is the VS Code adapter discovery boundary. Each adapter supplies safety limits,
renderer configuration, and optional editor commands. `src/toolPanel.ts` owns one secure webview
lifecycle and switches between catalog entries. The renderer contract is discriminated by `kind`;
the first implementation is `text-transform`. New renderer families should add a separate contract
and renderer implementation rather than adding tool-specific conditions to the panel.

The Base64 adapter in `src/adapters/base64.ts` demonstrates the intended rule: platform code owns
selection, clipboard, limits, and UX; deterministic transforms stay in `@kitland/core`.

## Security and privacy contract

- No telemetry, persistence, logging of payloads, or network API is present.
- Webview resources are restricted to `dist/webview`; CSP denies every source by default and uses a
  cryptographically random nonce for the one local script.
- User input is never interpolated into HTML. UI updates use DOM text/value properties.
- Both directions of webview messaging reject extra keys, malformed identifiers, inconsistent
  descriptors, unsafe request IDs, and payloads beyond the protocol ceiling.
- Clipboard writes happen only after an explicit button press and only for the latest output retained
  by the extension host.
- Workspace Trust and virtual workspaces are supported because tools do not execute workspace code or
  read workspace files.
- Closing the panel clears its in-memory input and output.

## Development

From this package after workspace dependencies are installed:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:integration
pnpm package:smoke
pnpm package:vsix
```

`test` runs pure unit and contract tests. `test:integration` downloads VS Code 1.100 and runs the
compiled tests in an Extension Development Host. `package:smoke` builds desktop/web/webview bundles,
checks release invariants and forbidden network primitives, then asks `vsce` to enumerate the exact
VSIX contents.

## Gaps before the complete suite can ship

1. Register the remaining shared-tool adapters while preserving the exhaustive
   shared-catalog-to-adapter check; product release remains blocked until the complete inventory
   passes its gates.
2. Add renderer contracts beyond text transformation (structured forms, diff, generators, file-safe
   workflows) with accessibility and protocol tests per renderer.
3. Generate or verify static `package.json` command/menu contributions against the catalog so dozens
   of commands cannot drift from runtime registration.
4. Introduce worker/streaming protocols and cancellation before any tool exceeds the current
   1,000,000-character message ceiling.
5. Expand the Linux Extension Host and web-bundle CI baseline into the final compatibility matrix;
   add VSIX artifact retention, signing/provenance, and Marketplace/Open VSX release promotion.
6. Confirm ownership of the `outof0` Marketplace publisher, add store assets, and complete the full
   suite release checklist. Do not publish this Base64-only reference slice as the finished product.

## Packaging policy

Only `dist/desktop`, `dist/web`, `dist/webview`, the manifest, license, changelog, and this README belong
in the VSIX. Source, tests, maps, local dependencies, and integration bundles are excluded by
`.vscodeignore`.
