# Kitland Tools for VS Code

The VS Code surface for Kitland's local, privacy-first developer-tool suite. This package is a
registry-driven host: only tools declared `available` on `vscode-extension` appear here. Web
availability never implies a VS Code adapter.

## Current host surface

- `Kitland: Open Tool...` discovers every registry-available VS Code tool and opens the shared workbench.
- Specialty selection commands remain hand-reviewed:
  - `Kitland: Base64: Encode and Replace Selection` / `Decode and Replace Selection`
  - `Kitland: cURL Converter: Convert Selection to Fetch`
- JSON Formatter uses the structured `text-inspect` workbench (Beautify/Minify, 2/4-space indent,
  statistics, copy-only output; no document edits).
- Pure transforms declared multi-host in `@kitland/tools` mount through
  `src/adapters/host-transforms.ts` (Open Tool only; no mass selection-command contributions).
- The same runtime is bundled for desktop, remote, and VS Code for the Web.

## Architecture for the full registry

`@kitland/tools` owns immutable product identity and platform capability metadata;
`src/toolRegistry.ts` is the VS Code adapter discovery boundary. Each adapter supplies safety limits,
renderer configuration, and optional editor commands. `src/toolPanel.ts` owns one secure webview
lifecycle and switches between registry entries. The renderer contract is discriminated by `kind`;
`text-transform` preserves bounded transformation and atomic selection behavior, while `text-inspect`
renders structured read-only inspection results. New renderer families should add a separate contract
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

## Release follow-up

The complete registry is available through the shared workbench. These items
remain marketplace and compatibility work, not hidden product-scope gaps:

1. Optionally expand hand-reviewed selection commands; host-transform adapters intentionally ship
   without automatic selection-command generation.
2. Introduce worker/streaming protocols and cancellation before any tool exceeds the current
   1,000,000-character message ceiling.
3. Expand the Linux Extension Host and web-bundle CI baseline into the final compatibility matrix;
   add VSIX artifact retention, signing/provenance, and Marketplace/Open VSX release promotion.
4. Confirm ownership of the `kitland` Marketplace publisher, add store assets, and complete the
   marketplace release checklist.

## Packaging policy

Only `dist/desktop`, `dist/web`, `dist/webview`, the manifest, license, changelog, and this README belong
in the VSIX. Source, tests, maps, local dependencies, and integration bundles are excluded by
`.vscodeignore`.
