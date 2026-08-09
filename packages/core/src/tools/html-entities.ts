import { err, ok, type ToolResult } from "../result";

export type HtmlEntityMode = "encode" | "decode";
export type HtmlEntityFormat = "named" | "decimal" | "hexadecimal";
export type HtmlEntityOptions = { format?: HtmlEntityFormat };

export const HTML_ENTITIES_MAX_INPUT_CHARS = 2_000_000;

const NAMED_ENCODINGS: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const NAMED_DECODINGS: Readonly<Record<string, string>> = {
  amp: "&",
  apos: "'",
  bull: "•",
  cent: "¢",
  copy: "©",
  euro: "€",
  gt: ">",
  hellip: "…",
  laquo: "«",
  lt: "<",
  mdash: "—",
  middot: "·",
  ndash: "–",
  nbsp: "\u00a0",
  para: "¶",
  pound: "£",
  quot: '"',
  raquo: "»",
  reg: "®",
  sect: "§",
  trade: "™",
  yen: "¥",
};

/** Encode HTML-significant characters or every scalar value as numeric entities. */
export function encodeHtmlEntities(
  input: string,
  options: HtmlEntityOptions = {},
): ToolResult<string> {
  const checked = validateUnicodeText(input);
  if (!checked.ok) return checked;

  const format = options.format ?? "named";
  let output = "";
  for (const character of input) {
    if (format === "named") {
      output += NAMED_ENCODINGS[character] ?? character;
      continue;
    }

    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) return err("ENCODE_FAILED", "Could not read a Unicode character.");
    output +=
      format === "decimal" ? `&#${codePoint};` : `&#x${codePoint.toString(16).toUpperCase()};`;
  }
  return ok(output);
}

/** Decode a strict, documented subset of common named and numeric HTML entities. */
export function decodeHtmlEntities(input: string): ToolResult<string> {
  const checked = validateUnicodeText(input);
  if (!checked.ok) return checked;

  let output = "";
  let cursor = 0;
  while (cursor < input.length) {
    const character = input[cursor] ?? "";
    if (character !== "&") {
      output += character;
      cursor += 1;
      continue;
    }

    const semicolon = input.indexOf(";", cursor + 1);
    if (semicolon === -1) {
      output += "&";
      cursor += 1;
      continue;
    }

    const entity = input.slice(cursor + 1, semicolon);
    const decoded = decodeEntity(entity);
    if (!decoded.ok) return decoded;
    output += decoded.value;
    cursor = semicolon + 1;
  }

  return ok(output);
}

export function runHtmlEntityTransform(
  mode: HtmlEntityMode,
  input: string,
  options: HtmlEntityOptions = {},
): ToolResult<string> {
  if (mode === "encode") return encodeHtmlEntities(input, options);
  if (mode === "decode") return decodeHtmlEntities(input);
  return err("INVALID_MODE", "HTML entity mode must be either encode or decode.");
}

function decodeEntity(entity: string): ToolResult<string> {
  if (entity.startsWith("#")) {
    const hexadecimal = entity[1]?.toLowerCase() === "x";
    const rawValue = entity.slice(hexadecimal ? 2 : 1);
    const pattern = hexadecimal ? /^[0-9a-fA-F]+$/ : /^\d+$/;
    if (!rawValue || !pattern.test(rawValue)) {
      return err("INVALID_HTML_ENTITY", `&${entity}; is not a valid numeric HTML entity.`);
    }

    const codePoint = Number.parseInt(rawValue, hexadecimal ? 16 : 10);
    if (!Number.isSafeInteger(codePoint) || !isUnicodeScalarValue(codePoint)) {
      return err("INVALID_HTML_ENTITY", `&${entity}; does not represent a Unicode scalar value.`);
    }
    return ok(String.fromCodePoint(codePoint));
  }

  const named = NAMED_DECODINGS[entity];
  if (named === undefined) {
    return err(
      "UNKNOWN_HTML_ENTITY",
      `&${entity}; is not in this tool's supported named-entity set. Use a numeric entity instead.`,
    );
  }
  return ok(named);
}

function validateUnicodeText(input: string): ToolResult<string> {
  const size = validateInputSize(input);
  if (!size.ok) return size;

  for (let index = 0; index < input.length; index += 1) {
    const unit = input.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = input.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        index += 1;
        continue;
      }
      return err("INVALID_UNICODE", "Text contains an unpaired Unicode surrogate.");
    }
    if (unit >= 0xdc00 && unit <= 0xdfff) {
      return err("INVALID_UNICODE", "Text contains an unpaired Unicode surrogate.");
    }
  }
  return ok(input);
}

function validateInputSize(input: string): ToolResult<string> {
  if (input.length > HTML_ENTITIES_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `HTML entity input exceeds ${HTML_ENTITIES_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }
  return ok(input);
}

function isUnicodeScalarValue(codePoint: number): boolean {
  return codePoint >= 0 && codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff);
}
