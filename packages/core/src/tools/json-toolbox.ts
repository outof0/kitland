import { err, ok, type ToolResult } from "../result";

export type JsonRootType = "object" | "array" | "string" | "number" | "boolean" | "null";

export type JsonInspection = {
  readonly formatted: string;
  readonly rootType: JsonRootType;
  readonly totalValues: number;
  readonly objectCount: number;
  readonly arrayCount: number;
  readonly stringCount: number;
  readonly numberCount: number;
  readonly booleanCount: number;
  readonly nullCount: number;
  readonly maxDepth: number;
};

export const JSON_TOOLBOX_MAX_INPUT_CHARS = 1_000_000;
export const JSON_TOOLBOX_MAX_NODES = 100_000;
export const JSON_TOOLBOX_MAX_DEPTH = 128;

/** Validate, format and inspect a JSON document without executing its content. */
export function inspectJson(source: string, indent: 2 | 4 = 2): ToolResult<JsonInspection> {
  if (source.length > JSON_TOOLBOX_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `JSON input exceeds the ${JSON_TOOLBOX_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (source.trim().length === 0) return err("EMPTY_INPUT", "Enter a JSON document to inspect.");

  let value: JsonValue;
  try {
    value = JSON.parse(source) as JsonValue;
  } catch (cause) {
    const detail = cause instanceof SyntaxError && cause.message ? ` ${cause.message}` : "";
    return err("INVALID_JSON", `JSON is invalid.${detail}`);
  }

  const stats = {
    totalValues: 0,
    objectCount: 0,
    arrayCount: 0,
    stringCount: 0,
    numberCount: 0,
    booleanCount: 0,
    nullCount: 0,
    maxDepth: 0,
  };
  const stack: Array<{ readonly value: JsonValue; readonly depth: number }> = [{ value, depth: 0 }];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    stats.totalValues += 1;
    stats.maxDepth = Math.max(stats.maxDepth, current.depth);
    if (stats.totalValues > JSON_TOOLBOX_MAX_NODES) {
      return err(
        "INPUT_TOO_COMPLEX",
        `JSON exceeds the ${JSON_TOOLBOX_MAX_NODES.toLocaleString()} value limit.`,
      );
    }
    if (current.depth > JSON_TOOLBOX_MAX_DEPTH) {
      return err(
        "INPUT_TOO_DEEP",
        `JSON exceeds the ${JSON_TOOLBOX_MAX_DEPTH}-level nesting limit.`,
      );
    }

    if (current.value === null) {
      stats.nullCount += 1;
    } else if (Array.isArray(current.value)) {
      stats.arrayCount += 1;
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        stack.push({ value: current.value[index] as JsonValue, depth: current.depth + 1 });
      }
    } else if (typeof current.value === "object") {
      stats.objectCount += 1;
      const values = Object.values(current.value);
      for (let index = values.length - 1; index >= 0; index -= 1) {
        stack.push({ value: values[index] as JsonValue, depth: current.depth + 1 });
      }
    } else if (typeof current.value === "string") {
      stats.stringCount += 1;
    } else if (typeof current.value === "number") {
      stats.numberCount += 1;
    } else {
      stats.booleanCount += 1;
    }
  }

  return ok({
    formatted: JSON.stringify(value, null, indent),
    rootType: rootType(value),
    ...stats,
  });
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function rootType(value: JsonValue): JsonRootType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value as "string" | "number" | "boolean";
}
