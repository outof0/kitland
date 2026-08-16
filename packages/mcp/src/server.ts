import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { PACKAGE_VERSION, SERVER_NAME } from "./build-info.ts";
import { executeExposure } from "./contracts.ts";
import { McpRegistry } from "./registry.ts";

export type CreateMcpServerOptions = {
  readonly registry?: McpRegistry;
  readonly pageSize?: number;
};

/**
 * Creates and configures the Kitland low-level MCP server.
 */
export function createMcpServer(options: CreateMcpServerOptions = {}): Server {
  const registry = options.registry ?? new McpRegistry();
  const pageSize = options.pageSize;

  const server = new Server(
    {
      name: SERVER_NAME,
      version: PACKAGE_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Handle tools/list
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    const allTools = registry.toToolDefinitions();

    if (pageSize !== undefined && pageSize > 0) {
      let startIndex = 0;
      const cursor = request.params?.cursor;
      if (cursor !== undefined) {
        if (!/^(?:0|[1-9]\d*)$/.test(cursor)) {
          throw new McpError(ErrorCode.InvalidParams, "Invalid tools/list cursor.");
        }
        const parsed = Number(cursor);
        if (!Number.isSafeInteger(parsed) || parsed >= allTools.length) {
          throw new McpError(ErrorCode.InvalidParams, "Invalid tools/list cursor.");
        }
        startIndex = parsed;
      }
      const pageTools = allTools.slice(startIndex, startIndex + pageSize);
      const nextIndex = startIndex + pageSize;
      const nextCursor = nextIndex < allTools.length ? String(nextIndex) : undefined;

      return {
        tools: pageTools as unknown as Tool[],
        nextCursor,
      };
    }

    return {
      tools: allTools as unknown as Tool[],
    };
  });

  // Handle tools/call
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const exposure = registry.get(toolName);

    if (!exposure) {
      // Tool names are client-provided and may be rendered back into an AI
      // context by the caller. Keep protocol errors static rather than echoing
      // an untrusted value as if it were server-authored text.
      throw new McpError(ErrorCode.InvalidParams, "Tool not found.");
    }

    const response = await executeExposure(exposure, request.params.arguments ?? {});
    return {
      content: response.content,
      structuredContent: response.structuredContent as Record<string, unknown>,
      isError: response.isError,
    };
  });

  return server;
}
