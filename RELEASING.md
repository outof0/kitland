# Releasing Kitland

Kitland is pre-1.0. Source, hosted web artifacts, extension packages, and any
future npm packages have separate release surfaces and must not silently share
versioning or permissions.

The coordinated product launch remains the complete 65-tool suite. It is
blocked by `pnpm --filter @kitland/tools release:verify` until every
registry entry meets that contract. A separate web rollout certifies the tools
explicitly declared for the web surface; it is not a complete-suite release and
does not publish either extension.

## Web tool rollout checklist

1. Start from a reviewed commit on the protected production branch with a clean
   working tree and frozen lockfile.
2. Update `CHANGELOG.md` with the user-visible tool scope, migrations,
   security impact, and rollback notes.
3. Run `pnpm release:check:rollout`. It first runs the normal quality suite,
   then proves the web rollout targets are canonical, `release-ready`, and
   available on web. It verifies every registry-available editor route in the
   normal full-registry web artifact, checks bundle and SEO output, and smoke-tests the
   result. The public landing page, 65-tool registry, and every available editor
   remain accessible; certification is not a visibility rule.
4. On `main` or `master`, set `CLOUDFLARE_PAGES_ROLLOUT_ENABLED=true` only
   after the Cloudflare credentials and production environment approval are in
   place. Keep `CLOUDFLARE_PAGES_ENABLED` unset: that variable is reserved for
   a complete-suite launch. CI downloads and re-verifies the normal artifact
   before deploying it.
5. Smoke the canonical production origin. Confirm every registry-available
   editor route remains reachable and the reviewed web rollout target set
   matches the registry, then record rollback instructions.
6. Roll back to the prior verified Pages artifact if production validation
   fails. Do not change rollout certification by editing host contracts outside
   the registry release stage.

This web-only rollout does not create, upload, or publish a browser extension
ZIP, a VS Code VSIX, or a package registry release.

## Complete-suite release checklist

1. Start from a reviewed commit on the protected production branch with a clean
   working tree and frozen lockfile.
2. Update `CHANGELOG.md` with user-visible behavior, public contract changes,
   migrations, security impact, and rollback notes.
3. Run `pnpm release:preflight` using the pinned Node and pnpm versions. It
   runs the full local product gate, the pinned VS Code Extension Host
   integration suite, and static validation of the release workflow: matching
   versions, the `kitland` VS Code publisher, immutable action pins, complete
   credentials, Pages production deployment, and GitHub Release ordering.
   Review the generated route set, extension package checks, and bundle-budget
   output rather than only the exit code.
4. `pnpm release:check`, included in the preflight, must prove that exactly the
   canonical 65 identities are present, `release-ready`, web-available, have
   resolved Pencil design evidence, and have no unresolved `planned` platform
   contracts. The committed manifest
   stores stable id/slug pairs only; matching `ToolDefinition` records remain
   the single source of descriptive and platform metadata.
5. Confirm dependency review, CodeQL, browser tests, capability/permission
   changes, and required ADRs are complete.
6. Confirm all release secrets against the remote stores. This cannot be proved
   locally because no credential value is read from a developer machine.
7. Push an annotated, signed SemVer tag. The release workflow publishes every
   surface, deploys the exact verified web build to Cloudflare Pages, then
   creates the GitHub Release. Do not create a GitHub Release manually.
8. Smoke the canonical production origin and each published store listing.
9. Record known limitations and rollback instructions. Roll back to the prior
   verified artifact if production validation fails.

## Package & extension release pipeline

`.github/workflows/release.yml` is the unified, secret-gated publisher for all
store surfaces. It mirrors:

- npm provenance
- VS Code Marketplace / Open VSX tag-driven publishing
- deterministic Chrome + Firefox browser artifacts

### Trigger

```bash
# Local: run the exact preflight before creating the release tag.
# package.json, packages/mcp/package.json, apps/browser-extension/package.json, apps/vscode-extension/package.json share one version
pnpm release:preflight
git tag v0.1.1 && git push origin v0.1.1
# or manual dispatch from main with the same complete-release contract
```

Pushing `v*` re-runs the reusable `ci.yml` quality gate (lint, typecheck, test, build, bundle/SEO, `package:check`), then `release` job builds and verifies every artifact.

### Artifacts produced (deterministic, no network)

| Surface | Command                                                    | Output                                                                      | Verified by                                                 |
| ------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Chrome  | `pnpm --filter @kitland/browser-extension package:chrome`  | `artifacts/kitland-chrome-v*.zip`                                           | `verify-package.mjs` + CSP/permission checks                |
| Firefox | `pnpm --filter @kitland/browser-extension package:firefox` | `artifacts/kitland-firefox-v*.zip` (adds `browser_specific_settings.gecko`) | same + gecko.id check                                       |
| Generic | `package` alias                                            | `kitland-browser-extension-v*.zip` (same as Chrome)                         | same                                                        |
| VS Code | `pnpm --filter kitland-tools package:vsix`                 | `artifacts/kitland-tools.vsix`                                              | `package-smoke.mjs` (VSCE)                                  |
| MCP npm | `pnpm --filter @kitland/mcp package:check`                 | `kitland-mcp-*.tgz` + OIDC provenance                                       | `verify-package.mjs` (tarball allowlist + live stdio smoke) |

`pnpm artifacts:all` builds all three in one go. Browser zips are identical except Firefox adds the AMO-required `gecko.id`; both are created deterministically via `create-browser-artifacts.mjs` (DEFLATE level 9, fixed timestamps).

### Publishing (all gated by credentials + duplicate detection)

- **npm (`@kitland/mcp`)** – the workflow reads the GitHub Actions
  **`NPM_TOKEN`** repository secret and exposes it as **`NODE_AUTH_TOKEN`** for
  npm. The token holder must have package-and-scope
  **Read and write** access to `@kitland` and must enable **Bypass 2FA** for
  non-interactive direct publishing. The workflow compares `dist.integrity`
  before publishing and uses npm provenance. Configure npm trusted publishing
  after the first successful package release, then remove this token path in a
  dedicated security change.
- **VS Code Marketplace** – optional for the initial release. When `VSCE_PAT`
  exists, publish under publisher ID `kitland` with
  `vsce publish --skip-duplicate`; otherwise warn, skip the store, and retain
  the verified VSIX in the GitHub Release.
- **Open VSX** – optional for the initial release. When `OVSX_PAT` exists,
  publish with `ovsx publish --skip-duplicate`; otherwise warn, skip the store,
  and retain the verified VSIX in the GitHub Release.
- **Chrome Web Store** – `CHROME_EXTENSION_ID`, `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN` via `chrome-webstore-upload-cli`.
- **Firefox AMO** – `WEB_EXT_API_KEY`, `WEB_EXT_API_SECRET` via `web-ext sign`.
- **Cloudflare Pages** – `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; deployment to the `main` production branch happens only after every store publish succeeds.

Credentials for npm, Chrome, Firefox, and Cloudflare are required. `VSCE_PAT`
and `OVSX_PAT` are optional: a missing PAT skips only that store, while a
configured store that rejects publication still fails the workflow. Any missing
required credential, rejected configured-store submission, or failed Cloudflare
deployment stops the workflow before a GitHub Release is created.

### GitHub Release

On tag push or manual dispatch from `main`, the workflow creates `gh release create
vX.Y.Z` only after npm, both browser stores, Cloudflare Pages, and every
configured VS Code store succeed. It attaches the deterministic artifacts with
`--generate-notes`.
Artifact upload (`retention 30d`) runs even on failure to support diagnosis; it is
not a release.

### Credential setup

1. In npm, create or verify the **`@kitland`** organization/scope and give the
   token-owning user publish access. On npmjs.com → profile → **Access Tokens**
   → **Generate New Token**, create a granular, short-lived release token:
   packages and scopes **Read and write**, restricted to `@kitland`, with
   **Bypass 2FA** enabled. Copy it once.
2. Store that raw value under repository **Settings → Secrets and variables →
   Actions → Repository secrets** as **`NPM_TOKEN`**. Do not put it in `.npmrc`,
   a local shell profile, or the Git repository. The release job maps it to
   `NODE_AUTH_TOKEN` only for npm.
3. Keep every publishing credential in GitHub Actions repository secrets. The
   release job checks that every value is present before it packages or contacts
   a store; permission and ownership are then verified by the real store API.

```
GitHub Actions repository secrets
  NPM_TOKEN                # raw npm granular token
  VSCE_PAT                 # optional; Kitland Marketplace publisher
  OVSX_PAT                 # optional; Kitland Open VSX namespace
  CHROME_EXTENSION_ID, CHROME_CLIENT_ID, CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN
  WEB_EXT_API_KEY, WEB_EXT_API_SECRET
  CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
```

Create **`VSCE_PAT`** in Azure DevOps: User settings → Personal access tokens →
New Token → Organization **All accessible organizations** → Scopes **Custom
defined** → Show all scopes → **Marketplace: Manage**. The same Microsoft
account must belong to the existing Marketplace publisher ID `kitland`. See the
[official VS Code publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

Create **`OVSX_PAT`** after signing the Publisher Agreement on open-vsx.org:
avatar → Settings → Access Tokens → Generate New Token. The account must be a
member of the `kitland` namespace; create it once with
`npx ovsx create-namespace kitland -p <token>` if it does not exist. See the
[official Open VSX publishing guide](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions).

Renaming `publisher` in `package.json` does not create or transfer publisher or
namespace ownership. `AMO_JWT_ISSUER`, `AMO_JWT_SECRET`, and a GitHub secret
named `NODE_AUTH_TOKEN` are not used by this workflow; the canonical names are
`WEB_EXT_API_KEY`, `WEB_EXT_API_SECRET`, and `NPM_TOKEN`.

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
Code marketplace publication; the registry platform contract and host permission
review must both approve it.
