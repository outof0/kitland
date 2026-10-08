import { err, ok, type ToolResult } from "../result";
import type { HostTransformSpec } from "../host-types";
import { decodeBase64, encodeBase64 } from "./base64";
import { decodeUrl, encodeUrl } from "./url-encode";
import { formatXml } from "./xml-formatter";
import { formatJson } from "./beautify-minify";

/**
 * Text encoding workbench mirroring the draw.io Text Tools pipeline.
 *
 * The headline operations run the draw.io diagram encoding pipeline:
 * URL-encode → raw DEFLATE → Base64 (and the reverse for decoding). The same
 * byte layout is what draw.io embeds in share URLs and `<diagram>` payloads,
 * so output here round-trips with draw.io itself.
 *
 * Compression uses the platform `CompressionStream`/`DecompressionStream`
 * (`deflate-raw`) — the same raw DEFLATE stream pako produces — so no extra
 * dependency is needed. Individual pipeline stages and the remaining text
 * utilities are exposed as separate operations.
 */

/** Maximum input length in UTF-16 code units, matching sibling text tools. */
export const DRAWIO_TEXT_MAX_INPUT_CHARS = 2_000_000;

export type DrawioEncodeStages = {
  readonly urlEncode?: boolean;
  readonly deflate?: boolean;
  readonly base64?: boolean;
};

export type DrawioDecodeStages = {
  readonly urlDecode?: boolean;
  readonly inflate?: boolean;
  readonly base64?: boolean;
};

export type DrawioTextOperationId =
  | "encode"
  | "decode"
  | "url-encode"
  | "url-decode"
  | "base64-encode"
  | "base64-decode"
  | "deflate"
  | "inflate"
  | "escape"
  | "unescape"
  | "remove-linebreaks"
  | "js-variable"
  | "format-xml"
  | "normalize-xml"
  | "format-json"
  | "normalize-json";

const UTF8_ENCODER = new TextEncoder();
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
// oxlint-disable-next-line eslint/no-control-regex -- Only ASCII transport whitespace is valid.
const BASE64_WHITESPACE_PATTERN = /[\x09-\x0D\x20]+/g;

function assertInputSize(input: string): ToolResult<string> | null {
  if (input.length > DRAWIO_TEXT_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Text input exceeds ${DRAWIO_TEXT_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }
  return null;
}

type CompressionStreamConstructor = new (format: string) => {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<Uint8Array>;
};

function compressionCtor(kind: "compress" | "decompress"): CompressionStreamConstructor | null {
  const scope = globalThis as unknown as Record<string, unknown>;
  const ctor = kind === "compress" ? scope["CompressionStream"] : scope["DecompressionStream"];
  return typeof ctor === "function" ? (ctor as CompressionStreamConstructor) : null;
}

async function pump(kind: "compress" | "decompress", input: Uint8Array): Promise<Uint8Array> {
  const Ctor = compressionCtor(kind);
  if (!Ctor) {
    throw new Error(
      kind === "compress"
        ? "CompressionStream is unavailable in this environment."
        : "DecompressionStream is unavailable in this environment.",
    );
  }
  // Feed through a Response: the manual writer/reader dance can stall on some
  // Chromium builds, while pipeThrough + arrayBuffer() always drains.
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(input);
      controller.close();
    },
  });
  const buffer = await new Response(source.pipeThrough(new Ctor("deflate-raw"))).arrayBuffer();
  return new Uint8Array(buffer);
}

/** Raw DEFLATE compress (no zlib/gzip wrapper), matching pako's `deflateRaw`. */
export async function deflateRawBytes(input: Uint8Array): Promise<Uint8Array> {
  return pump("compress", input);
}

/** Raw DEFLATE decompress (no zlib/gzip wrapper), matching pako's `inflateRaw`. */
export async function inflateRawBytes(input: Uint8Array): Promise<Uint8Array> {
  return pump("decompress", input);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  let out = "";
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i);
    const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
    const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += BASE64_ALPHABET[(triple >> 18) & 63]!;
    out += BASE64_ALPHABET[(triple >> 12) & 63]!;
    out += i + 1 < binary.length ? BASE64_ALPHABET[(triple >> 6) & 63]! : "=";
    out += i + 2 < binary.length ? BASE64_ALPHABET[triple & 63]! : "=";
  }
  return out;
}

function base64ToBytes(input: string): Uint8Array | null {
  const clean = input.replace(BASE64_WHITESPACE_PATTERN, "");
  if (clean.length === 0 || clean.length % 4 !== 0) return null;
  const values = new Uint8Array(128).fill(255);
  for (let i = 0; i < BASE64_ALPHABET.length; i++) values[BASE64_ALPHABET.charCodeAt(i)] = i;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const sextets: number[] = [];
    let padding = 0;
    for (let j = 0; j < 4; j++) {
      const ch = clean[i + j]!;
      if (ch === "=") {
        padding++;
        sextets.push(0);
        continue;
      }
      if (padding > 0) return null;
      const code = ch.charCodeAt(0);
      if (code >= 128 || values[code] === 255) return null;
      sextets.push(values[code]!);
    }
    if (padding > 2) return null;
    const triple = (sextets[0]! << 18) | (sextets[1]! << 12) | (sextets[2]! << 6) | sextets[3]!;
    out.push((triple >> 16) & 255, (triple >> 8) & 255, triple & 255);
    if (padding > 0) out.splice(out.length - padding, padding);
  }
  return Uint8Array.from(out);
}

function latin1ToBytes(text: string): Uint8Array | null {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 255) return null;
    out[i] = code;
  }
  return out;
}

function latin1FromBytes(bytes: Uint8Array): string {
  let out = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return out;
}

/**
 * Pull the encoded payload out of a draw.io `<mxfile>` document so pasting a
 * whole `.drawio` file (or its XML) decodes directly. Returns null when the
 * input is not an mxfile wrapper.
 */
export function extractDiagramContent(input: string): string | null {
  const match = /<mxfile[\s>][\s\S]*?<diagram\b[^>]*>([^<]*)<\/diagram\s*>/i.exec(input);
  const payload = match?.[1];
  return payload ? payload : null;
}

/**
 * Run the full draw.io encode pipeline: URL-encode → raw DEFLATE → Base64.
 * Stages can be toggled individually; all default to on.
 */
export async function drawioEncode(
  input: string,
  stages: DrawioEncodeStages = {},
): Promise<ToolResult<string>> {
  const tooLarge = assertInputSize(input);
  if (tooLarge) return tooLarge;
  const { urlEncode = true, deflate = true, base64 = true } = stages;
  try {
    const text = urlEncode ? encodeURIComponent(input) : input;
    let bytes: Uint8Array = UTF8_ENCODER.encode(text);
    if (deflate) bytes = await deflateRawBytes(bytes);
    return ok(base64 ? bytesToBase64(bytes) : latin1FromBytes(bytes));
  } catch (cause) {
    if (cause instanceof URIError) {
      return err(
        "INVALID_UNICODE",
        "Text contains an unpaired Unicode surrogate and cannot be percent-encoded.",
      );
    }
    return err(
      "ENCODE_FAILED",
      cause instanceof Error ? cause.message : "Could not encode the supplied text.",
    );
  }
}

/**
 * Run the full draw.io decode pipeline: Base64 → raw INFLATE → URL-decode.
 * Accepts either a bare payload or a whole `<mxfile>` document.
 */
export async function drawioDecode(
  input: string,
  stages: DrawioDecodeStages = {},
): Promise<ToolResult<string>> {
  const tooLarge = assertInputSize(input);
  if (tooLarge) return tooLarge;
  const { urlDecode = true, inflate = true, base64 = true } = stages;
  try {
    const payload = extractDiagramContent(input) ?? input;
    let bytes: Uint8Array | null;
    if (base64) {
      bytes = base64ToBytes(payload);
      if (!bytes) return err("INVALID_BASE64", "Input is not valid Base64.");
    } else {
      bytes = latin1ToBytes(payload);
      if (!bytes) {
        return err(
          "INVALID_BINARY_TEXT",
          "Input contains characters outside the Latin-1 range and cannot be treated as raw bytes.",
        );
      }
    }
    if (inflate) {
      try {
        bytes = await inflateRawBytes(bytes);
      } catch {
        return err(
          "DECOMPRESS_FAILED",
          "Input is not a valid raw DEFLATE stream. It may be corrupt or not draw.io-encoded.",
        );
      }
    }
    let text: string;
    try {
      text = UTF8_DECODER.decode(bytes);
    } catch {
      return err("INVALID_UTF8", "Decompressed bytes are not valid UTF-8 text.");
    }
    if (urlDecode) {
      try {
        text = decodeURIComponent(text);
      } catch {
        return err(
          "INVALID_PERCENT_ENCODING",
          "Input contains malformed percent escapes or invalid UTF-8 byte sequences.",
        );
      }
    }
    return ok(text);
  } catch (cause) {
    return err(
      "DECODE_FAILED",
      cause instanceof Error ? cause.message : "Could not decode the supplied text.",
    );
  }
}

const ESCAPE_SAFE = /^[A-Za-z0-9@*_+\-./]$/;

function toHex(value: number, width: 2 | 4): string {
  return value.toString(16).toUpperCase().padStart(width, "0");
}

/**
 * JavaScript `escape()` semantics: alphanumerics plus `@*_+-./` pass through,
 * other code units become `%XX` (or `%uXXXX` outside Latin-1).
 */
export function escapeText(input: string): ToolResult<string> {
  const tooLarge = assertInputSize(input);
  if (tooLarge) return tooLarge;
  let out = "";
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (ESCAPE_SAFE.test(ch)) {
      out += ch;
      continue;
    }
    const code = input.charCodeAt(i);
    out += code < 256 ? `%${toHex(code, 2)}` : `%u${toHex(code, 4)}`;
  }
  return ok(out);
}

/** Reverse of {@link escapeText}: decodes `%XX` and `%uXXXX` escapes. */
export function unescapeText(input: string): ToolResult<string> {
  const tooLarge = assertInputSize(input);
  if (tooLarge) return tooLarge;
  try {
    const out = input.replace(
      /%u([0-9A-Fa-f]{4})|%([0-9A-Fa-f]{2})/g,
      (_m: string, u: string | undefined, h: string | undefined) =>
        String.fromCharCode(parseInt((u ?? h) as string, 16)),
    );
    return ok(out);
  } catch (cause) {
    return err(
      "UNESCAPE_FAILED",
      cause instanceof Error ? cause.message : "Could not unescape the supplied text.",
    );
  }
}

/** Strip every line break (`\r\n`, `\n`, `\r`) from the text. */
export function removeLinebreaks(input: string): ToolResult<string> {
  const tooLarge = assertInputSize(input);
  if (tooLarge) return tooLarge;
  return ok(input.replace(/\r\n|\n|\r/g, ""));
}

/**
 * Wrap text as concatenated single-quoted JS string literals, one per line,
 * escaping backslashes and quotes: `'line\n' +`.
 */
export function toJsVariable(input: string): ToolResult<string> {
  const tooLarge = assertInputSize(input);
  if (tooLarge) return tooLarge;
  const lines = input.split("\n");
  const parts: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (i < lines.length - 1 || line.length > 0) {
      parts.push(`'${line.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}\\n'`);
    }
  }
  return ok(parts.join(" +\n"));
}

/** Collapse insignificant whitespace between XML tags onto one line. */
export function normalizeXmlText(input: string): ToolResult<string> {
  const tooLarge = assertInputSize(input);
  if (tooLarge) return tooLarge;
  return ok(input.replace(/>\s*/g, ">").replace(/\s*</g, "<"));
}

/** Dispatch a single draw.io text operation; the spec entry point. */
export async function runDrawioText(
  operationId: string,
  input: string,
): Promise<ToolResult<string>> {
  switch (operationId as DrawioTextOperationId) {
    case "encode":
      return drawioEncode(input);
    case "decode":
      return drawioDecode(input);
    case "url-encode":
      return encodeUrl(input, { scope: "component" });
    case "url-decode":
      return decodeUrl(input, { scope: "component" });
    case "base64-encode":
      return encodeBase64(input);
    case "base64-decode":
      return decodeBase64(input);
    case "deflate": {
      const tooLarge = assertInputSize(input);
      if (tooLarge) return tooLarge;
      try {
        return ok(latin1FromBytes(await deflateRawBytes(UTF8_ENCODER.encode(input))));
      } catch (cause) {
        return err(
          "COMPRESS_FAILED",
          cause instanceof Error ? cause.message : "Could not compress the supplied text.",
        );
      }
    }
    case "inflate": {
      const tooLarge = assertInputSize(input);
      if (tooLarge) return tooLarge;
      const bytes = latin1ToBytes(input);
      if (!bytes) {
        return err(
          "INVALID_BINARY_TEXT",
          "Input contains characters outside the Latin-1 range and cannot be treated as raw bytes.",
        );
      }
      try {
        return ok(UTF8_DECODER.decode(await inflateRawBytes(bytes)));
      } catch (cause) {
        return err(
          "DECOMPRESS_FAILED",
          cause instanceof Error ? cause.message : "Input is not a valid raw DEFLATE stream.",
        );
      }
    }
    case "escape":
      return escapeText(input);
    case "unescape":
      return unescapeText(input);
    case "remove-linebreaks":
      return removeLinebreaks(input);
    case "js-variable":
      return toJsVariable(input);
    case "format-xml": {
      const formatted = formatXml(input);
      return formatted.ok ? ok(formatted.value.output) : formatted;
    }
    case "normalize-xml":
      return normalizeXmlText(input);
    case "format-json":
      return formatJson(input, "beautify", { indent: 2 });
    case "normalize-json":
      return formatJson(input, "minify");
    default:
      return err("INVALID_OPERATION", "Choose a text operation.");
  }
}

/** Host-neutral spec so web, extension, and editor adapters share one UI. */
export const DRAWIO_TEXT_SPEC: HostTransformSpec = {
  slug: "drawio-text-tools",
  maxInputChars: DRAWIO_TEXT_MAX_INPUT_CHARS,
  operations: [
    { id: "encode", label: "Encode", actionLabel: "Encode" },
    { id: "decode", label: "Decode", actionLabel: "Decode" },
    { id: "url-encode", label: "URL Encode", actionLabel: "URL Encode" },
    { id: "url-decode", label: "URL Decode", actionLabel: "URL Decode" },
    { id: "base64-encode", label: "Base64 Encode", actionLabel: "Base64 Encode" },
    { id: "base64-decode", label: "Base64 Decode", actionLabel: "Base64 Decode" },
    { id: "deflate", label: "Deflate", actionLabel: "Deflate" },
    { id: "inflate", label: "Inflate", actionLabel: "Inflate" },
    { id: "escape", label: "Escape", actionLabel: "Escape" },
    { id: "unescape", label: "Unescape", actionLabel: "Unescape" },
    { id: "remove-linebreaks", label: "Remove Linebreaks", actionLabel: "Remove Linebreaks" },
    { id: "js-variable", label: "JS Variable", actionLabel: "JS Variable" },
    { id: "format-xml", label: "Format XML", actionLabel: "Format XML" },
    { id: "normalize-xml", label: "Normalize XML", actionLabel: "Normalize XML" },
    { id: "format-json", label: "Format JSON", actionLabel: "Format JSON" },
    { id: "normalize-json", label: "Normalize JSON", actionLabel: "Normalize JSON" },
  ],
  options: [{ id: "default", label: "Default" }],
  optionLabel: "Mode",
  defaultOperationId: "encode",
  defaultOptionId: "default",
  transform: (request) => runDrawioText(request.operationId, request.input),
};
