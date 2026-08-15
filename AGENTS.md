# Kitland agent guide

Use this as the always-on guardrail. For a tool vertical slice, also follow
`.claude/skills/build-kitland-tool/SKILL.md`.

## Source of truth

1. Start with `docs/architecture/README.md`, then the selected tool's catalog
   definition and tests.
2. Read `tool-patterns.md`, `tool-ui-contract.md`,
   `platform-capabilities.md`, and `tool-rollout.md` before changing a tool.
3. Treat `design/design.pen` as visual source of truth. Access it only through
   Pencil MCP; never use shell, filesystem, or text tools to read a `.pen`
   file. Static frames do not replace accessibility, focus, error, or keyboard
   behavior from the written contracts.

## Implementation boundaries

- Work as a vertical slice: pure bounded core → catalog contract → host
  adapters → static SEO/docs → tests and browser evidence.
- Keep `packages/core` deterministic and free of DOM, React, browser,
  extension, VS Code, network, filesystem, and persistence APIs.
- Every tool explicitly declares all three platform contracts. Availability on
  one host never authorizes another host.
- Preserve unrelated working-tree changes. Do not hand-copy shared registry or
  UI primitive logic into a tool.

## Privacy and sharing

- Never persist input/output payloads, secrets, generated values, or telemetry
  by default.
- Browser extension and VS Code are local-only: no payload network request.
  Their sharing availability is explicit per host and must never be inferred
  from Web.
- A declared Web `share-link` is fragment-only: create it only after explicit
  activation, include current input plus minimum replay state, discard the
  current query string, keep the payload out of query parameters, and make no
  network request. Disclose that the link includes input and must not contain
  secrets.
- Any server upload, retention, opaque link, or network-enabled sharing needs
  a new approved architecture/privacy decision before implementation.

## UX and verification

- Use the declared `transform`, `generate`, `diff`, or `inspect` pattern.
  Each action has one visible owner; icon-only controls have accessible names.
- Cover empty, sample, valid, invalid, processing, limit, focus, keyboard, and
  responsive desktop/tablet/mobile states. Errors are actionable and not
  color-only; success feedback does not shift layout.
- Test core vectors for valid, malformed, Unicode, boundary, oversize, and
  host-specific capability/permission failures. Run focused package checks,
  then the relevant repository gates. Do not claim browser/design verification
  without having exercised it.
