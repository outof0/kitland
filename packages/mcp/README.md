# @kitland/mcp

Capability-minimal, local Model Context Protocol (MCP) server for Kitland developer utilities.

## Overview

`@kitland/mcp` exposes pure developer utilities over local `stdio` to MCP-capable AI clients (such as Claude Desktop, Cursor, and IDE extensions).

- **Transport:** Local `stdio` only.
- **Capabilities:** No network requests, no filesystem persistence, no shell execution, no background listeners, and no telemetry.
- **Processing:** Bounded in-memory transforms powered by `@kitland/core`, plus explicit local generators that use OS entropy or the current time when their operation requires it.

## Client Configuration

To configure Kitland MCP in your AI client, pin the exact version:

```json
{
  "mcpServers": {
    "kitland": {
      "command": "npx",
      "args": ["-y", "@kitland/mcp@0.1.0"]
    }
  }
}
```

## Security and Privacy Notice

1. **Local-only execution:** The server runs as a local child process communicating strictly via standard input/output (`stdio`).
2. **No telemetry or remote persistence:** Request payloads and results are processed in memory and never sent over the network or saved to disk.
3. **Execution context:** The process runs with the privileges of your OS user.
4. **Model privacy:** Tool arguments and results are exchanged with your configured AI client/provider according to your client's privacy policy. Avoid passing sensitive secrets or private credentials.

## Exposed operations

At v0.1.0, `tools/list` exposes 80 bounded local operations for the canonical
65-tool Kitland registry. Most operations are deterministic transforms; UUID,
token, password, key, random-value, and time-relative operations explicitly
produce fresh values. Operations are discovered from the running server so
clients receive the exact current names, descriptions, and JSON Schemas rather
than relying on a stale hand-maintained list.

Representative operations include:

- `kitland_base64_encode` / `kitland_base64_decode` for UTF-8 Base64.
- `kitland_json_format` / `kitland_json_minify` for structured JSON text.
- `kitland_join_lines` and `kitland_split_to_newlines` for bounded text
  transforms.

Use the schema returned by `tools/list` before calling an operation. The server
rejects malformed arguments and returns structured error results; it never
falls back to shell, network, or filesystem behavior.

## Limits

- Maximum argument size: 512 KiB UTF-8
- Maximum canonical output: 1 MiB UTF-8
- Maximum complete serialized envelope: 2.25 MiB UTF-8
- Execution deadline: 5000 ms

## License

MIT
