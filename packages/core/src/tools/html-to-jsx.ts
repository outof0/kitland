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
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "{/* script removed */}");
  out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "{/* style removed */}");
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
