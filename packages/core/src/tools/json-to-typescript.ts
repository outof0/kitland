import { err, ok, type ToolResult } from "../result";

export const JSON_TO_TYPESCRIPT_MAX_INPUT_CHARS = 500_000;
export const JSON_TO_TYPESCRIPT_MAX_DEPTH = 32;

export function jsonToTypescript(
  source: string,
  typeName = "Root",
  indent: 2 | 4 = 2,
): ToolResult<string> {
  if (source.length > JSON_TO_TYPESCRIPT_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "JSON input exceeds the size limit.");
  if (!source.trim()) return err("EMPTY_INPUT", "Enter a JSON value.");
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(typeName))
    return err("INVALID_TYPE_NAME", "Type name must be a simple identifier.");
  if (indent !== 2 && indent !== 4) return err("INVALID_INDENT", "Indent must be 2 or 4 spaces.");
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (cause) {
    const detail = cause instanceof SyntaxError && cause.message ? ` ${cause.message}` : "";
    return err("INVALID_JSON", `JSON is invalid.${detail}`);
  }
  try {
    const body = emitType(value, 0, indent);
    return ok(`export type ${typeName} = ${body};\n`);
  } catch (e) {
    return err("CONVERT_FAILED", e instanceof Error ? e.message : "Could not emit TypeScript.");
  }
}

function emitType(value: unknown, depth: number, indent: 2 | 4): string {
  if (depth > JSON_TO_TYPESCRIPT_MAX_DEPTH)
    throw new Error("Nesting exceeds the TypeScript depth limit.");
  if (value === null) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    const inner = [...new Set(value.map((v) => emitType(v, depth + 1, indent)))];
    return inner.length === 1 ? `${inner[0]}[]` : `(${inner.join(" | ")})[]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "Record<string, never>";
    const pad = " ".repeat((depth + 1) * indent);
    const lines = entries.map(([k, v]) => {
      const key = /^[A-Za-z_][A-Za-z0-9_]*$/.test(k) ? k : JSON.stringify(k);
      return `${pad}${key}: ${emitType(v, depth + 1, indent)};`;
    });
    return `{\n${lines.join("\n")}\n${" ".repeat(depth * indent)}}`;
  }
  throw new Error("Unsupported JSON value.");
}
