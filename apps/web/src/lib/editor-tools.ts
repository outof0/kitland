import { formatJson, formatSql, formatXml, repairJson } from "@kitland/core";

/**
 * In-place code beautifier/formatter supporting JSON, XML, SQL, and generic structured text.
 */
export function beautifyCode(
  code: string,
  language?: string,
  indent: 2 | 4 | "tab" = 2,
): string | null {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const lang = (language ?? "").toLowerCase();

  // JSON / JS
  if (
    lang === "json" ||
    lang === "javascript" ||
    lang === "typescript" ||
    (!lang && (trimmed.startsWith("{") || trimmed.startsWith("[")))
  ) {
    const jsonRes = formatJson(code, "beautify", { indent });
    if (jsonRes.ok) return jsonRes.value;
    const repaired = repairJson(code);
    if (repaired) {
      const repRes = formatJson(repaired, "beautify", { indent });
      if (repRes.ok) return repRes.value;
    }
  }

  // XML / SVG / HTML
  if (lang === "xml" || lang === "svg" || lang === "html" || (!lang && trimmed.startsWith("<"))) {
    const xmlRes = formatXml(code, indent);
    if (xmlRes.ok) return xmlRes.value.output;
  }

  // SQL
  if (lang === "sql") {
    const sqlRes = formatSql(code, { indent });
    if (sqlRes.ok) return sqlRes.value;
  }

  // Default fallback: attempt JSON formatting
  try {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, indent === "tab" ? "\t" : indent);
  } catch {
    return null;
  }
}

/**
 * In-place code minifier supporting JSON, XML, HTML, and generic structured text.
 */
export function minifyCode(code: string, language?: string): string | null {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const lang = (language ?? "").toLowerCase();

  // JSON / JS
  if (
    lang === "json" ||
    lang === "javascript" ||
    lang === "typescript" ||
    (!lang && (trimmed.startsWith("{") || trimmed.startsWith("[")))
  ) {
    const jsonRes = formatJson(code, "minify");
    if (jsonRes.ok) return jsonRes.value;
    const repaired = repairJson(code);
    if (repaired) {
      const repRes = formatJson(repaired, "minify");
      if (repRes.ok) return repRes.value;
    }
  }

  // XML / HTML / SVG
  if (lang === "xml" || lang === "svg" || lang === "html" || (!lang && trimmed.startsWith("<"))) {
    return code.replace(/>\s+</g, "><").trim();
  }

  // Default fallback: attempt JSON minification
  try {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}
