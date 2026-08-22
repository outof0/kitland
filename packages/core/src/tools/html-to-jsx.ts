import { err, ok, type ToolResult } from "../result";

export const HTML_TO_JSX_MAX_INPUT_CHARS = 500_000;

/**
 * Convert a constrained HTML fragment into JSX-ish markup.
 * Does not execute HTML. Script/style bodies are removed (tags kept as comments).
 */
export function htmlToJsx(source: string): ToolResult<string> {
  if (source.length > HTML_TO_JSX_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "HTML input exceeds the size limit.");
  if (!source.trim()) return err("EMPTY_INPUT", "Enter HTML markup.");
  let out = source;
  // Strip script/style content without evaluating it.
  out = replaceElementContent(out, "script", "{/* script removed */}");
  out = replaceElementContent(out, "style", "{/* style removed */}");
  out = out.replace(/\bclass=/gi, "className=");
  out = out.replace(/\bfor=/gi, "htmlFor=");
  out = out.replace(/\btabindex=/gi, "tabIndex=");
  out = out.replace(/\breadonly\b/gi, "readOnly");
  out = out.replace(/\bmaxlength=/gi, "maxLength=");
  // Self-close common void elements if written as HTML void.
  out = out.replace(
    /<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^>]*)?>/gi,
    (full, tag, attrs = "") => {
      if (/\/>\s*$/.test(full)) return full;
      return `<${tag}${attrs} />`;
    },
  );
  // style="a:b" -> style={{ a: "b" }} simplistic
  out = out.replace(/style="([^"]*)"/gi, (_m, css: string) => {
    const entries = css
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((pair) => {
        const [k, ...rest] = pair.split(":");
        const key = (k ?? "").trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        const val = rest.join(":").trim();
        return `${key}: ${JSON.stringify(val)}`;
      });
    return `style={{ ${entries.join(", ")} }}`;
  });
  return ok(out);
}

/** Strip complete and malformed raw-text elements without relying on HTML regexes. */
function replaceElementContent(source: string, name: string, replacement: string): string {
  const lower = source.toLowerCase();
  let output = "";
  let cursor = 0;

  while (cursor < source.length) {
    const start = findElementStart(lower, name, cursor);
    if (start === -1) return output + source.slice(cursor);
    output += source.slice(cursor, start);

    const openingEnd = findHtmlTagEnd(source, start);
    if (openingEnd === -1) return output + replacement;
    const closingStart = findEndTagStart(lower, name, openingEnd + 1);
    if (closingStart === -1) return output + replacement;
    const closingEnd = findHtmlTagEnd(source, closingStart);
    if (closingEnd === -1) return output + replacement;

    output += replacement;
    cursor = closingEnd + 1;
  }

  return output;
}

function findElementStart(lowerSource: string, name: string, cursor: number): number {
  return findTagStart(lowerSource, `<${name}`, cursor);
}

function findEndTagStart(lowerSource: string, name: string, cursor: number): number {
  return findTagStart(lowerSource, `</${name}`, cursor);
}

function findTagStart(lowerSource: string, prefix: string, cursor: number): number {
  let start = lowerSource.indexOf(prefix, cursor);
  while (start !== -1) {
    const next = lowerSource[start + prefix.length] ?? "";
    if (next === ">" || next === "/" || /\s/u.test(next)) return start;
    start = lowerSource.indexOf(prefix, start + prefix.length);
  }
  return -1;
}

function findHtmlTagEnd(source: string, start: number): number {
  let quote: '"' | "'" | null = null;
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index;
    }
  }
  return -1;
}
