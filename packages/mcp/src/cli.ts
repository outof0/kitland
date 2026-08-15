import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MAX_STDIO_FRAME_BYTES } from "./limits.ts";
import { createMcpServer } from "./server.ts";

async function main(): Promise<void> {
  const server = createMcpServer();

  const transport = new StdioServerTransport(process.stdin, process.stdout, {
    maxBufferSize: MAX_STDIO_FRAME_BYTES,
  });

  const handleTermination = async () => {
    try {
      await server.close();
    } catch {
      // Ignore errors on shutdown
    }
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void handleTermination();
  });

  process.on("SIGTERM", () => {
    void handleTermination();
  });

  await server.connect(transport);
}

void main().catch(() => {
  process.exit(1);
});
