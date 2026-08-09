import { err, ok, type ToolResult } from "../result";

export type XmlFormatResult = {
  readonly output: string;
  readonly elementCount: number;
  readonly maxDepth: number;
};

export const XML_FORMATTER_MAX_INPUT_CHARS = 1_000_000;
export const XML_FORMATTER_MAX_TOKENS = 100_000;
export const XML_FORMATTER_MAX_DEPTH = 128;
export const XML_FORMATTER_MAX_OUTPUT_CHARS = 2_000_000;

type XmlToken =
  | {
      readonly type: "start";
      readonly raw: string;
      readonly name: string;
      readonly selfClosing: boolean;
      directText: boolean;
    }
  | {
      readonly type: "end";
      readonly raw: string;
      readonly name: string;
      readonly openIndex: number;
    }
  | { readonly type: "text"; readonly raw: string; readonly openIndex: number | null }
  | { readonly type: "misc"; readonly raw: string };

/** Validate and pretty-print XML without resolving external entities or DTDs. */
export function formatXml(source: string, indent: 2 | 4 = 2): ToolResult<XmlFormatResult> {
  if (source.length > XML_FORMATTER_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `XML input exceeds the ${XML_FORMATTER_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (source.trim().length === 0) return err("EMPTY_INPUT", "Enter XML to format.");
  if (/<!DOCTYPE/i.test(source)) {
    return err(
      "UNSUPPORTED_XML",
      "DOCTYPE is not supported because external entities are disabled.",
    );
  }

  const tokenized = tokenizeXml(source);
  if (!tokenized.ok) return tokenized;
  const rendered = renderXml(tokenized.value.tokens, indent);
  if (!rendered.ok) return rendered;
  return ok({
    output: rendered.value,
    elementCount: tokenized.value.elementCount,
    maxDepth: tokenized.value.maxDepth,
  });
}

function tokenizeXml(
  source: string,
): ToolResult<{ tokens: XmlToken[]; elementCount: number; maxDepth: number }> {
  const tokens: XmlToken[] = [];
  const open: Array<{ readonly name: string; readonly index: number }> = [];
  const pattern = /<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<\/[^>]*>|<[^>]*>/g;
  let cursor = 0;
  let elementCount = 0;
  let maxDepth = 0;

  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    const before = source.slice(cursor, index);
    if (before) {
      const text = validateText(before, lineAt(source, cursor));
      if (!text.ok) return text;
      const openIndex = open.at(-1)?.index ?? null;
      tokens.push({ type: "text", raw: before, openIndex });
      if (before.trim() && openIndex !== null) {
        const start = tokens[openIndex];
        if (start?.type === "start") start.directText = true;
      }
    }
    const raw = match[0];
    const line = lineAt(source, index);
    const parsed = parseMarkup(raw, line, open);
    if (!parsed.ok) return parsed;
    if (parsed.value) {
      tokens.push(parsed.value);
      if (parsed.value.type === "start" && !parsed.value.selfClosing) {
        open.push({ name: parsed.value.name, index: tokens.length - 1 });
        elementCount += 1;
        maxDepth = Math.max(maxDepth, open.length);
        if (open.length > XML_FORMATTER_MAX_DEPTH) {
          return err(
            "INPUT_TOO_DEEP",
            `XML exceeds the ${XML_FORMATTER_MAX_DEPTH}-level nesting limit.`,
          );
        }
      } else if (parsed.value.type === "start") {
        elementCount += 1;
      } else if (parsed.value.type === "end") {
        open.pop();
      }
    }
    if (tokens.length > XML_FORMATTER_MAX_TOKENS) {
      return err(
        "INPUT_TOO_COMPLEX",
        `XML exceeds the ${XML_FORMATTER_MAX_TOKENS.toLocaleString()} token limit.`,
      );
    }
    cursor = index + raw.length;
  }
  const trailing = source.slice(cursor);
  if (trailing) {
    const text = validateText(trailing, lineAt(source, cursor));
    if (!text.ok) return text;
    const openIndex = open.at(-1)?.index ?? null;
    tokens.push({ type: "text", raw: trailing, openIndex });
    if (trailing.trim() && openIndex !== null) {
      const start = tokens[openIndex];
      if (start?.type === "start") start.directText = true;
    }
  }
  if (open.length > 0) return xmlError(1, `unclosed element <${open.at(-1)?.name ?? "?"}>`);
  if (tokens.length === 0 || elementCount === 0) return xmlError(1, "expected an XML element");
  return ok({ tokens, elementCount, maxDepth });
}

function parseMarkup(
  raw: string,
  line: number,
  open: Array<{ readonly name: string; readonly index: number }>,
): ToolResult<XmlToken | null> {
  if (raw.startsWith("<!--")) {
    return raw.includes("--", 4) && !raw.endsWith("-->")
      ? xmlError(line, "invalid comment")
      : ok({ type: "misc", raw });
  }
  if (raw.startsWith("<![CDATA["))
    return ok({ type: "text", raw, openIndex: open.at(-1)?.index ?? null });
  if (raw.startsWith("<?"))
    return raw.endsWith("?>")
      ? ok({ type: "misc", raw })
      : xmlError(line, "invalid processing instruction");
  if (raw.startsWith("</")) {
    const name = raw.slice(2, -1).trim();
    if (!isName(name)) return xmlError(line, "invalid closing element name");
    const current = open.at(-1);
    if (!current || current.name !== name)
      return xmlError(line, `closing element </${name}> does not match open element`);
    return ok({ type: "end", raw: `</${name}>`, name, openIndex: current.index });
  }
  if (!raw.startsWith("<")) return xmlError(line, "invalid markup");
  const parsed = parseStartTag(raw, line);
  if (!parsed.ok) return parsed;
  return ok({
    type: "start",
    raw,
    name: parsed.value.name,
    selfClosing: parsed.value.selfClosing,
    directText: false,
  });
}

function parseStartTag(
  raw: string,
  line: number,
): ToolResult<{ name: string; selfClosing: boolean }> {
  const body = raw.slice(1, -1);
  const trimmedBody = body.trim();
  const selfClosing = trimmedBody.endsWith("/");
  const content = (selfClosing ? trimmedBody.slice(0, -1) : body).trim();
  const nameMatch = /^([A-Za-z_][A-Za-z0-9_.:-]*)/.exec(content);
  if (!nameMatch?.[1]) return xmlError(line, "invalid opening element name");
  const name = nameMatch[1];
  const attrs = content.slice(name.length);
  const attributePattern = /\s+([A-Za-z_][A-Za-z0-9_.:-]*)\s*=\s*("[^"]*"|'[^']*')/g;
  const seen = new Set<string>();
  let consumed = 0;
  for (const match of attrs.matchAll(attributePattern)) {
    const attribute = match[1];
    const rawValue = match[2];
    if (!attribute || !rawValue) return xmlError(line, "invalid attribute");
    if (seen.has(attribute)) return xmlError(line, `duplicate attribute ${attribute}`);
    seen.add(attribute);
    const validText = validateText(rawValue.slice(1, -1), line);
    if (!validText.ok) return validText;
    consumed += match[0].length;
  }
  if (attrs.slice(consumed).trim())
    return xmlError(line, "attributes must be quoted name-value pairs");
  return ok({ name, selfClosing });
}

function renderXml(tokens: readonly XmlToken[], indentSize: 2 | 4): ToolResult<string> {
  let output = "";
  const open: number[] = [];
  const writeLine = (depth: number, value: string) => {
    if (output && !output.endsWith("\n")) output += "\n";
    output += `${" ".repeat(depth * indentSize)}${value}\n`;
  };
  const writeInline = (value: string) => {
    output += value;
  };

  for (const [index, token] of tokens.entries()) {
    if (token.type === "start") {
      const parent = open.at(-1);
      const parentHasText =
        parent !== undefined && tokens[parent]?.type === "start" && tokens[parent].directText;
      if (parentHasText) {
        writeInline(token.raw);
      } else if (token.directText) {
        if (output && !output.endsWith("\n")) output += "\n";
        output += `${" ".repeat(open.length * indentSize)}${token.raw}`;
      } else writeLine(open.length, token.raw);
      if (!token.selfClosing) open.push(index);
    } else if (token.type === "end") {
      const start = tokens[token.openIndex];
      const hasText = start?.type === "start" && start.directText;
      open.pop();
      const parent = open.at(-1);
      const parentHasText =
        parent !== undefined && tokens[parent]?.type === "start" && tokens[parent].directText;
      if (hasText) {
        writeInline(token.raw);
        if (!parentHasText) output += "\n";
      } else if (parentHasText) {
        writeInline(token.raw);
      } else {
        writeLine(open.length, token.raw);
      }
    } else if (token.type === "text") {
      if (token.raw.trim()) writeInline(token.raw);
    } else {
      writeLine(open.length, token.raw);
    }
    if (output.length > XML_FORMATTER_MAX_OUTPUT_CHARS) {
      return err(
        "OUTPUT_TOO_LARGE",
        `Formatted XML exceeds the ${XML_FORMATTER_MAX_OUTPUT_CHARS.toLocaleString()} character limit.`,
      );
    }
  }
  return ok(output.trimEnd() + "\n");
}

function validateText(value: string, line: number): ToolResult<void> {
  const entities = /&(?:(?:amp|lt|gt|quot|apos)|#\d+|#x[\da-fA-F]+);/g;
  const removed = value.replace(entities, "");
  if (removed.includes("&")) return xmlError(line, "invalid entity reference");
  if (removed.includes("<")) return xmlError(line, "unescaped < in text");
  return ok(undefined);
}

function isName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(value);
}

function lineAt(source: string, index: number): number {
  let lines = 1;
  for (let offset = 0; offset < index; offset += 1)
    if (source.charCodeAt(offset) === 10) lines += 1;
  return lines;
}

function xmlError(line: number, message: string): ToolResult<never> {
  return err("INVALID_XML", `XML is invalid on line ${line}: ${message}.`);
}
