import { err, ok, type ToolResult } from "../result";
import { formatSql } from "./sql-formatter";
import { formatXml } from "./xml-formatter";

export type BeautifyMinifyMode = "beautify" | "minify";
export type JsonFormatMode = BeautifyMinifyMode;

export type BeautifyMinifyLanguage =
  | "auto"
  | "json"
  | "javascript"
  | "html"
  | "css"
  | "sql"
  | "xml";

export type BeautifyMinifyOptions = {
  /** Spaces or tab used by Beautify mode. Defaults to 2; 4 and "tab" are also supported. */
  readonly indent?: 2 | 4 | "tab";
  readonly language?: BeautifyMinifyLanguage;
  readonly keywordCase?: "upper" | "lower";
};

export type JsonFormatOptions = {
  readonly indent?: 2 | 4 | "tab";
};

export const BEAUTIFY_MINIFY_MAX_INPUT_CHARS = 1_000_000;
export const BEAUTIFY_MINIFY_MAX_OUTPUT_CHARS = 2_000_000;

/** Detect code language from text structure and syntax hints. */
export function detectCodeLanguage(
  source: string,
): "json" | "html" | "css" | "javascript" | "sql" | "xml" {
  const trimmed = source.trim();
  if (!trimmed) return "json";

  // XML / HTML / SVG
  if (trimmed.startsWith("<")) {
    if (trimmed.startsWith("<?xml") || /<[a-zA-Z0-9_\-:]+ xmlns/i.test(trimmed)) {
      return "xml";
    }
    return "html";
  }

  // JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      // Could be JS object/array or CSS/JS block
    }
  }

  // SQL
  if (
    /^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|WITH|BEGIN|DECLARE)\b/i.test(
      trimmed,
    )
  ) {
    return "sql";
  }

  // CSS
  if (
    looksLikeCss(trimmed) &&
    !/\b(function|class|interface|var|let|const|if|for|while)\b/.test(trimmed)
  ) {
    return "css";
  }

  // JavaScript / TypeScript hints
  if (
    /\b(const|let|var|function|return|import|export|class|interface|async|await|console\.log|=>)\b/.test(
      trimmed,
    )
  ) {
    return "javascript";
  }

  // Default to JSON if it looks like brackets/quotes, else JS
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  return "javascript";
}

/** Validate and render a JSON document in readable or compact form (Backwards compatible). */
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
    mode === "beautify" ? (options.indent === "tab" ? "\t" : (options.indent ?? 2)) : undefined,
  );
  if (output.length > BEAUTIFY_MINIFY_MAX_OUTPUT_CHARS) {
    return err(
      "OUTPUT_TOO_LARGE",
      `Formatted JSON exceeds the ${BEAUTIFY_MINIFY_MAX_OUTPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  return ok(output);
}

/** Format or minify CSS styles */
export function formatCss(
  source: string,
  mode: BeautifyMinifyMode,
  options: BeautifyMinifyOptions = {},
): ToolResult<string> {
  if (source.length > BEAUTIFY_MINIFY_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `CSS input exceeds the ${BEAUTIFY_MINIFY_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (source.trim().length === 0) return err("EMPTY_INPUT", "Enter CSS to format.");

  if (mode === "minify") {
    const minified = source
      .replace(/\/\*[\s\S]*?\*\//g, "") // remove comments
      .replace(/\s+/g, " ") // collapse whitespace
      .replace(/\s*([{};:,>~+])\s*/g, "$1") // strip spaces around punctuation
      .replace(/;}/g, "}") // remove trailing semicolons before close brace
      .trim();
    return ok(minified);
  }

  const indentStr = options.indent === "tab" ? "\t" : " ".repeat(options.indent ?? 2);
  let result = "";
  let indentLevel = 0;
  const clean = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim();

  let i = 0;
  while (i < clean.length) {
    const char = clean[i];
    if (char === "{") {
      result = result.trimEnd() + " {\n";
      indentLevel++;
      result += indentStr.repeat(indentLevel);
      i++;
    } else if (char === "}") {
      indentLevel = Math.max(0, indentLevel - 1);
      result =
        result.trimEnd() +
        "\n" +
        indentStr.repeat(indentLevel) +
        "}\n\n" +
        indentStr.repeat(indentLevel);
      i++;
    } else if (char === ";") {
      result += ";\n" + indentStr.repeat(indentLevel);
      i++;
    } else if (char === ":" && indentLevel > 0) {
      result += ": ";
      i++;
      while (i < clean.length && clean[i] === " ") i++;
    } else {
      result += char;
      i++;
    }
  }

  const formatted = result
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""))
    .join("\n")
    .trim();

  return ok(formatted);
}

/** Format or minify HTML / XML markup */
export function formatHtml(
  source: string,
  mode: BeautifyMinifyMode,
  options: BeautifyMinifyOptions = {},
): ToolResult<string> {
  if (source.length > BEAUTIFY_MINIFY_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `HTML input exceeds the ${BEAUTIFY_MINIFY_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (source.trim().length === 0) return err("EMPTY_INPUT", "Enter HTML markup to format.");

  if (mode === "minify") {
    const minified = stripHtmlComments(source)
      .replace(/>\s+</g, "><") // remove space between tags
      .replace(/\s+/g, " ") // collapse internal whitespace
      .trim();
    return ok(minified);
  }

  // Try pure XML formatter if compliant
  const xmlRes = formatXml(source, options.indent ?? 2);
  if (xmlRes.ok) return ok(xmlRes.value.output);

  // Fallback resilient HTML tag hierarchy indenter
  const indentStr = options.indent === "tab" ? "\t" : " ".repeat(options.indent ?? 2);
  const selfClosing = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
    "!doctype",
  ]);

  const tokens = stripHtmlComments(source)
    .replace(/>\s+</g, "><")
    .split(/(<[^>]+>)/g)
    .filter((t) => t.trim().length > 0);

  let indentLevel = 0;
  const lines: string[] = [];

  for (const token of tokens) {
    if (token.startsWith("</")) {
      indentLevel = Math.max(0, indentLevel - 1);
      lines.push(indentStr.repeat(indentLevel) + token);
    } else if (token.startsWith("<") && !token.startsWith("<!")) {
      const match = token.match(/^<([a-zA-Z0-9_-]+)/);
      const tagName = match?.[1] ? match[1].toLowerCase() : "";
      const isSelf = selfClosing.has(tagName) || token.endsWith("/>");

      lines.push(indentStr.repeat(indentLevel) + token);
      if (!isSelf) {
        indentLevel++;
      }
    } else {
      lines.push(indentStr.repeat(indentLevel) + token.trim());
    }
  }

  return ok(lines.join("\n").trim());
}

function looksLikeCss(source: string): boolean {
  const openingBrace = source.indexOf("{");
  const closingBrace = source.indexOf("}", openingBrace + 1);
  if (openingBrace <= 0 || closingBrace === -1) {
    return false;
  }

  for (let index = 0; index < openingBrace; index += 1) {
    const code = source.charCodeAt(index);
    const isLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    const isDigit = code >= 48 && code <= 57;
    const isWhitespace = code === 9 || code === 10 || code === 13 || code === 32;
    const isSelectorPunctuation = "_-#.:>".includes(source[index] ?? "");
    if (!isLetter && !isDigit && !isWhitespace && !isSelectorPunctuation) return false;
  }
  return true;
}

/** Remove complete comments and discard an unterminated comment through end-of-input. */
function stripHtmlComments(source: string): string {
  let output = "";
  let cursor = 0;

  while (cursor < source.length) {
    const start = source.indexOf("<!--", cursor);
    if (start === -1) return output + source.slice(cursor);
    output += source.slice(cursor, start);
    const end = source.indexOf("-->", start + "<!--".length);
    if (end === -1) return output;
    cursor = end + "-->".length;
  }

  return output;
}

/** Format or minify JavaScript / TypeScript code */
export function formatJs(
  source: string,
  mode: BeautifyMinifyMode,
  options: BeautifyMinifyOptions = {},
): ToolResult<string> {
  if (source.length > BEAUTIFY_MINIFY_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `JavaScript input exceeds the ${BEAUTIFY_MINIFY_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (source.trim().length === 0) return err("EMPTY_INPUT", "Enter JavaScript code to format.");

  if (mode === "minify") {
    const minified = source
      .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1") // line comments
      .replace(/\s+/g, " ") // collapse whitespace
      .replace(/\s*([{};:=+*/%<>&|,!])\s*/g, "$1")
      .trim();
    return ok(minified);
  }

  const indentStr = options.indent === "tab" ? "\t" : " ".repeat(options.indent ?? 2);
  let indentLevel = 0;
  const rawLines = source.split("\n");
  const formattedLines: string[] = [];

  for (let line of rawLines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith("}") || line.startsWith("]") || line.startsWith(")")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formattedLines.push(indentStr.repeat(indentLevel) + line);

    if (line.endsWith("{") || line.endsWith("[") || line.endsWith("(")) {
      indentLevel++;
    }
  }

  return ok(formattedLines.join("\n").trim());
}

/** Universal Multi-Language Code Formatter and Minifier */
export function formatCode(
  source: string,
  language: BeautifyMinifyLanguage = "auto",
  mode: BeautifyMinifyMode = "beautify",
  options: BeautifyMinifyOptions = {},
): ToolResult<{ output: string; detectedLanguage: BeautifyMinifyLanguage }> {
  const targetLang = language === "auto" ? detectCodeLanguage(source) : language;

  let result: ToolResult<string>;
  switch (targetLang) {
    case "json":
      result = formatJson(
        source,
        mode,
        options.indent !== undefined ? { indent: options.indent } : {},
      );
      break;
    case "html":
    case "xml":
      result = formatHtml(source, mode, options);
      break;
    case "css":
      result = formatCss(source, mode, options);
      break;
    case "sql": {
      if (mode === "minify") {
        const minified = source.replace(/\s+/g, " ").trim();
        result = ok(minified);
      } else {
        result = formatSql(source, {
          indent: options.indent ?? 2,
          keywordCase: options.keywordCase ?? "upper",
        });
      }
      break;
    }
    case "javascript":
    default:
      result = formatJs(source, mode, options);
      break;
  }

  if (!result.ok) return result;
  return ok({ output: result.value, detectedLanguage: targetLang });
}
