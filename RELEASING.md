# Releasing Kitland

Kitland is pre-1.0. Source, hosted web artifacts, extension packages, and any
future npm packages have separate release surfaces and must not silently share
versioning or permissions.

The coordinated product launch remains the complete 64-tool suite. It is
blocked by `pnpm --filter @kitland/tools release:verify` until every
catalog entry meets that contract. A separate web rollout certifies the tools
explicitly declared for the web surface; it is not a complete-suite release and
does not publish either extension.

## Web tool rollout checklist

1. Start from a reviewed commit on the protected production branch with a clean
   working tree and frozen lockfile.
2. Update `CHANGELOG.md` with the user-visible tool scope, migrations,
   security impact, and rollback notes.
3. Run `pnpm release:check:rollout`. It first runs the normal quality suite,
   then proves the web rollout targets are canonical, `release-ready`, and
   available on web. It verifies every catalog-available editor route in the
   normal full-catalog web artifact, checks bundle and SEO output, and smoke-tests the
   result. The public landing page, 64-tool catalog, and every available editor
   remain accessible; certification is not a visibility rule.
4. On `main` or `master`, set `CLOUDFLARE_PAGES_ROLLOUT_ENABLED=true` only
   after the Cloudflare credentials and production environment approval are in
   place. Keep `CLOUDFLARE_PAGES_ENABLED` unset: that variable is reserved for
   a complete-suite launch. CI downloads and re-verifies the normal artifact
   before deploying it.
5. Smoke the canonical production origin. Confirm every catalog-available
   editor route remains reachable and the reviewed web rollout target set
   matches the catalog, then record rollback instructions.
6. Roll back to the prior verified Pages artifact if production validation
   fails. Do not change rollout certification by editing host contracts outside
   the catalog release stage.

This web-only rollout does not create, upload, or publish a browser extension
ZIP, a VS Code VSIX, or a package registry release.

## Complete-suite release checklist

1. Start from a reviewed commit on the protected production branch with a clean
   working tree and frozen lockfile.
2. Update `CHANGELOG.md` with user-visible behavior, public contract changes,
   migrations, security impact, and rollback notes.
3. Run `pnpm quality:check` using the pinned Node and pnpm versions. Review the
   generated route set, extension package checks, and bundle-budget output
   rather than only the exit code.
4. Run `pnpm release:check`. Its catalog gate must prove that exactly the
   canonical 64 identities are present, `release-ready`, web-available, and
   have no unresolved `planned` platform contracts. The committed manifest
   stores stable id/slug pairs only; matching `ToolDefinition` records remain
   the single source of descriptive and platform metadata.
5. Confirm dependency review, CodeQL, browser tests, capability/permission
   changes, and required ADRs are complete.
6. Deploy the exact complete-suite artifact uploaded by CI. Production
   deployment is enabled only when `CLOUDFLARE_PAGES_ENABLED=true`,
   `CLOUDFLARE_PAGES_ROLLOUT_ENABLED` is unset, and the documented Cloudflare
   credentials are configured.
7. Smoke the canonical production origin, then create an annotated, signed
   SemVer tag and a GitHub release pointing at the verified commit.
8. Record known limitations and rollback instructions. Roll back to the prior
   verified artifact if production validation fails.

## Package & extension release pipeline

`/.github/workflows/release.yml` is the unified, secret-gated publisher for all
store surfaces. It mirrors:

- **hotpug** (`anypick`) for npm trusted publishing with OIDC + provenance
- **nexusdiff** (`gitview`) for VS Code Marketplace / Open VSX tag-driven flow
- plus deterministic Chrome + Firefox browser artifacts

### Trigger

```bash
# Local: bump version in all manifests, commit, tag, push
# package.json, packages/mcp/package.json, apps/browser-extension/package.json, apps/vscode-extension/package.json share one version
git tag v0.1.0 && git push origin v0.1.0
# or manual dispatch from GitHub Actions with skip toggles
```

Pushing `v*` re-runs the reusable `ci.yml` quality gate (lint, typecheck, test, build, bundle/SEO, `package:check`), then `release` job builds and verifies every artifact.

### Artifacts produced (deterministic, no network)

| Surface | Command                                                    | Output                                                                      | Verified by                                                 |
| ------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Chrome  | `pnpm --filter @kitland/browser-extension package:chrome`  | `artifacts/kitland-chrome-v*.zip`                                           | `verify-package.mjs` + CSP/permission checks                |
| Firefox | `pnpm --filter @kitland/browser-extension package:firefox` | `artifacts/kitland-firefox-v*.zip` (adds `browser_specific_settings.gecko`) | same + gecko.id check                                       |
| Generic | `package` alias                                            | `kitland-browser-extension-v*.zip` (same as Chrome)                         | same                                                        |
| VS Code | `pnpm --filter kitland-developer-tools package:vsix`       | `artifacts/kitland-developer-tools.vsix`                                    | `package-smoke.mjs` (VSCE)                                  |
| MCP npm | `pnpm --filter @kitland/mcp package:check`                 | `kitland-mcp-*.tgz` + OIDC provenance                                       | `verify-package.mjs` (tarball allowlist + live stdio smoke) |

`pnpm artifacts:all` builds all three in one go. Browser zips are identical except Firefox adds the AMO-required `gecko.id`; both are created deterministically via `create-browser-artifacts.mjs` (DEFLATE level 9, fixed timestamps).

### Publishing (all gated by secrets + duplicate detection)

- **npm (`@kitland/mcp`)** – `setup-node` with `registry-url`, `npm@11.6.0` for OIDC, `publishConfig.provenance`. Idempotent: compares `dist.integrity` sha512 before publishing; first publish needs `NPM_TOKEN` bootstrap (hotpug parity), subsequent uses trusted publishing (`id-token: write`).
- **VS Code Marketplace** – `VSCE_PAT` (Azure DevOps PAT, Marketplace Manage). `vsce publish --skip-duplicate`.
- **Open VSX** – `OVSX_PAT`. `ovsx publish --skip-duplicate`.
- **Chrome Web Store** – `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN` via `chrome-webstore-upload-cli`.
- **Firefox AMO** – `WEB_EXT_API_KEY`, `WEB_EXT_API_SECRET` via `web-ext sign`. If secrets absent, the step logs `::notice::` and leaves the zip as a GitHub Release asset for manual upload.

Missing secrets never fail the job; the GitHub Release still contains the verified zips/vsix/tgz for manual store submission.

### GitHub Release

On tag push, `gh release create vX.Y.Z` attaches all artifacts with `--generate-notes` (Conventional Commits). Manual `workflow_dispatch` uploads artifacts as workflow artifacts (`retention 30d`) without creating a Release. All store publishes happen _after_ artifact verification; reruns are idempotent thanks to integrity / `--skip-duplicate` checks.

Required secrets summary (set in repo Settings → Secrets and variables → Actions):

```
NPM_TOKEN          # bootstrap only, then trusted publishing
VSCE_PAT
OVSX_PAT           # optional
CHROME_EXTENSION_ID, CHROME_CLIENT_ID, CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN
WEB_EXT_API_KEY, WEB_EXT_API_SECRET
CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID  # for Pages, not store release
```

## Shared package publication

`@kitland/core` and `@kitland/tools` remain private workspace packages.
Removing `private: true` requires a publication ADR covering compiled JavaScript
and declarations, export maps, supported runtimes, provenance, package signing,
API compatibility tests, deprecation policy, and registry ownership. Do not
publish TypeScript source accidentally as a public compatibility commitment.

`@kitland/mcp` is the only public npm surface; it publishes with `provenance: true`
and a strict allowlist (no `src/`, `test/`, `.map`, or `workspace:*` deps).

## Extension releases

Each extension owns its manifest permissions, package artifact, marketplace
metadata, compatibility range, and rollback path. A web tool being
`release-ready` and a web rollout certification do not authorize browser or VS
Code marketplace publication; the catalog platform contract and host permission
review must both approve it.
