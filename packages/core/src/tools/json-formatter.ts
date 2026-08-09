import { err, ok, type ToolResult } from "../result";
import type { JsonFormatMode } from "./beautify-minify";

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

export const JSON_FORMATTER_MAX_INPUT_CHARS = 1_000_000;
export const JSON_FORMATTER_MAX_NODES = 100_000;
export const JSON_FORMATTER_MAX_DEPTH = 128;
export const JSON_FORMATTER_MAX_OUTPUT_CHARS = 1_000_000;

/**
 * Validate, render, and inspect one JSON document without executing its
 * content. The default `beautify` mode preserves the original API; `minify`
 * emits the same native parsed value without insignificant whitespace.
 */
export function inspectJson(
  source: string,
  indent: 2 | 4 = 2,
  mode: JsonFormatMode = "beautify",
): ToolResult<JsonInspection> {
  if (source.length > JSON_FORMATTER_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `JSON input exceeds the ${JSON_FORMATTER_MAX_INPUT_CHARS.toLocaleString()} UTF-16 code unit limit.`,
    );
  }
  if (indent !== 2 && indent !== 4) {
    return err("INVALID_INDENT", "JSON indentation must be 2 or 4 spaces.");
  }
  if (mode !== "beautify" && mode !== "minify") {
    return err("INVALID_MODE", "JSON output mode must be beautify or minify.");
  }
  if (source.trim().length === 0) return err("EMPTY_INPUT", "Enter a JSON document to inspect.");
  if (exceedsDepthPreflight(source)) return depthError();

  let value: JsonValue;
  try {
    value = JSON.parse(source) as JsonValue;
  } catch {
    return err("INVALID_JSON", "JSON is invalid.");
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
    if (current.depth > JSON_FORMATTER_MAX_DEPTH) return depthError();

    stats.totalValues += 1;
    stats.maxDepth = Math.max(stats.maxDepth, current.depth);
    if (stats.totalValues > JSON_FORMATTER_MAX_NODES) return complexityError();

    if (current.value === null) {
      stats.nullCount += 1;
    } else if (Array.isArray(current.value)) {
      stats.arrayCount += 1;
      if (stats.totalValues + stack.length + current.value.length > JSON_FORMATTER_MAX_NODES) {
        return complexityError();
      }
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        stack.push({ value: current.value[index] as JsonValue, depth: current.depth + 1 });
      }
    } else if (typeof current.value === "object") {
      stats.objectCount += 1;
      const values = Object.values(current.value);
      if (stats.totalValues + stack.length + values.length > JSON_FORMATTER_MAX_NODES) {
        return complexityError();
      }
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

  const formatted = formatJsonBounded(value, indent, mode);
  if (!formatted.ok) return formatted;

  return ok({ formatted: formatted.value, rootType: rootType(value), ...stats });
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type FormatTask =
  | { readonly type: "text"; readonly value: string }
  | { readonly type: "value"; readonly value: JsonValue; readonly depth: number };

function exceedsDepthPreflight(source: string): boolean {
  let containers = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{" || character === "[") {
      containers += 1;
      if (containers > JSON_FORMATTER_MAX_DEPTH + 1) return true;
    } else if ((character === "}" || character === "]") && containers > 0) {
      containers -= 1;
    }
  }
  return false;
}

function depthError(): ToolResult<never> {
  return err(
    "INPUT_TOO_DEEP",
    `JSON exceeds the root-at-zero maximum depth of ${JSON_FORMATTER_MAX_DEPTH}.`,
  );
}

function complexityError(): ToolResult<never> {
  return err(
    "INPUT_TOO_COMPLEX",
    `JSON exceeds the ${JSON_FORMATTER_MAX_NODES.toLocaleString()} value limit.`,
  );
}

function outputError(): ToolResult<never> {
  return err(
    "OUTPUT_TOO_LARGE",
    `Formatted JSON exceeds the ${JSON_FORMATTER_MAX_OUTPUT_CHARS.toLocaleString()} UTF-16 code unit limit.`,
  );
}

function formatJsonBounded(
  value: JsonValue,
  indent: 2 | 4,
  mode: JsonFormatMode,
): ToolResult<string> {
  const chunks: string[] = [];
  let length = 0;
  const indentation = " ".repeat(indent);
  const tasks: FormatTask[] = [{ type: "value", value, depth: 0 }];

  const append = (chunk: string): boolean => {
    if (length + chunk.length > JSON_FORMATTER_MAX_OUTPUT_CHARS) return false;
    chunks.push(chunk);
    length += chunk.length;
    return true;
  };

  while (tasks.length > 0) {
    const task = tasks.pop();
    if (!task) continue;
    if (task.type === "text") {
      if (!append(task.value)) return outputError();
      continue;
    }

    const current = task.value;
    if (current === null || typeof current !== "object") {
      if (!append(JSON.stringify(current))) return outputError();
      continue;
    }

    const entries: ReadonlyArray<readonly [string | undefined, JsonValue]> = Array.isArray(current)
      ? current.map((child) => [undefined, child] as const)
      : Object.entries(current);
    const open = Array.isArray(current) ? "[" : "{";
    const close = Array.isArray(current) ? "]" : "}";
    if (entries.length === 0) {
      if (!append(open + close)) return outputError();
      continue;
    }

    tasks.push({
      type: "text",
      value: mode === "beautify" ? `\n${indentation.repeat(task.depth)}${close}` : close,
    });
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const [key, child] = entries[index] as readonly [string | undefined, JsonValue];
      if (index < entries.length - 1) tasks.push({ type: "text", value: "," });
      tasks.push({ type: "value", value: child, depth: task.depth + 1 });
      tasks.push({
        type: "text",
        value:
          mode === "beautify"
            ? `\n${indentation.repeat(task.depth + 1)}${key === undefined ? "" : `${JSON.stringify(key)}: `}`
            : key === undefined
              ? ""
              : `${JSON.stringify(key)}:`,
      });
    }
    tasks.push({ type: "text", value: open });
  }

  return ok(chunks.join(""));
}

function rootType(value: JsonValue): JsonRootType {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value as "string" | "number" | "boolean";
}
