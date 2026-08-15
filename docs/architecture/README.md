# Architecture index

Kitland separates pure tool logic from catalog metadata and browser-specific
experience:

```text
packages/core            Pure, bounded tool operations
packages/tools    Tool identity, availability, and UI-pattern metadata
apps/web                 Browser shell, routes, and tool compositions
```

Start with these records:

- [Tool vertical-slice pattern](tool-pattern.md)
- [Tool interaction pattern contracts](tool-patterns.md)
- [Tool UI design-system contract](tool-ui-contract.md)
- [Tool platform and capability contract](platform-capabilities.md)
- [SEO and prerender delivery contract](seo-prerender.md)
- [MCP and AI adapter boundary](mcp-boundary.md)

## Architecture decision records

ADRs record decisions that affect public behavior, compatibility, privacy,
hosting, or package contracts. The index lives in [docs/adr](../adr/README.md).
Do not treat an implementation convenience as an ADR substitute.

- [ADR 0001: Astro static delivery with React islands and Shadcn](../adr/0001-astro-react-islands-and-shadcn.md)
- [ADR 0002: Keep MCP local-only and defer a hosted service](../adr/0002-local-mcp-boundary-and-hosted-deferral.md)
- [ADR 0003: Release the complete 64-tool suite](../adr/0003-release-the-complete-tool-suite.md)
