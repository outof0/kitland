# Changelog

All notable changes to `@kitland/mcp` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-15

### Added

- Initial local stdio MCP server release implementing Model Context Protocol over standard I/O.
- Pinned to `@modelcontextprotocol/sdk@1.30.0` with preferred protocol version `2025-11-25`.
- Supported stable protocol negotiation versions: `2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`, `2024-10-07`.
- Pure deterministic operations:
  - `kitland_base64_encode`: UTF-8 to standard / URL-safe Base64.
  - `kitland_base64_decode`: Canonical standard / URL-safe Base64 to UTF-8 text.
- Strict input validation, explicit UTF-8/envelope budgets, and dual `structuredContent` + compact JSON text output.
