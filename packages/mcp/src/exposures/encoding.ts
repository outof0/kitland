import {
  ok,
  rotateCaesar,
  runBinaryTextTransform,
  runHexTextTransform,
  runHtmlEntityTransform,
  runMorseCode,
  runUnicodeConverter,
  runUrlTransform,
  type HexTextFormat,
  type HtmlEntityFormat,
  type ToolResult,
  type UrlEncodingScope,
} from "@kitland/core";
import {
  buildAdvertisedOutputSchema,
  DEFAULT_MCP_LIMITS,
  DEFAULT_MCP_SAFETY,
  type McpExposure,
} from "../contracts.ts";
import { createMcpError, type McpErrorPayload } from "../errors.ts";

function mapError(code: string, _message: string): McpErrorPayload {
  if (code === "INPUT_TOO_LARGE") {
    return createMcpError("INPUT_TOO_LARGE", "Input text exceeds the maximum allowed size.");
  }
  return createMcpError(
    "INVALID_INPUT",
    "The operation could not be completed. Check the input format.",
  );
}

// ---------------------------------------------------------------------------
// URL Encode / Decode
// ---------------------------------------------------------------------------

type UrlTransformInput = {
  readonly input: string;
  readonly scope?: "component" | "url";
};

type UrlTransformOutput = {
  readonly output: string;
  readonly scope: "component" | "url";
};

const URL_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Text or URL to process." },
    scope: {
      type: "string",
      enum: ["component", "url"],
      description: "Scope: 'component' for query params/components, 'url' for full URLs.",
    },
  },
} as const;

const URL_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "scope"],
  properties: {
    output: { type: "string", description: "Transformed URL or encoded string." },
    scope: { type: "string", enum: ["component", "url"] },
  },
} as const;

export const kitlandUrlEncodeExposure: McpExposure<UrlTransformInput, UrlTransformOutput> = {
  mcpName: "kitland_url_encode",
  operationId: "url_encode",
  contractVersion: 1,
  catalogToolId: "url-encode",
  title: "URL Encode",
  description: "Percent-encode text as a URL component or full URL.",
  inputSchema: URL_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(URL_SUCCESS_SCHEMA),
  successSchema: URL_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: UrlTransformInput): ToolResult<UrlTransformOutput> => {
    const scope: UrlEncodingScope = args.scope ?? "component";
    const res = runUrlTransform("encode", args.input, { scope });
    if (!res.ok) return res;
    return ok({ output: res.value, scope });
  },
  mapCoreError: mapError,
};

export const kitlandUrlDecodeExposure: McpExposure<UrlTransformInput, UrlTransformOutput> = {
  mcpName: "kitland_url_decode",
  operationId: "url_decode",
  contractVersion: 1,
  catalogToolId: "url-encode",
  title: "URL Decode",
  description: "Decode percent-encoded URL components or full URLs.",
  inputSchema: URL_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(URL_SUCCESS_SCHEMA),
  successSchema: URL_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: UrlTransformInput): ToolResult<UrlTransformOutput> => {
    const scope: UrlEncodingScope = args.scope ?? "component";
    const res = runUrlTransform("decode", args.input, { scope });
    if (!res.ok) return res;
    return ok({ output: res.value, scope });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// HTML Entities
// ---------------------------------------------------------------------------

type HtmlEntitiesEncodeInput = {
  readonly input: string;
  readonly format?: "named" | "decimal" | "hexadecimal";
};

type HtmlEntitiesEncodeOutput = {
  readonly output: string;
  readonly format: "named" | "decimal" | "hexadecimal";
};

const HTML_ENTITIES_ENCODE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Text content to encode into HTML entities." },
    format: {
      type: "string",
      enum: ["named", "decimal", "hexadecimal"],
      description: "Entity format: 'named' (&amp;), 'decimal' (&#38;), or 'hexadecimal' (&#x26;).",
    },
  },
} as const;

const HTML_ENTITIES_ENCODE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "format"],
  properties: {
    output: { type: "string", description: "Encoded HTML entities string." },
    format: { type: "string", enum: ["named", "decimal", "hexadecimal"] },
  },
} as const;

export const kitlandHtmlEntitiesEncodeExposure: McpExposure<
  HtmlEntitiesEncodeInput,
  HtmlEntitiesEncodeOutput
> = {
  mcpName: "kitland_html_entities_encode",
  operationId: "html_entities_encode",
  contractVersion: 1,
  catalogToolId: "html-entities",
  title: "HTML Entities Encode",
  description: "Encode special characters to HTML character entities.",
  inputSchema: HTML_ENTITIES_ENCODE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(HTML_ENTITIES_ENCODE_SUCCESS_SCHEMA),
  successSchema: HTML_ENTITIES_ENCODE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: HtmlEntitiesEncodeInput): ToolResult<HtmlEntitiesEncodeOutput> => {
    const format: HtmlEntityFormat = args.format ?? "named";
    const res = runHtmlEntityTransform("encode", args.input, { format });
    if (!res.ok) return res;
    return ok({ output: res.value, format });
  },
  mapCoreError: mapError,
};

type TextOnlyInput = { readonly input: string };
type TextOnlyOutput = { readonly output: string };

const TEXT_ONLY_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Text content to process." },
  },
} as const;

const TEXT_ONLY_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output"],
  properties: {
    output: { type: "string", description: "Transformed text output." },
  },
} as const;

export const kitlandHtmlEntitiesDecodeExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_html_entities_decode",
  operationId: "html_entities_decode",
  contractVersion: 1,
  catalogToolId: "html-entities",
  title: "HTML Entities Decode",
  description: "Decode HTML character entities to standard characters.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = runHtmlEntityTransform("decode", args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Hex Text
// ---------------------------------------------------------------------------

type HexEncodeInput = {
  readonly input: string;
  readonly format?: "spaced" | "compact";
};

type HexEncodeOutput = {
  readonly output: string;
  readonly format: "spaced" | "compact";
};

const HEX_ENCODE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "UTF-8 text to encode as hex bytes." },
    format: {
      type: "string",
      enum: ["spaced", "compact"],
      description: "Format variant: 'spaced' (e.g. 48 65 6c) or 'compact' (48656c).",
    },
  },
} as const;

const HEX_ENCODE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "format"],
  properties: {
    output: { type: "string", description: "Hexadecimal byte representation." },
    format: { type: "string", enum: ["spaced", "compact"] },
  },
} as const;

export const kitlandHexTextEncodeExposure: McpExposure<HexEncodeInput, HexEncodeOutput> = {
  mcpName: "kitland_hex_text_encode",
  operationId: "hex_text_encode",
  contractVersion: 1,
  catalogToolId: "hex-text",
  title: "Hex Text Encode",
  description: "Convert UTF-8 text to hexadecimal byte notation.",
  inputSchema: HEX_ENCODE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(HEX_ENCODE_SUCCESS_SCHEMA),
  successSchema: HEX_ENCODE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: HexEncodeInput): ToolResult<HexEncodeOutput> => {
    const format: HexTextFormat = args.format ?? "spaced";
    const res = runHexTextTransform("encode", args.input, { format });
    if (!res.ok) return res;
    return ok({ output: res.value, format });
  },
  mapCoreError: mapError,
};

export const kitlandHexTextDecodeExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_hex_text_decode",
  operationId: "hex_text_decode",
  contractVersion: 1,
  catalogToolId: "hex-text",
  title: "Hex Text Decode",
  description: "Decode hexadecimal byte notation back to UTF-8 text.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = runHexTextTransform("decode", args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Unicode Converter
// ---------------------------------------------------------------------------

export const kitlandUnicodeEncodeExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_unicode_encode",
  operationId: "unicode_encode",
  contractVersion: 1,
  catalogToolId: "unicode-converter",
  title: "Unicode Encode",
  description: "Convert characters into Unicode code point notation (e.g. U+0048).",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = runUnicodeConverter("encode", args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

export const kitlandUnicodeDecodeExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_unicode_decode",
  operationId: "unicode_decode",
  contractVersion: 1,
  catalogToolId: "unicode-converter",
  title: "Unicode Decode",
  description: "Decode Unicode code points into UTF-8 text.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = runUnicodeConverter("decode", args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Binary Text
// ---------------------------------------------------------------------------

export const kitlandBinaryTextEncodeExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_binary_text_encode",
  operationId: "binary_text_encode",
  contractVersion: 1,
  catalogToolId: "binary-text",
  title: "Binary Text Encode",
  description: "Convert UTF-8 text to 8-bit binary strings.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = runBinaryTextTransform("encode", args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

export const kitlandBinaryTextDecodeExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_binary_text_decode",
  operationId: "binary_text_decode",
  contractVersion: 1,
  catalogToolId: "binary-text",
  title: "Binary Text Decode",
  description: "Decode 8-bit binary strings back to UTF-8 text.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = runBinaryTextTransform("decode", args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// ROT13 / Caesar
// ---------------------------------------------------------------------------

type Rot13CaesarInput = {
  readonly input: string;
  readonly shift?: number;
};

type Rot13CaesarOutput = {
  readonly output: string;
  readonly shift: number;
};

const ROT13_CAESAR_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Text to shift." },
    shift: {
      type: "integer",
      minimum: 1,
      maximum: 25,
      description: "Caesar alphabet shift amount (default 13 for standard ROT13).",
    },
  },
} as const;

const ROT13_CAESAR_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "shift"],
  properties: {
    output: { type: "string", description: "Ciphered / shifted text output." },
    shift: { type: "integer" },
  },
} as const;

export const kitlandRot13CaesarExposure: McpExposure<Rot13CaesarInput, Rot13CaesarOutput> = {
  mcpName: "kitland_rot13_caesar",
  operationId: "rot13_caesar",
  contractVersion: 1,
  catalogToolId: "rot13-caesar",
  title: "ROT13 / Caesar Cipher",
  description: "Apply ROT13 or arbitrary Caesar letter shifts to text.",
  inputSchema: ROT13_CAESAR_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(ROT13_CAESAR_SUCCESS_SCHEMA),
  successSchema: ROT13_CAESAR_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: Rot13CaesarInput): ToolResult<Rot13CaesarOutput> => {
    const shift = args.shift ?? 13;
    const res = rotateCaesar(args.input, shift);
    if (!res.ok) return res;
    return ok({ output: res.value, shift });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Morse Code
// ---------------------------------------------------------------------------

export const kitlandMorseCodeEncodeExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_morse_code_encode",
  operationId: "morse_code_encode",
  contractVersion: 1,
  catalogToolId: "morse-code",
  title: "Morse Code Encode",
  description: "Encode text into ITU Morse code dots and dashes.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = runMorseCode("encode", args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

export const kitlandMorseCodeDecodeExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_morse_code_decode",
  operationId: "morse_code_decode",
  contractVersion: 1,
  catalogToolId: "morse-code",
  title: "Morse Code Decode",
  description: "Decode ITU Morse code into standard text.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = runMorseCode("decode", args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

export const ENCODING_EXPOSURES = [
  kitlandUrlEncodeExposure,
  kitlandUrlDecodeExposure,
  kitlandHtmlEntitiesEncodeExposure,
  kitlandHtmlEntitiesDecodeExposure,
  kitlandHexTextEncodeExposure,
  kitlandHexTextDecodeExposure,
  kitlandUnicodeEncodeExposure,
  kitlandUnicodeDecodeExposure,
  kitlandBinaryTextEncodeExposure,
  kitlandBinaryTextDecodeExposure,
  kitlandRot13CaesarExposure,
  kitlandMorseCodeEncodeExposure,
  kitlandMorseCodeDecodeExposure,
] as const;
