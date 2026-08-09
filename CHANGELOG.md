# Changelog

All notable user-facing and public API changes are recorded here.

This project follows semantic versioning for public releases. Until the first
tagged release, changes remain under **Unreleased**.

## Unreleased

### Added

- Initial local-first web workbench and Base64 reference tool.
- Core/tool-catalog package boundaries and release foundations.
- Explicit per-platform capability contracts, a complete-suite production gate,
  and a separately verified phased web rollout for `release-ready` tools.
- The complete 64-tool catalog with bounded core contracts and deterministic
  tests; every tool is certified `release-ready` on web, browser extension, and
  VS Code, and the full-suite release gate now passes.
- Shared `@kitland/ui` design system: single light/dark token source, Tailwind
  theme entry, and shared primitives (tool chrome, workspace shells, editor,
  result rail, sidebar) used by all three hosts.
- Web workbench with 64 static tool pages, lazy renderer registry, SEO
  prerender, and fragment-only share links (Base64, JSON Formatter).
- Permission-free browser extension with the same WorkspaceShell + lazy
  `@kitland/ui` React registry as web (no second mount API or generic fallback).
- VS Code extension with a secure webview workbench, host adapters, atomic
  selection commands (Base64, cURL), and a structured JSON inspection surface.
- VS Code webview now mounts the shared `@kitland/ui` WorkspaceShell so the
  catalog chrome matches web and the browser extension.
- All 64 tool UIs live in `@kitland/ui` and are mounted by web, the browser
  extension, and VS Code so layout and chrome stay aligned.
- Per-surface rollout gates for web, browser-extension, and vscode-extension
  independent of the coordinated suite gate.

### Security

- Documented private vulnerability reporting and production crawl/deployment
  safeguards.
- All transforms run locally: no payload network requests, no telemetry, and
  no persistence by default on any host.
- Share links are fragment-only (input never enters the query string) and
  include a disclosure that they carry the current input.
- VS Code webview restricts resources to `dist/webview` with a per-session
  nonce and validates every host message at runtime.
