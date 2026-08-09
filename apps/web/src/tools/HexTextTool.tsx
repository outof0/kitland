import { HEX_TEXT_MAX_ENCODED_CHARS } from "@kitland/core";
import { EncodingTransformWorkspace } from "./EncodingTransformWorkspace";

export function HexTextTool() {
  return (
    <EncodingTransformWorkspace
      tool="hex-text"
      title="Hex Text"
      subtitle="Convert Unicode text to and from UTF-8 hexadecimal bytes locally."
      sample="Hello, 🍵"
      inputLimit={HEX_TEXT_MAX_ENCODED_CHARS}
      formatLabel="Encode as"
      defaultFormat="spaced"
      formatChoices={[
        {
          value: "spaced",
          label: "Spaced",
          title: "Writes one readable byte pair at a time",
        },
        {
          value: "compact",
          label: "Compact",
          title: "Writes hexadecimal bytes with no spaces",
        },
      ]}
      contractNote="Hex decode accepts complete byte pairs with optional whitespace and rejects invalid UTF-8 instead of replacing it."
    />
  );
}
