# ADR 0002: Keep MCP local-only and defer a hosted service

- **Status:** accepted
- **Date:** 2026-08-09
- **Owner:** Kitland maintainers

## Context

Kitland is a local-first collection of developer tools. Its current boundaries
already support that promise:

- `@kitland/core` contains deterministic, bounded transforms and has no DOM,
  network, filesystem, or host-platform API dependency.
- `@kitland/tool-catalog` describes a tool's identity and browser presentation
  without importing a runtime host.
- `apps/web` owns browser state. A shared Base64 link is an explicit,
  fragment-only action; drafts are not persisted by default.

AI clients could make these transforms useful outside the browser. Model
Context Protocol (MCP) provides discovery (`tools/list`) and invocation
(`tools/call`) for that use case. It does not, however, make a tool page
searchable, nor does it reduce the privacy or operational cost of processing
arbitrary user text remotely.

A hosted MCP endpoint would create a materially different product: it would
receive tool inputs on Kitland infrastructure, require an authentication,
abuse-prevention, retention, observability, incident-response, and privacy
programme, and weaken the present local-first expectation. The browser catalog
also is not yet a public automation contract: it does not contain versioned
input/output schemas, operation-level limits, or exposure approval.

## Decision

1. **Do not ship a hosted MCP server, HTTP MCP endpoint, browser bridge, or
   OAuth flow at launch.** The public web product remains browser-local.
2. **Do not infer MCP exposure from `listAvailableTools()`.** A tool becomes
   automatable only after an explicit, reviewed exposure declaration with a
   stable name, schemas, limits, privacy classification, and test vectors.
3. When the release gates below are met, publish an **optional**
   `@kitland/mcp` package using **local stdio only**. A user deliberately
   configures their AI client to launch it; Kitland's browser must never start
   it or transfer browser drafts, fragments, storage, or clipboard data to it.
4. The first package supports only deterministic, read-only `tools/list` and
   `tools/call` operations. It has no resources, prompts, sampling, file
   access, shell access, network calls, background jobs, telemetry, or
   credentials.
5. `@kitland/mcp` is an adapter, not another implementation of a transform. It
   validates an operation-specific contract, applies adapter limits, calls
   `@kitland/core`, and maps its `ToolResult` into a bounded MCP result. The
   concrete contract is specified in
   [the MCP/AI adapter boundary](../architecture/mcp-boundary.md).

The package should pin and test against a specific supported MCP SDK and
protocol revision at its own release time. MCP's tools specification describes
JSON-Schema input/output contracts and structured tool results; it must not be
treated as a reason to silently widen Kitland's API surface.

## Alternatives considered

### No MCP package

This is the lowest-maintenance option and remains valid if there is no proven
user demand. It gives AI users no native automation path, but keeps the
browser product's current simplicity intact.

### Hosted MCP first

Rejected. A hosted service would send private inputs off-device and requires
security and operations capabilities that are unrelated to local developer
transforms. It would be misleading to present that as an ordinary extension of
the website.

### Browser extension or browser-to-localhost bridge

Rejected. It would blur the consent boundary between a webpage and a local
process, increase local-network attack surface, and make it easy to leak a
visible draft or shared hash unintentionally.

### Local stdio package after contract hardening

Accepted as a future option. Stdio scopes the connection to the AI client that
spawned the process and avoids exposing a listening port. It preserves a clear
data path: the client sends only the arguments for one tool call to a local
process, which returns only that result to the same client.

## Consequences

### Positive

- The product remains truthful about local-first processing and does not add
  server-side payload retention by implication.
- Pure core logic and catalog metadata remain reusable without making either
  package a premature public AI API.
- A future AI adapter can be reviewed and versioned independently from the
  browser UI and search delivery.
- The MCP path is deliberately narrower than the browser: no implicit
  clipboard, upload, share, history, filesystem, or network capabilities.

### Costs and limits

- AI users cannot configure Kitland as an MCP server until the explicit
  package and its release gates exist.
- A local MCP server is executable code and still runs with the permissions of
  its host process. Installation documentation must show the exact command and
  pin a reviewed package version; it must never encourage a `curl | sh` or
  opaque one-click launcher.
- A stdio adapter must be careful not to write ordinary logs to stdout, which
  would corrupt JSON-RPC messages. Payloads must not be written to stderr
  either.
- The adapter adds a separate compatibility and test commitment for MCP
  clients; the web app is not a substitute for those tests.

## Release gates for `@kitland/mcp`

Before creating or publishing the package, all of the following must be true:

1. Each exposed operation has an approved declaration described in the
   architecture contract, including JSON schemas, UTF-8 byte limits, timeout,
   error vocabulary, example vectors, and a named owner.
2. The operation calls a pure `@kitland/core` function and has no hidden
   browser, filesystem, network, shell, environment-secret, or mutable global
   dependency.
3. Protocol tests cover initialize, pagination-safe `tools/list`, valid and
   invalid `tools/call`, schemas, bounded results, malformed JSON-RPC, and
   stdout cleanliness. Regression tests prove that errors and diagnostics do
   not echo the caller's payload.
4. A security review covers dependency integrity, local-process installation,
   capability minimization, denial-of-service limits, logging, and client
   compatibility. The package has a `SECURITY.md` contact and a supported
   version policy before publication.
5. The release includes an exact-version configuration example for supported
   clients, a changelog, an SBOM/dependency audit path, and a manual test with
   an MCP inspector or real client.

## Hosted MCP reconsideration gate

A hosted service is not the next automatic step. It needs a separate ADR and
an explicit product decision backed by sustained user demand. That ADR must
cover authenticated tenancy, consent, rate and cost controls, input/output
retention and deletion, encryption, regional handling, audit logs, abuse and
prompt-injection controls, secure authorization, incident response, status
operations, and a privacy-policy update. It must also state exactly which
tool inputs leave the device and why a local stdio package cannot meet the
need.

## SEO clarification

MCP is an automation protocol, not a crawlable publishing channel. It cannot
create route-specific HTML, canonical URLs, structured data, social previews,
or sitemap entries. Astro's static tool documents remain the SEO system of
record; the MCP package must never put call input into URLs or alter a page's
canonical metadata.

## Rollback

Because no MCP package or hosted endpoint is introduced by this decision,
there is no production service to roll back. If a future local package proves
unsafe or incompatible, unpublish only within the registry's policy, mark the
affected release unsupported, document the safe replacement, and keep the web
tool available. Do not route callers to a hosted fallback as an emergency
measure.
