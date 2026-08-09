import { err, ok, type ToolResult } from "../result";

export const JSON_TO_TOML_MAX_INPUT_CHARS = 1_000_000;
export const JSON_TO_TOML_MAX_OUTPUT_CHARS = 2_000_000;
export const JSON_TO_TOML_MAX_DEPTH = 64;
export const JSON_TO_TOML_MAX_NODES = 100_000;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type TableFrame = {
  readonly value: Record<string, JsonValue>;
  readonly path: readonly string[];
  readonly depth: number;
};

/** Convert a JSON object into deterministic TOML 1.0-compatible tables. */
export function jsonToToml(source: string): ToolResult<string> {
  if (source.length > JSON_TO_TOML_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `JSON input exceeds the ${JSON_TO_TOML_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (source.trim().length === 0) return err("EMPTY_INPUT", "Enter a JSON object to convert.");

  let root: JsonValue;
  try {
    root = JSON.parse(source) as JsonValue;
  } catch (cause) {
    const detail = cause instanceof SyntaxError && cause.message ? ` ${cause.message}` : "";
    return err("INVALID_JSON", `JSON is invalid.${detail}`);
  }
  if (!isRecord(root))
    return err("INVALID_ROOT", "TOML conversion requires a JSON object at the document root.");

  const lines: string[] = [];
  const tables: TableFrame[] = [{ value: root, path: [], depth: 0 }];
  let nodes = 0;

  while (tables.length > 0) {
    const table = tables.pop();
    if (!table) continue;
    if (table.depth > JSON_TO_TOML_MAX_DEPTH) {
      return err(
        "INPUT_TOO_DEEP",
        `JSON exceeds the ${JSON_TO_TOML_MAX_DEPTH}-level TOML table limit.`,
      );
    }
    if (table.path.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push(`[${table.path.map(tomlKey).join(".")}]`);
    }

    const childTables: TableFrame[] = [];
    for (const [key, value] of Object.entries(table.value)) {
      nodes += 1;
      if (nodes > JSON_TO_TOML_MAX_NODES) {
        return err(
          "INPUT_TOO_COMPLEX",
          `JSON exceeds the ${JSON_TO_TOML_MAX_NODES.toLocaleString()} value limit.`,
        );
      }
      if (isRecord(value)) {
        childTables.push({ value, path: [...table.path, key], depth: table.depth + 1 });
        continue;
      }
      const encoded = tomlValue(value, `/${escapePointer(key)}`);
      if (!encoded.ok) return encoded;
      lines.push(`${tomlKey(key)} = ${encoded.value}`);
    }
    for (let index = childTables.length - 1; index >= 0; index -= 1) {
      const child = childTables[index];
      if (child) tables.push(child);
    }
  }

  const output = lines.length > 0 ? `${lines.join("\n")}\n` : "";
  if (output.length > JSON_TO_TOML_MAX_OUTPUT_CHARS) {
    return err(
      "OUTPUT_TOO_LARGE",
      `TOML output exceeds the ${JSON_TO_TOML_MAX_OUTPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  return ok(output);
}

function tomlValue(value: JsonValue, path: string): ToolResult<string> {
  if (value === null)
    return err("UNSUPPORTED_VALUE", `TOML does not support null at ${path || "/"}.`);
  if (typeof value === "string") return ok(JSON.stringify(value));
  if (typeof value === "boolean") return ok(String(value));
  if (typeof value === "number") return ok(Object.is(value, -0) ? "0" : String(value));
  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index];
      if (item === undefined || Array.isArray(item) || isRecord(item)) {
        return err(
          "UNSUPPORTED_VALUE",
          `TOML arrays only support scalar values; found a nested value at ${path}/${index}.`,
        );
      }
      const encoded = tomlValue(item, `${path}/${index}`);
      if (!encoded.ok) return encoded;
      parts.push(encoded.value);
    }
    return ok(`[${parts.join(", ")}]`);
  }
  return err(
    "UNSUPPORTED_VALUE",
    `TOML tables must be declared from objects, not inline at ${path || "/"}.`,
  );
}

function tomlKey(value: string): string {
  return JSON.stringify(value);
}

function isRecord(value: JsonValue): value is { [key: string]: JsonValue } {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapePointer(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}
