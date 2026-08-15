import type { ToolResult } from "@kitland/core";
import Ajv from "ajv";
import { createMcpError, SHARED_ERROR_JSON_SCHEMA, type McpErrorPayload } from "./errors.ts";
import {
  DEFAULT_MCP_LIMITS,
  measureJsonUtf8Bytes,
  measureUtf8Bytes,
  type McpLimits,
} from "./limits.ts";

export { DEFAULT_MCP_LIMITS, type McpLimits };

const ajv = new Ajv({ allErrors: true, strict: false });

export type JsonSchema = Record<string, unknown>;

export type McpSafety = {
  readonly readOnly: true;
  readonly idempotent: true;
  readonly network: "none";
  readonly filesystem: "none";
  readonly persistence: "none";
  readonly logs: "metadata-only";
};

export const DEFAULT_MCP_SAFETY: McpSafety = {
  readOnly: true,
  idempotent: true,
  network: "none",
  filesystem: "none",
  persistence: "none",
  logs: "metadata-only",
};

export type McpExposure<Input, Output> = {
  readonly mcpName: string;
  readonly operationId: string;
  readonly contractVersion: number;
  readonly catalogToolId: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
  readonly outputSchema: JsonSchema;
  readonly successSchema: JsonSchema;
  readonly limits: McpLimits;
  readonly safety: McpSafety;
  readonly invoke: (input: Input) => ToolResult<Output> | Promise<ToolResult<Output>>;
  readonly mapCoreError?: (code: string, message: string) => McpErrorPayload;
};

export type McpCallResponse = {
  readonly content: ReadonlyArray<{
    readonly type: "text";
    readonly text: string;
  }>;
  readonly structuredContent: unknown;
  readonly isError?: boolean;
};

/**
 * Builds the composite advertised outputSchema containing oneOf [successSchema, sharedErrorSchema].
 */
export function buildAdvertisedOutputSchema(successSchema: JsonSchema): JsonSchema {
  return {
    type: "object",
    oneOf: [successSchema, SHARED_ERROR_JSON_SCHEMA],
  };
}

/**
 * Execute an McpExposure with complete validation, limits, error mapping, and envelope budgeting.
 */
export async function executeExposure<Input, Output>(
  exposure: McpExposure<Input, Output>,
  rawArgs: unknown,
): Promise<McpCallResponse> {
  // 1. Measure raw argument JSON bytes
  const argsByteLength = measureJsonUtf8Bytes(rawArgs ?? {});
  if (argsByteLength > exposure.limits.maxInputUtf8Bytes) {
    return formatErrorResponse(
      exposure,
      createMcpError("INPUT_TOO_LARGE", "Input data exceeds the maximum allowed UTF-8 size."),
    );
  }

  // 2. Validate input schema using Ajv
  const validateInput = ajv.compile(exposure.inputSchema);
  const isValidInput = validateInput(rawArgs ?? {});
  if (!isValidInput) {
    return formatErrorResponse(
      exposure,
      createMcpError("INVALID_INPUT", "Input arguments do not match the expected schema."),
    );
  }

  const input = rawArgs as Input;

  // 3. Execute with deadline enforcement
  // Note: Synchronous core work runs on the current turn and cannot be
  // preempted by the timer. Harden the boundary by clearing the timer and
  // documenting that CPU-bound ReDoS for `regex_test` remains best-effort
  // until the invoke is moved to a worker thread.
  let result: ToolResult<Output>;
  let deadlineHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const deadlinePromise = new Promise<never>((_, reject) => {
      deadlineHandle = setTimeout(() => {
        reject(new Error("DEADLINE_EXCEEDED"));
      }, exposure.limits.timeoutMs);
    });

    // Defer invoke to the next microtask so the deadline timer is armed
    // before any synchronous work starts. This does not preempt blocking
    // ReDoS but prevents the trivial leak where invoke is evaluated before
    // Promise.race.
    const invokePromise = Promise.resolve().then(() => exposure.invoke(input));

    result = await Promise.race([invokePromise, deadlinePromise]);
  } catch (err) {
    if (err instanceof Error && err.message === "DEADLINE_EXCEEDED") {
      return formatErrorResponse(
        exposure,
        createMcpError("DEADLINE_EXCEEDED", "Operation timed out before completion."),
      );
    }
    return formatErrorResponse(
      exposure,
      createMcpError("INTERNAL_ERROR", "An unexpected error occurred during execution."),
    );
  } finally {
    if (deadlineHandle !== undefined) clearTimeout(deadlineHandle);
  }

  // 4. Handle core failure
  if (!result.ok) {
    let errorPayload: McpErrorPayload;
    if (exposure.mapCoreError) {
      errorPayload = exposure.mapCoreError(result.error.code, result.error.message);
    } else {
      if (result.error.code === "INPUT_TOO_LARGE") {
        errorPayload = createMcpError("INPUT_TOO_LARGE", "Input data exceeds the maximum size.");
      } else {
        errorPayload = createMcpError("INVALID_INPUT", "The input could not be processed.");
      }
    }
    return formatErrorResponse(exposure, errorPayload);
  }

  // 5. Handle successful output
  const outputValue = result.value;

  // Validate output against successSchema
  const validateOutput = ajv.compile(exposure.successSchema);
  const isValidOutput = validateOutput(outputValue);
  if (!isValidOutput) {
    return formatErrorResponse(
      exposure,
      createMcpError("INTERNAL_ERROR", "Output data failed schema validation."),
    );
  }

  // Measure canonical output
  const outputBytes = measureJsonUtf8Bytes(outputValue);
  if (outputBytes > exposure.limits.maxOutputUtf8Bytes) {
    return formatErrorResponse(
      exposure,
      createMcpError("OUTPUT_TOO_LARGE", "Output data exceeds the maximum allowed UTF-8 size."),
    );
  }

  // 6. Format dual response and check complete serialized envelope
  const textContent = JSON.stringify(outputValue);
  const response: McpCallResponse = {
    content: [
      {
        type: "text",
        text: textContent,
      },
    ],
    structuredContent: outputValue,
  };

  const completeEnvelopeBytes = measureJsonUtf8Bytes(response);
  if (completeEnvelopeBytes > exposure.limits.maxSerializedResultUtf8Bytes) {
    return formatErrorResponse(
      exposure,
      createMcpError("OUTPUT_TOO_LARGE", "Complete response size exceeds envelope limit."),
    );
  }

  return response;
}

function formatErrorResponse<Input, Output>(
  exposure: McpExposure<Input, Output>,
  errorPayload: McpErrorPayload,
): McpCallResponse {
  const textContent = JSON.stringify(errorPayload);
  const response: McpCallResponse = {
    content: [
      {
        type: "text",
        text: textContent,
      },
    ],
    structuredContent: errorPayload,
    isError: true,
  };

  // Ensure error envelope also stays within bounds
  if (measureUtf8Bytes(textContent) > exposure.limits.maxSerializedResultUtf8Bytes) {
    const fallback = createMcpError("INTERNAL_ERROR", "Error response too large.");
    return {
      content: [{ type: "text", text: JSON.stringify(fallback) }],
      structuredContent: fallback,
      isError: true,
    };
  }

  return response;
}
