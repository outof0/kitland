# Changelog

All notable changes to `@kitland/mcp` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - Unreleased

### Fixed

- Keep the release version and published MCP build metadata aligned at `0.1.1`.

## [0.1.0] - 2026-08-22

### Added

- Initial local stdio MCP server release implementing Model Context Protocol over standard I/O.
- Pinned to `@modelcontextprotocol/sdk@1.30.0` with preferred protocol version `2025-11-25`.
- Supported stable protocol negotiation versions: `2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`, `2024-10-07`.
- 80 bounded local operations spanning the canonical 65-tool registry,
  including Base64, JSON, text, encoding, cryptography, generators, and
  inspectors. `tools/list` is the authoritative operation catalogue.
- Strict input validation, explicit UTF-8/envelope budgets, and dual `structuredContent` + compact JSON text output.
