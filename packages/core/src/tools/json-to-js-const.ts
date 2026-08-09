import { err, ok, type ToolResult } from "../result";

export const JSON_TO_JS_CONST_MAX_INPUT_CHARS = 500_000;

export function jsonToJsConst(
  source: string,
  name = "value",
  indent: 2 | 4 = 2,
): ToolResult<string> {
  if (source.length > JSON_TO_JS_CONST_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "JSON input exceeds the size limit.");
  if (!source.trim()) return err("EMPTY_INPUT", "Enter a JSON value.");
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name))
    return err("INVALID_IDENTIFIER", "Const name must be a valid JavaScript identifier.");
  if (indent !== 2 && indent !== 4) return err("INVALID_INDENT", "Indent must be 2 or 4 spaces.");
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (cause) {
    const detail = cause instanceof SyntaxError && cause.message ? ` ${cause.message}` : "";
    return err("INVALID_JSON", `JSON is invalid.${detail}`);
  }
  const body = JSON.stringify(value, null, indent);
  return ok(`const ${name} = ${body};\n`);
}
