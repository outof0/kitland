import { decodeBase64, encodeBase64, ok, type ToolResult } from "@kitland/core";
import {
  buildAdvertisedOutputSchema,
  DEFAULT_MCP_LIMITS,
  DEFAULT_MCP_SAFETY,
  type McpExposure,
} from "../contracts.ts";
import { createMcpError, type McpErrorPayload } from "../errors.ts";

export type Base64Input = {
  readonly input: string;
  readonly urlSafe?: boolean;
};

export type Base64Output = {
  readonly output: string;
  readonly format: "standard" | "url-safe";
};

const BASE64_INPUT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: {
      type: "string",
      description: "Text content to process.",
    },
    urlSafe: {
      type: "boolean",
      description: "When true, use or expect URL-safe Base64 alphabet (- and _).",
    },
  },
} as const;

const BASE64_SUCCESS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "format"],
  properties: {
    output: {
      type: "string",
      description: "Transformed string output.",
    },
    format: {
      type: "string",
      enum: ["standard", "url-safe"],
      description: "Format variant produced or decoded.",
    },
  },
} as const;

export const kitlandBase64EncodeExposure: McpExposure<Base64Input, Base64Output> = {
  mcpName: "kitland_base64_encode",
  operationId: "base64_encode",
  contractVersion: 1,
  registryToolId: "base64",
  title: "Base64 Encode",
  description: "Encode UTF-8 text to standard or URL-safe Base64.",
  inputSchema: BASE64_INPUT_JSON_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(BASE64_SUCCESS_JSON_SCHEMA),
  successSchema: BASE64_SUCCESS_JSON_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: Base64Input): ToolResult<Base64Output> => {
    const res = encodeBase64(args.input, { urlSafe: args.urlSafe === true });
    if (!res.ok) {
      return res;
    }
    return ok({
      output: res.value,
      format: args.urlSafe ? "url-safe" : "standard",
    });
  },
  mapCoreError: (code: string): McpErrorPayload => {
    if (code === "INPUT_TOO_LARGE") {
      return createMcpError("INPUT_TOO_LARGE", "Input text exceeds the maximum allowed size.");
    }
    return createMcpError("INVALID_INPUT", "Base64 encoding failed.");
  },
};

export const kitlandBase64DecodeExposure: McpExposure<Base64Input, Base64Output> = {
  mcpName: "kitland_base64_decode",
  operationId: "base64_decode",
  contractVersion: 1,
  registryToolId: "base64",
  title: "Base64 Decode",
  description: "Decode standard or URL-safe Base64 to UTF-8 text.",
  inputSchema: BASE64_INPUT_JSON_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(BASE64_SUCCESS_JSON_SCHEMA),
  successSchema: BASE64_SUCCESS_JSON_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: Base64Input): ToolResult<Base64Output> => {
    const res = decodeBase64(args.input, { urlSafe: args.urlSafe === true });
    if (!res.ok) {
      return res;
    }
    return ok({
      output: res.value,
      format: args.urlSafe ? "url-safe" : "standard",
    });
  },
  mapCoreError: (code: string): McpErrorPayload => {
    if (code === "INPUT_TOO_LARGE") {
      return createMcpError("INPUT_TOO_LARGE", "Input Base64 exceeds the maximum allowed size.");
    }
    if (code === "INVALID_BASE64") {
      return createMcpError("INVALID_INPUT", "Input is not valid canonical Base64.");
    }
    if (code === "INVALID_UTF8") {
      return createMcpError("INVALID_INPUT", "Decoded payload is not valid UTF-8 text.");
    }
    return createMcpError("INVALID_INPUT", "Base64 decoding failed.");
  },
};
