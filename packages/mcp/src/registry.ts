import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { McpExposure } from "./contracts.ts";
import { DEFAULT_EXPOSURES } from "./exposures/index.ts";
import {
  ARCHITECTURE_MAX_INPUT_UTF8_BYTES,
  ARCHITECTURE_MAX_OUTPUT_UTF8_BYTES,
  ARCHITECTURE_MAX_SERIALIZED_RESULT_UTF8_BYTES,
  ARCHITECTURE_MAX_TIMEOUT_MS,
} from "./limits.ts";

export type McpToolDefinition = {
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly inputSchema: Record<string, unknown>;
  readonly outputSchema?: Record<string, unknown>;
  readonly annotations?: ToolAnnotations;
};

const MCP_NAME_PATTERN = /^kitland_[a-z0-9_]{1,120}$/;

export class McpRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly exposuresByName: ReadonlyMap<string, McpExposure<any, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly sortedExposures: ReadonlyArray<McpExposure<any, any>>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(exposures: ReadonlyArray<McpExposure<any, any>> = DEFAULT_EXPOSURES) {
    const seenNames = new Set<string>();
    const seenOpIds = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, McpExposure<any, any>>();

    for (const exp of exposures) {
      if (!MCP_NAME_PATTERN.test(exp.mcpName)) {
        throw new Error(
          `Invalid MCP operation name: "${exp.mcpName}". Must match /^kitland_[a-z0-9_]{1,120}$/.`,
        );
      }
      if (seenNames.has(exp.mcpName)) {
        throw new Error(`Duplicate MCP operation name registered: "${exp.mcpName}".`);
      }
      if (seenOpIds.has(exp.operationId)) {
        throw new Error(`Duplicate internal operationId registered: "${exp.operationId}".`);
      }

      // Safety check
      if (!exp.safety.readOnly || !exp.safety.idempotent) {
        throw new Error(`Exposure "${exp.mcpName}" must declare readOnly and idempotent safety.`);
      }
      if (typeof exp.safety.deterministic !== "boolean") {
        throw new Error(`Exposure "${exp.mcpName}" must explicitly declare determinism.`);
      }
      if (
        exp.safety.network !== "none" ||
        exp.safety.filesystem !== "none" ||
        exp.safety.persistence !== "none"
      ) {
        throw new Error(`Exposure "${exp.mcpName}" declares unsafe capabilities.`);
      }

      // Limits check
      if (
        exp.limits.maxInputUtf8Bytes > ARCHITECTURE_MAX_INPUT_UTF8_BYTES ||
        exp.limits.maxOutputUtf8Bytes > ARCHITECTURE_MAX_OUTPUT_UTF8_BYTES ||
        exp.limits.maxSerializedResultUtf8Bytes > ARCHITECTURE_MAX_SERIALIZED_RESULT_UTF8_BYTES ||
        exp.limits.timeoutMs > ARCHITECTURE_MAX_TIMEOUT_MS
      ) {
        throw new Error(`Exposure "${exp.mcpName}" exceeds architecture maxima limits.`);
      }

      seenNames.add(exp.mcpName);
      seenOpIds.add(exp.operationId);
      map.set(exp.mcpName, exp);
    }

    const sorted = Array.from(map.values()).sort((a, b) => a.mcpName.localeCompare(b.mcpName));

    this.sortedExposures = Object.freeze(sorted);
    this.exposuresByName = Object.freeze(map);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(mcpName: string): McpExposure<any, any> | undefined {
    return this.exposuresByName.get(mcpName);
  }

  has(mcpName: string): boolean {
    return this.exposuresByName.has(mcpName);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list(): ReadonlyArray<McpExposure<any, any>> {
    return this.sortedExposures;
  }

  toToolDefinitions(): ReadonlyArray<McpToolDefinition> {
    return this.sortedExposures.map((exp) => ({
      name: exp.mcpName,
      title: exp.title,
      description: exp.description,
      inputSchema: exp.inputSchema,
      outputSchema: exp.outputSchema,
      annotations: {
        readOnlyHint: exp.safety.readOnly,
        idempotentHint: exp.safety.idempotent,
      },
    }));
  }
}
