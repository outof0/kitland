# Tool platform and capability contract

The shared registry describes where a tool is intentionally exposed. Availability
on one host never implies availability or permission on another host.

## Source of truth

`packages/tools/src/types.ts` defines three platform identifiers:

- `web`
- `browser-extension`
- `vscode-extension`

Every `ToolDefinition` supplies a contract for every platform with an explicit
status (`available`, `planned`, or `unsupported`) and a reviewed set of
host-neutral capabilities. `defineTool()` validates and freezes declarations so
registry lookup maps cannot drift after initialization.

Tool delivery maturity is tracked separately as `reference`, `planned`,
`implemented`, or `release-ready`. `available` means a host can expose the tool
in a development/preview build; it does not mean the overall product may be
released. `release-ready` makes a tool eligible for explicit per-surface rollout
certification when that surface is listed in `releasePlatforms`; it never
authorizes implicit marketplace publication or the complete-suite launch.

The existing top-level `status` is the web navigation status and must match the
web platform contract. Host adapters use `listToolsByPlatform()` and
`getToolPlatformContract()` rather than `listAvailableTools()`.

## Capability semantics

Capabilities describe user-visible power, not concrete manifest permissions.
For example, `active-editor` lets a VS Code adapter propose the narrowest editor
API integration; it does not itself grant filesystem access. Each adapter must
map declared capabilities to the minimum host permissions and may implement a
strict subset. Undeclared capability use is a contract violation.

Network access, telemetry, background execution, arbitrary filesystem access,
remote payload processing, and credential access are intentionally absent from
the current capability vocabulary. Adding one requires an ADR and privacy and
security review.

## Adding or exposing a tool

1. Declare the tool with `defineTool()` and literal `as const` values.
2. Mark only implemented, tested hosts as `available`; use `planned` for reviewed
   intent and `unsupported` with an empty capability list otherwise.
3. Add the tool to `TOOLS`. Unique ids/slugs and kebab-case are runtime
   invariants as well as CI tests.
4. Add an exhaustive renderer/command entry in each available host. The web
   registry is typed by `AvailableToolSlug`, so omissions fail typecheck.
5. Test capability mapping, payload limits, errors, and host permission denial.
6. Record breaking platform-contract changes in the changelog and apply SemVer
   once a registry package is public.

## Complete-suite release gate

`getRegistryReleaseReadiness()` and `evaluateRegistryReleaseReadiness()` implement
the first-production-release policy. The gate requires the registry to match the
committed canonical inventory at exactly 64 identities, every tool at
`release-ready`, every tool available on web, unique ids and slugs, and no
remaining `planned` platform decision. A platform may be explicitly
`unsupported`; the gate requires a resolved decision, not permission inflation.
The inventory stores the reviewed id/slug pairs extracted from the 64
artboards in `design/design.pen`; each matching `ToolDefinition` is the sole
source for names, families, UI patterns, host status, and capabilities. The
release gate still requires every tool to be implemented and release-ready, so
the inventory cannot unlock deployment by itself.

Normal CI remains green during development. The complete-suite production
deploy job runs the separate `release:verify` command, which intentionally
fails until all 64 tools are ready. A different `release:verify:rollout` gate
evaluates the declared targets for one platform (web by default) and is paired
with a full-registry artifact verifier before a certified web rollout can deploy.
