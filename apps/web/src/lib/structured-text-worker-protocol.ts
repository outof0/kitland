import {
  BEAUTIFY_MINIFY_MAX_INPUT_CHARS,
  JSON_TO_CSV_MAX_INPUT_CHARS,
  JSON_TO_TOML_MAX_INPUT_CHARS,
  JSON_TO_YAML_MAX_INPUT_CHARS,
  SQL_FORMATTER_MAX_INPUT_CHARS,
  XML_FORMATTER_MAX_INPUT_CHARS,
  YAML_CODEC_MAX_INPUT_CHARS,
  type BeautifyMinifyLanguage,
  type BeautifyMinifyMode,
  type JsonFormatMode,
  type ToolResult,
} from "@kitland/core";

const MAX_ERROR_CODE_CHARS = 64;
const MAX_ERROR_MESSAGE_CHARS = 320;

/** The widest bounded result in this transform family is JSON → CSV. */
export const STRUCTURED_TEXT_WORKER_MAX_OUTPUT_CHARS = 8_000_000;

export type StructuredTextTransform =
  | {
      readonly tool: "beautify-minify";
      readonly mode: BeautifyMinifyMode;
      readonly indent: 2 | 4 | "tab";
      readonly language?: BeautifyMinifyLanguage;
    }
  | { readonly tool: "json-to-yaml"; readonly indent: 2 | 4 }
  | { readonly tool: "yaml-to-json"; readonly indent: 2 | 4 | "tab" }
  | { readonly tool: "json-to-csv"; readonly escapeFormulae: boolean }
  | { readonly tool: "json-to-toml" }
  | { readonly tool: "xml-formatter"; readonly indent: 2 | 4 | "tab" }
  | {
      readonly tool: "sql-formatter";
      readonly indent: 2 | 4 | "tab";
      readonly keywordCase: "upper" | "lower";
    };

export type StructuredTextWorkerRequest = StructuredTextTransform & {
  readonly type: "transform";
  readonly id: number;
  readonly source: string;
};

export type StructuredTextWorkerResponse = {
  readonly type: "result";
  readonly id: number;
  readonly result: ToolResult<string>;
};

/**
 * Derive a stable, complete identity for a transform. The hook reconstructs
 * its worker query from this key, so a render with an equivalent object does
 * not restart a pending worker request.
 */
export function structuredTextTransformKey(transform: StructuredTextTransform): string {
  switch (transform.tool) {
    case "beautify-minify":
      return `${transform.tool}:${transform.mode}:${transform.indent}:${transform.language ?? "auto"}`;
    case "json-to-yaml":
    case "yaml-to-json":
    case "xml-formatter":
      return `${transform.tool}:${transform.indent}`;
    case "json-to-csv":
      return `${transform.tool}:${String(transform.escapeFormulae)}`;
    case "json-to-toml":
      return transform.tool;
    case "sql-formatter":
      return `${transform.tool}:${transform.indent}:${transform.keywordCase}`;
  }
}

/** Convert a stable key back into a closed transform shape before messaging. */
export function parseStructuredTextTransformKey(
  value: string,
): StructuredTextTransform | undefined {
  const [tool, first, second, third, ...rest] = value.split(":");
  if (rest.length > 0) return undefined;
  const firstIndent = parseIndent(first);
  const firstSpaceIndent = parseSpaceIndent(first);
  const secondIndent = parseIndent(second);
  if (tool === "beautify-minify" && isJsonFormatMode(first) && secondIndent !== undefined) {
    const lang = (third as BeautifyMinifyLanguage) || "auto";
    return { tool, mode: first, indent: secondIndent, language: lang };
  }
  if (
    (tool === "yaml-to-json" || tool === "xml-formatter") &&
    firstIndent !== undefined &&
    second === undefined
  ) {
    return { tool, indent: firstIndent };
  }
  if (tool === "json-to-yaml" && firstSpaceIndent !== undefined && second === undefined) {
    return { tool, indent: firstSpaceIndent };
  }
  if (tool === "json-to-csv" && (first === "true" || first === "false") && second === undefined) {
    return { tool, escapeFormulae: first === "true" };
  }
  if (tool === "json-to-toml" && first === undefined) return { tool };
  if (
    tool === "sql-formatter" &&
    firstIndent !== undefined &&
    isKeywordCase(second) &&
    rest.length === 0
  ) {
    return { tool, indent: firstIndent, keywordCase: second };
  }
  return undefined;
}

export function structuredTextInputLimit(transform: StructuredTextTransform): number {
  switch (transform.tool) {
    case "beautify-minify":
      return BEAUTIFY_MINIFY_MAX_INPUT_CHARS;
    case "json-to-yaml":
      return JSON_TO_YAML_MAX_INPUT_CHARS;
    case "yaml-to-json":
      return YAML_CODEC_MAX_INPUT_CHARS;
    case "json-to-csv":
      return JSON_TO_CSV_MAX_INPUT_CHARS;
    case "json-to-toml":
      return JSON_TO_TOML_MAX_INPUT_CHARS;
    case "xml-formatter":
      return XML_FORMATTER_MAX_INPUT_CHARS;
    case "sql-formatter":
      return SQL_FORMATTER_MAX_INPUT_CHARS;
  }
}

export function structuredTextInputLabel(transform: StructuredTextTransform): string {
  switch (transform.tool) {
    case "yaml-to-json":
      return "YAML";
    case "xml-formatter":
      return "XML";
    case "sql-formatter":
      return "SQL";
    case "beautify-minify":
    case "json-to-yaml":
    case "json-to-csv":
    case "json-to-toml":
      return "JSON";
  }
}

/** Reject unexpected keys, input sizes, and option combinations at the boundary. */
export function isStructuredTextWorkerRequest(
  value: unknown,
): value is StructuredTextWorkerRequest {
  if (!isRecord(value) || value.type !== "transform" || !isRequestId(value.id)) return false;

  switch (value.tool) {
    case "beautify-minify":
      return (
        (isExactRecord(value, ["type", "id", "tool", "source", "mode", "indent"]) ||
          isExactRecord(value, ["type", "id", "tool", "source", "mode", "indent", "language"])) &&
        isBoundedString(value.source, BEAUTIFY_MINIFY_MAX_INPUT_CHARS) &&
        isJsonFormatMode(value.mode) &&
        isIndent(value.indent) &&
        (value.language === undefined || isBeautifyMinifyLanguage(value.language))
      );
    case "json-to-yaml":
      return (
        isExactRecord(value, ["type", "id", "tool", "source", "indent"]) &&
        isBoundedString(value.source, JSON_TO_YAML_MAX_INPUT_CHARS) &&
        isSpaceIndent(value.indent)
      );
    case "yaml-to-json":
      return (
        isExactRecord(value, ["type", "id", "tool", "source", "indent"]) &&
        isBoundedString(value.source, YAML_CODEC_MAX_INPUT_CHARS) &&
        isIndent(value.indent)
      );
    case "json-to-csv":
      return (
        isExactRecord(value, ["type", "id", "tool", "source", "escapeFormulae"]) &&
        isBoundedString(value.source, JSON_TO_CSV_MAX_INPUT_CHARS) &&
        typeof value.escapeFormulae === "boolean"
      );
    case "json-to-toml":
      return (
        isExactRecord(value, ["type", "id", "tool", "source"]) &&
        isBoundedString(value.source, JSON_TO_TOML_MAX_INPUT_CHARS)
      );
    case "xml-formatter":
      return (
        isExactRecord(value, ["type", "id", "tool", "source", "indent"]) &&
        isBoundedString(value.source, XML_FORMATTER_MAX_INPUT_CHARS) &&
        isIndent(value.indent)
      );
    case "sql-formatter":
      return (
        isExactRecord(value, ["type", "id", "tool", "source", "indent", "keywordCase"]) &&
        isBoundedString(value.source, SQL_FORMATTER_MAX_INPUT_CHARS) &&
        isIndent(value.indent) &&
        isKeywordCase(value.keywordCase)
      );
    default:
      return false;
  }
}

/** Only a bounded, exact ToolResult<string> may cross back into React. */
export function isStructuredTextWorkerResponse(
  value: unknown,
): value is StructuredTextWorkerResponse {
  return Boolean(
    isExactRecord(value, ["type", "id", "result"]) &&
    value.type === "result" &&
    isRequestId(value.id) &&
    isTextResult(value.result),
  );
}

function isTextResult(value: unknown): value is ToolResult<string> {
  if (!isRecord(value)) return false;
  if (value.ok === true) {
    return (
      isExactRecord(value, ["ok", "value"]) &&
      isBoundedString(value.value, STRUCTURED_TEXT_WORKER_MAX_OUTPUT_CHARS)
    );
  }
  if (value.ok === false) {
    return Boolean(
      isExactRecord(value, ["ok", "error"]) &&
      isExactRecord(value.error, ["code", "message"]) &&
      isBoundedString(value.error.code, MAX_ERROR_CODE_CHARS, false) &&
      isBoundedString(value.error.message, MAX_ERROR_MESSAGE_CHARS, false),
    );
  }
  return false;
}

function isExactRecord(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequestId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isBoundedString(value: unknown, maximum: number, allowEmpty = true): value is string {
  return typeof value === "string" && value.length <= maximum && (allowEmpty || value.length > 0);
}

function isIndent(value: unknown): value is 2 | 4 | "tab" {
  return value === 2 || value === 4 || value === "tab";
}

function isSpaceIndent(value: unknown): value is 2 | 4 {
  return value === 2 || value === 4;
}

function parseIndent(value: string | undefined): 2 | 4 | "tab" | undefined {
  if (value === "2") return 2;
  if (value === "4") return 4;
  if (value === "tab") return "tab";
  return undefined;
}

function parseSpaceIndent(value: string | undefined): 2 | 4 | undefined {
  const indent = parseIndent(value);
  return indent === 2 || indent === 4 ? indent : undefined;
}

function isJsonFormatMode(value: unknown): value is JsonFormatMode {
  return value === "beautify" || value === "minify";
}

function isKeywordCase(value: unknown): value is "upper" | "lower" {
  return value === "upper" || value === "lower";
}

function isBeautifyMinifyLanguage(value: unknown): value is BeautifyMinifyLanguage {
  return (
    value === "auto" ||
    value === "json" ||
    value === "javascript" ||
    value === "html" ||
    value === "css" ||
    value === "sql" ||
    value === "xml"
  );
}
