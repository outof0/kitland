import {
  err,
  runBase64,
  runBinaryTextTransform,
  runHexTextTransform,
  runHtmlEntityTransform,
  runMorseCode,
  runRot13Caesar,
  runUnicodeConverter,
  runUrlTransform,
  type HexTextFormat,
  type HtmlEntityFormat,
  type MorseMode,
  type ToolResult,
} from "@kitland/core";

export type EncodingTextTool =
  | "html-entities"
  | "url-encode"
  | "base64"
  | "hex-text"
  | "unicode-converter"
  | "binary-text"
  | "rot13-caesar"
  | "morse-code";

export type EncodingTextMode = "encode" | "decode";
export type EncodingTextFormat = HtmlEntityFormat | HexTextFormat | undefined;

export function runEncodingTextTransform(
  tool: EncodingTextTool,
  mode: EncodingTextMode,
  input: string,
  format?: EncodingTextFormat,
): ToolResult<string> {
  switch (tool) {
    case "html-entities":
      return isHtmlEntityFormat(format)
        ? runHtmlEntityTransform(mode, input, { format })
        : runHtmlEntityTransform(mode, input);
    case "url-encode":
      return runUrlTransform(mode, input, { scope: "component" });
    case "base64":
      return runBase64(mode, input);
    case "hex-text":
      return isHexTextFormat(format)
        ? runHexTextTransform(mode, input, { format })
        : runHexTextTransform(mode, input);
    case "unicode-converter":
      return runUnicodeConverter(mode, input);
    case "binary-text":
      return runBinaryTextTransform(mode, input);
    case "rot13-caesar":
      return runRot13Caesar(mode, input);
    case "morse-code":
      return runMorseCode(mode as MorseMode, input);
    default:
      return err("UNKNOWN_TOOL", "This text transformation is not available.");
  }
}

function isHtmlEntityFormat(format: EncodingTextFormat): format is HtmlEntityFormat {
  return format === "named" || format === "decimal" || format === "hexadecimal";
}

function isHexTextFormat(format: EncodingTextFormat): format is HexTextFormat {
  return format === "spaced" || format === "compact";
}
