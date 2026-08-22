# Changelog

## 0.1.1 — Unreleased

- Fix the shared-tool registry loading in VS Code by acquiring the webview API
  once, so CodeMirror tools such as JSON Formatter render correctly.
- The Activity Bar opens the full Kitland workbench (navigation plus tool);
  Command Palette launches present only the focused editor tool.

## 0.1.0 — Unreleased

- Add the registry/adapter/renderer foundation for the Kitland VS Code surface.
- Add Base64 as the first reference adapter, including atomic selection commands.
- Add the bounded cURL-to-Fetch adapter, workbench option, and atomic selection command.
- Add JSON Formatter with a structured inspect renderer, Beautify/Minify output modes, 2/4-space
  Beautify formatting, bounded selection prefill, complete statistics, and no document mutation command.
- Add a local-only accessible webview with strict CSP and validated messaging.
- Mount the shared `@kitland/ui` WorkspaceShell in the webview so the workbench
  chrome matches the web and browser-extension surfaces.
- Add desktop, web-extension, unit, Extension Host, and package-smoke foundations.
- Certify the complete suite: every registry tool is `release-ready` on
  `vscode-extension` and the per-surface rollout gate passes.

0.1.0 is the first complete-suite release candidate: the coordinated release
gate certifies all 65 tools release-ready across web, browser extension, and VS Code.
