import {
  BINARY_TEXT_MAX_ENCODED_CHARS,
  BINARY_TEXT_MAX_INPUT_CHARS,
  HEX_TEXT_MAX_ENCODED_CHARS,
  HEX_TEXT_MAX_INPUT_CHARS,
  HTML_ENTITIES_MAX_INPUT_CHARS,
  MORSE_CODE_MAX_INPUT_CHARS,
  ROT13_CAESAR_MAX_INPUT_CHARS,
  UNICODE_CONVERTER_MAX_INPUT_CHARS,
  URL_TRANSFORM_MAX_INPUT_CHARS,
} from "@kitland/core";
import { Radio, RotateCcw } from "lucide-react";
import {
  EncodingTransformWorkspace,
  type EncodingTransformWorkspaceProps,
} from "../components/EncodingTransformWorkspace";
import type { EncodingTextTransformHook } from "./useSyncEncodingTextTransform";
import type { EncodingTextTool } from "./encoding-text-transform";
import type { ToolCapabilities } from "../capabilities";

const ENCODING_PROPS: Record<
  Exclude<EncodingTextTool, "base64">,
  Omit<EncodingTransformWorkspaceProps, "useTransform">
> = {
  "html-entities": {
    tool: "html-entities",
    title: "HTML Entities",
    subtitle: "Encode/decode HTML entities; unknown entities are preserved.",
    sample: '<p title="tea & cake">🍵</p>',
    inputLimits: {
      encode: HTML_ENTITIES_MAX_INPUT_CHARS,
      decode: HTML_ENTITIES_MAX_INPUT_CHARS,
    },
    contractNote:
      "Named mode escapes HTML-significant characters. Decode supports common named entities plus strict decimal and hexadecimal numeric entities.",
  },
  "url-encode": {
    tool: "url-encode",
    title: "URL Encode",
    subtitle: "Encode or decode one URL component — not a whole URL.",
    sample: "kitland.test/search?q=tea & cake&limit=5",
    inputLimits: {
      encode: URL_TRANSFORM_MAX_INPUT_CHARS,
      decode: URL_TRANSFORM_MAX_INPUT_CHARS,
    },
    contractNote:
      "Encode escapes URI delimiters such as /, ?, &, =, and #. Decode supports strict percent-encoded UTF-8 strings.",
  },
  "hex-text": {
    tool: "hex-text",
    title: "Hex Text",
    subtitle: "Convert Unicode text to and from UTF-8 hexadecimal bytes locally.",
    sample: "Hello, 🍵",
    inputLimits: { encode: HEX_TEXT_MAX_INPUT_CHARS, decode: HEX_TEXT_MAX_ENCODED_CHARS },
    formatLabel: "Encode as",
    defaultFormat: "spaced",
    formatChoices: [
      { value: "spaced", label: "Spaced", title: "Writes one readable byte pair at a time" },
      { value: "compact", label: "Compact", title: "Writes hexadecimal bytes with no spaces" },
    ],
    contractNote:
      "Hex decode accepts complete byte pairs with optional whitespace and rejects invalid UTF-8 instead of replacing it.",
  },
  "unicode-converter": {
    tool: "unicode-converter",
    title: "Unicode Converter",
    subtitle: "Convert Unicode text to explicit code points, or code points back to text.",
    sample: "A🍵東",
    inputLimits: {
      encode: UNICODE_CONVERTER_MAX_INPUT_CHARS,
      decode: UNICODE_CONVERTER_MAX_INPUT_CHARS,
    },
    contractNote:
      "Code points use U+XXXX notation and must be separated with spaces. Invalid surrogate values are rejected.",
  },
  "binary-text": {
    tool: "binary-text",
    title: "Binary Text",
    subtitle: "Convert Unicode text to and from eight-bit UTF-8 byte groups locally.",
    sample: "Hi 🍵",
    inputLimits: {
      encode: BINARY_TEXT_MAX_INPUT_CHARS,
      decode: BINARY_TEXT_MAX_ENCODED_CHARS,
    },
    contractNote:
      "Binary decode accepts eight-bit groups separated by whitespace and rejects invalid UTF-8 bytes.",
  },
  "rot13-caesar": {
    tool: "rot13-caesar",
    title: "ROT13 Caesar",
    subtitle: "Rotate ASCII letters by 13 positions locally.",
    icon: RotateCcw,
    sample: "Hello world",
    inputLimits: {
      encode: ROT13_CAESAR_MAX_INPUT_CHARS,
      decode: ROT13_CAESAR_MAX_INPUT_CHARS,
    },
    contractNote:
      "ROT13 is its own inverse: Encode and Decode both apply a fixed Caesar shift of 13. Non-Latin characters stay unchanged.",
  },
  "morse-code": {
    tool: "morse-code",
    title: "Morse Code",
    subtitle: "Encode or decode ITU Morse for Latin letters and digits locally.",
    icon: Radio,
    sample: "SOS HELP",
    inputLimits: {
      encode: MORSE_CODE_MAX_INPUT_CHARS,
      decode: MORSE_CODE_MAX_INPUT_CHARS,
    },
    contractNote:
      "Letters are separated by single spaces and words by slashes or multiple spaces. Latin letters, numerals, and standard punctuation are supported.",
  },
};

export function isEncodingToolSlug(slug: string): slug is Exclude<EncodingTextTool, "base64"> {
  return Object.hasOwn(ENCODING_PROPS, slug);
}

export function EncodingToolBySlug({
  slug,
  useTransform,
  initialInput,
  capabilities,
}: {
  readonly slug: string;
  readonly useTransform?: EncodingTextTransformHook;
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
}) {
  if (!isEncodingToolSlug(slug)) return null;
  return (
    <EncodingTransformWorkspace
      {...ENCODING_PROPS[slug]}
      {...(useTransform ? { useTransform } : {})}
      {...(initialInput !== undefined ? { initialInput } : {})}
      {...(capabilities ? { capabilities } : {})}
    />
  );
}
