import { formatCode, type BeautifyMinifyLanguage } from "@kitland/core";

/**
 * In-place code beautifier/formatter supporting JSON, XML, HTML, CSS, JavaScript, SQL.
 */
export function beautifyCode(code: string, language?: string, indent: 2 | 4 = 2): string | null {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const res = formatCode(code, (language as BeautifyMinifyLanguage) || "auto", "beautify", {
    indent,
  });
  if (res.ok) return res.value.output;
  return null;
}

/**
 * In-place code minifier supporting JSON, XML, HTML, CSS, JavaScript, SQL.
 */
export function minifyCode(code: string, language?: string): string | null {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const res = formatCode(code, (language as BeautifyMinifyLanguage) || "auto", "minify");
  if (res.ok) return res.value.output;
  return null;
}
