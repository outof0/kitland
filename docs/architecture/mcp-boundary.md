# MCP and AI adapter boundary

**Status:** implementation contract for a future optional package. No
`@kitland/mcp` package or hosted MCP endpoint exists today.
**Decision:** [ADR 0002](../adr/0002-local-mcp-boundary-and-hosted-deferral.md).

This document makes a local stdio adapter implementable without accidentally
turning the browser registry into a remote data service. It follows MCP's
tools model for discovery, JSON-Schema arguments, and structured results; the
future package must pin the exact MCP SDK/protocol version it supports and test
that version rather than relying on this document alone.

## Current boundary and non-goals

| Layer                 | Current responsibility                                                      | MCP rule                                                                                                             |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `@kitland/core`       | Pure, bounded domain transforms returning `ToolResult<T>`                   | Remains the single transform implementation. No MCP, Node, DOM, network, or filesystem APIs are added here.          |
| `@kitland/tools`      | Tool identity, browser copy, family, status, and UI pattern                 | Does **not** make a tool callable. A future operation needs a separate approved exposure declaration.                |
| `apps/web`            | Local editor UX, clipboard/upload, opt-in fragment sharing, browser storage | Does not import, launch, configure, or talk to `@kitland/mcp`. Browser payloads are never a source of MCP arguments. |
| Future `@kitland/mcp` | Local protocol adapter                                                      | Validates explicit client arguments, invokes core, and returns bounded MCP results.                                  |

The first adapter deliberately excludes hosted HTTP, OAuth, resources, prompts,
sampling, filesystem access, network access, shell commands, background jobs,
state persistence, analytics, and browser extensions. It does not expose
coming-soon tools or every browser feature.

When the package is opened, keep its dependency direction and source layout
small and one-way:

```text
packages/mcp/
  src/contracts.ts      McpExposure types, byte/result guards, error mapping
  src/exposures/        explicit reviewed operation declarations
  src/server.ts         stdio lifecycle plus tools/list and tools/call wiring
  test/                 raw stdio, contract, budget, and capability tests

@kitland/mcp ──imports──► @kitland/core and @kitland/tools
@kitland/core / @kitland/tools ──never import──► @kitland/mcp
```

```text
AI client (user-configured local process)
  │ explicit tools/list or tools/call arguments over stdio
  ▼
@kitland/mcp
  │ schema + byte/deadline gate; no host capability access
  ▼
approved operation registry ─────────────► @kitland/tools metadata
  │                                          (identity/copy only)
  ▼
@kitland/core
  │ ToolResult<T>
  ▼
bounded MCP result back to the same stdio client

apps/web ── no connection ──► @kitland/mcp
```

## Exposure is explicit, operation-level, and immutable

The future package owns an internal `McpExposure` registry. It is generated or
hand-authored from reviewed declarations, but it is **not** derived by simply
filtering `listAvailableTools()`.

The following type is a design contract, not source code to copy verbatim:

```ts
type McpExposure<Input, Output> = {
  /** Stable forever after publication, e.g. "kitland_base64_encode". */
  mcpName: string;
  /** Stable internal operation id, separate from UI route slugs. */
  operationId: string;
  /** Starts at 1; changes only for a breaking operation contract. */
  contractVersion: number;
  registryToolId: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  limits: {
    maxInputUtf8Bytes: number;
    maxOutputUtf8Bytes: number;
    maxSerializedResultUtf8Bytes: number;
    timeoutMs: number;
  };
  safety: {
    readOnly: true;
    idempotent: true;
    network: "none";
    filesystem: "none";
    persistence: "none";
    logs: "metadata-only";
  };
  invoke(input: Input): ToolResult<Output> | Promise<ToolResult<Output>>;
};
```

Rules for every declaration:

- `mcpName` is 1–128 lowercase ASCII letters, digits, or underscores, with a
  `kitland_` prefix. Never derive it from translated display copy or
  rename/reuse it after publication.
- An MCP operation maps to one unambiguous behavior. Prefer separate
  `kitland_base64_encode` and `kitland_base64_decode` operations over a
  mode-switching command whose semantic meaning can drift.
- `registryToolId` is traceability only. The UI route may change independently;
  it is not the protocol contract.
- `inputSchema` has an object root, rejects unknown properties, documents each
  optional field, and never accepts a free-form configuration object. Runtime
  validation still measures UTF-8 bytes because JSON Schema string length is
  not a byte limit.
- `outputSchema` defines the exact JSON shape returned in `structuredContent`.
  Its fields must be finite, deterministic, and safe to show to an AI client.
- MCP annotations may state read-only/idempotent behavior, but they are hints
  to a client, not an authorization or security boundary. The adapter enforces
  its own restrictions.

An initial text-transform default is intentionally tighter than the browser:

| Limit                 | Initial local-MCP default | Why                                                                                  |
| --------------------- | ------------------------: | ------------------------------------------------------------------------------------ |
| Input                 |     512 KiB of UTF-8 data | Bounds JSON-RPC parsing and local process memory.                                    |
| Canonical output      |       1 MiB of UTF-8 data | Keeps a successful transform useful without giant model context injection.           |
| Serialized MCP result |    2.25 MiB of UTF-8 data | Accounts for `structuredContent` plus the compact text compatibility representation. |
| Deadline              |                 5 seconds | Stops a blocked adapter result from remaining actionable indefinitely.               |

An operation may only choose tighter limits. A request to raise one requires a
benchmark, a denial-of-service review, updated fixtures, and a new approved
exposure declaration. These adapter caps apply before and after the broader
limits in `@kitland/core`.

Measure the argument object and complete response envelope with
`TextEncoder`-encoded JSON, not JavaScript `string.length`. The response
budget includes both `structuredContent` and its compact text compatibility
copy. This keeps Unicode and duplicated wire data inside an explicit limit.

## Discovery and invocation contract

### `tools/list`

Advertise only reviewed entries from the exposure registry. Each entry includes
the stable name, human-readable title/description, input schema, output schema,
and truthful read-only/idempotent annotations. The first release has a static
registry for the lifetime of the process, so it does not claim dynamic
tool-list notifications. Support pagination if the chosen MCP SDK/protocol
requires it, even when the first list fits in one page.

The listing must be deterministic: sorting is by `mcpName`, descriptions are
versioned source text, and no client, environment, user path, or browser state
changes the advertised capabilities.

### `tools/call`

For a recognized operation, the adapter takes this order:

1. Reject unknown operation names at the protocol level; reject invalid
   operation arguments as a tool result with `isError: true`.
2. Validate the argument object against the declared schema, then enforce the
   UTF-8 input cap and deadline before calling core.
3. Invoke the declared pure function only. Do not inspect the current
   directory, environment, user files, clipboard, browser process, or network.
4. Validate the mapped output against `outputSchema`, enforce output and total
   serialized-result caps, then return it. A result that cannot fit is a
   bounded `OUTPUT_TOO_LARGE` error, never a partial, silently truncated
   transform.

For a successful call, `structuredContent` is the canonical object. Include a
compact JSON text content block for clients that do not yet consume structured
results, as recommended by the MCP tools specification. The text is the same
data, not a model-facing essay, and it is included in the serialized-result
budget. Every result string is caller-derived, untrusted data: no adapter
description, error, or wrapper may reinterpret it as an instruction to a model
or a request for more privileges.

For an expected tool failure, return:

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"ok\":false,\"error\":{\"code\":\"INVALID_INPUT\",\"message\":\"Use canonical Base64.\"}}"
    }
  ],
  "structuredContent": {
    "ok": false,
    "error": { "code": "INVALID_INPUT", "message": "Use canonical Base64." }
  },
  "isError": true
}
```

The `message` is actionable, stable enough to document, at most 240 UTF-8
bytes, and never quotes the input, output, filesystem path, stack trace,
environment variable, or dependency error. Unexpected failures map to a
generic `INTERNAL_ERROR`; detailed diagnostic data remains local to a
maintainer's explicitly enabled, metadata-only diagnostic channel.

### Example future Base64 operations

These examples demonstrate the boundary; they do not create an MCP API today.

| MCP name                | Required arguments                         | Successful structured result                               | Core call                          |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------------- | ---------------------------------- |
| `kitland_base64_encode` | `{ "input": string, "urlSafe"?: boolean }` | `{ "output": string, "format": "standard" \| "url-safe" }` | `encodeBase64(input, { urlSafe })` |
| `kitland_base64_decode` | `{ "input": string, "urlSafe"?: boolean }` | `{ "output": string, "format": "standard" \| "url-safe" }` | `decodeBase64(input, { urlSafe })` |

Their schemas must use `additionalProperties: false`, document empty input,
and use a runtime UTF-8 gate in addition to any `maxLength`. Core's detailed
errors may be mapped to the stable adapter error vocabulary; they are not
automatically public protocol text.

## Privacy, process, and logging rules

The local package is private-data handling code even though it makes no network
requests. It must obey all of these rules:

- **Consent and data path:** the AI client passes explicit call arguments. The
  adapter never reads a browser tab, `localStorage`, URL fragment, clipboard,
  upload, shell history, home directory, or environment secret.
- **No persistence:** retain request/result data only for the active call. Do
  not write cache, history, analytics, crash reports, or telemetry. JavaScript
  cannot reliably zero every string buffer, so documentation must not promise
  secure memory erasure.
- **Stdio discipline:** stdout contains JSON-RPC only. Default stderr is
  silent; an opt-in diagnostic mode writes only event names, operation name,
  sizes, duration, and error code—never payloads. Do not use `console.log`.
- **Capability discipline:** do not bind a local port, spawn a child process,
  read/write files, or make a network request. Production dependencies must be
  reviewed for telemetry and post-install behavior.
- **Supply-chain discipline:** publish a signed/tagged, exact-version release
  with a changelog and integrity-verifiable package-manager install. The docs
  show the full command and warn that a local MCP process runs with the client's
  user permissions.

MCP's security guidance specifically recommends stdio to limit a local server
to its MCP client. That transport choice is useful, but it is not a sandbox;
the package must still stay capability-minimal and treat every client argument
as untrusted.

## Compatibility, versioning, and ownership

- The `@kitland/mcp` package follows SemVer. Patches fix implementation bugs
  without changing schema or behavior; minors may add new operations or truly
  optional fields; majors are required for removing/renaming an operation,
  changing a required field/type, reducing a limit, or changing a documented
  transform meaning.
- `contractVersion` is per operation and changes only for a breaking operation
  contract. A package major may contain more than one operation version during
  a documented migration period, but an old `mcpName` must never silently begin
  doing something else.
- Pin the accepted MCP SDK and protocol revision set in package metadata and test
  against it. For v1:
  - SDK: `@modelcontextprotocol/sdk@1.30.0`
  - Preferred protocol: `2025-11-25`
  - Accepted stable set: `2025-11-25`, `2025-06-18`, `2025-03-26`, `2024-11-05`, `2024-10-07`
    A protocol/SDK upgrade gets its own compatibility review and changelog entry.
- The tool owner approves semantics and fixtures; a security owner approves
  limits and capability changes; a release owner owns package publication and
  supported-client documentation.

## Required test matrix before publishing

1. Core test vectors run through the adapter and produce the same successful
   values or intentionally documented error mappings.
2. Schema tests cover absent, wrong-type, unknown, boundary, Unicode, and
   oversized arguments; result schemas validate success and every error shape.
3. Raw stdio transcript tests cover initialize, the snapshotted preferred and
   accepted stable protocol versions, `tools/list`, `tools/call`, malformed requests,
   unknown tools, and protocol-version negotiation (including rejection of unsupported versions).
4. Output-budget tests prove no partial payload, no duplicate large data beyond
   the total budget, and no payload in errors or diagnostics.
5. Process tests prove stdout is protocol-only and that ordinary tool calls do
   not access network, files, child processes, browser state, or persistence.
6. Compatibility tests snapshot the published tool names and schemas; a diff
   needs an explicit versioning decision.
7. Run the package against a supported client or MCP inspector and record the
   exact client/SDK versions in release notes.

## SEO boundary

MCP contributes no crawlable document and must not be counted toward the web
SEO strategy. Search visibility remains owned by Astro's static routes,
canonical metadata, JSON-LD, social image, `robots.txt`, and sitemap. An MCP
call must never change those documents, create an indexable call URL, or put a
user payload in a canonical/query URL.

## References

- [MCP tools specification (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [MCP schema reference (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/schema)
- [MCP security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices)
