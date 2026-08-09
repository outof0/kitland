import { runHtmlEntityTransform, type HtmlEntityFormat } from "@kitland/core";
import { runHexTextTransform, type HexTextFormat } from "@kitland/core";
import { runUnicodeConverter } from "@kitland/core";
import { runBinaryTextTransform } from "@kitland/core";
import { runRot13Caesar } from "@kitland/core";
import { err, type ToolResult } from "@kitland/core";

export type EncodingTextTool =
  | "html-entities"
  | "hex-text"
  | "unicode-converter"
  | "binary-text"
  | "rot13-caesar";
export type EncodingTextMode = "encode" | "decode";
export type EncodingTextFormat = HtmlEntityFormat | HexTextFormat | undefined;

/** Dispatches the four deterministic encoding tools for the web worker adapter. */
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
