import { err, ok, type ToolResult } from "../result";

export type JsonFormatMode = "beautify" | "minify";

export type JsonFormatOptions = {
  /** Spaces used by Beautify mode. Defaults to 2; 4 is also supported. */
  readonly indent?: 2 | 4;
};

export const BEAUTIFY_MINIFY_MAX_INPUT_CHARS = 1_000_000;
export const BEAUTIFY_MINIFY_MAX_OUTPUT_CHARS = 2_000_000;

/** Validate and render a JSON document in readable or compact form. */
export function formatJson(
  source: string,
  mode: JsonFormatMode,
  options: JsonFormatOptions = {},
): ToolResult<string> {
  if (source.length > BEAUTIFY_MINIFY_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `JSON input exceeds the ${BEAUTIFY_MINIFY_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (source.trim().length === 0) return err("EMPTY_INPUT", "Enter a JSON document to format.");
  if (mode !== "beautify" && mode !== "minify") {
    return err("INVALID_MODE", "JSON mode must be either beautify or minify.");
  }

  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (cause) {
    const detail = cause instanceof SyntaxError && cause.message ? ` ${cause.message}` : "";
    return err("INVALID_JSON", `JSON is invalid.${detail}`);
  }

  const output = JSON.stringify(
    value,
    null,
    mode === "beautify" ? (options.indent ?? 2) : undefined,
  );
  if (output.length > BEAUTIFY_MINIFY_MAX_OUTPUT_CHARS) {
    return err(
      "OUTPUT_TOO_LARGE",
      `Formatted JSON exceeds the ${BEAUTIFY_MINIFY_MAX_OUTPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  return ok(output);
}
