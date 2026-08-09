# Releasing Kitland

Kitland is pre-1.0. Source, hosted web artifacts, extension packages, and any
future npm packages have separate release surfaces and must not silently share
versioning or permissions.

Base64 is a reference vertical slice. The first public production release is
the complete 64-tool suite, not an incremental Base64 release. Preview builds
may be tested before then, but production deployment remains blocked by
`pnpm --filter @kitland/tool-catalog release:verify` until all catalog entries
meet the release contract.

## Release checklist

1. Start from a reviewed commit on the protected production branch with a clean
   working tree and frozen lockfile.
2. Update `CHANGELOG.md` with user-visible behavior, public contract changes,
   migrations, security impact, and rollback notes.
3. Run `pnpm quality:check` using the pinned Node and pnpm versions. Review the
   generated route set, extension package checks, and bundle-budget output
   rather than only the exit code.
4. Run `pnpm release:check`. Its catalog gate must prove that exactly the
   canonical 64 identities are present, `release-ready`,
   web-available, and have no unresolved `planned` platform contracts. The
   intentionally unset inventory in `src/inventory.ts` is a hard blocker until
   the product owner commits the agreed manifest; count alone cannot pass.
   The manifest stores stable id/slug pairs only; matching `ToolDefinition`
   records remain the single source of descriptive and platform metadata.
5. Confirm dependency review, CodeQL, browser tests, capability/permission
   changes, and required ADRs are complete.
6. Deploy the exact artifact uploaded by CI. Production deployment is enabled
   only when `CLOUDFLARE_PAGES_ENABLED=true` and the documented Cloudflare
   credentials are configured.
7. Smoke the canonical production origin, then create an annotated, signed
   SemVer tag and a GitHub release pointing at the verified commit.
8. Record known limitations and rollback instructions. Roll back to the prior
   verified artifact if production validation fails.

## Shared package publication

`@kitland/core` and `@kitland/tool-catalog` remain private workspace packages.
Removing `private: true` requires a publication ADR covering compiled JavaScript
and declarations, export maps, supported runtimes, provenance, package signing,
API compatibility tests, deprecation policy, and registry ownership. Do not
publish TypeScript source accidentally as a public compatibility commitment.

## Extension releases

Each extension owns its manifest permissions, package artifact, marketplace
metadata, compatibility range, and rollback path. A web tool being `available`
does not automatically authorize browser or VS Code exposure; the catalog
platform contract and host permission review must both approve it.
