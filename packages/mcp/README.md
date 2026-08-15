# @kitland/mcp

Deterministic, capability-minimal, local Model Context Protocol (MCP) server for Kitland developer utilities.

## Overview

`@kitland/mcp` exposes pure developer utilities over local `stdio` to MCP-capable AI clients (such as Claude Desktop, Cursor, and IDE extensions).

- **Transport:** Local `stdio` only.
- **Capabilities:** No network requests, no filesystem persistence, no shell execution, no background listeners, and no telemetry.
- **Processing:** Deterministic in-memory transforms powered by `@kitland/core`.

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

## Exposed Operations (v1)

### `kitland_base64_encode`

- **Input:** `{ "input": string, "urlSafe"?: boolean }`
- **Output:** `{ "output": string, "format": "standard" | "url-safe" }`
- **Description:** Encodes UTF-8 text to standard or URL-safe Base64.

### `kitland_base64_decode`

- **Input:** `{ "input": string, "urlSafe"?: boolean }`
- **Output:** `{ "output": string, "format": "standard" | "url-safe" }`
- **Description:** Decodes standard or URL-safe Base64 to UTF-8 text.

## Limits

- Maximum argument size: 512 KiB UTF-8
- Maximum canonical output: 1 MiB UTF-8
- Maximum complete serialized envelope: 2.25 MiB UTF-8
- Execution deadline: 5000 ms

## License

MIT
