import { BINARY_TEXT_MAX_INPUT_CHARS } from "@kitland/core";
import { EncodingTransformWorkspace } from "./EncodingTransformWorkspace";

export function BinaryTextTool() {
  return (
    <EncodingTransformWorkspace
      tool="binary-text"
      title="Binary Text"
      subtitle="Convert Unicode text to and from eight-bit UTF-8 byte groups locally."
      sample="Hi 🍵"
      inputLimit={BINARY_TEXT_MAX_INPUT_CHARS}
      contractNote="Binary decode accepts eight-bit groups separated by whitespace and rejects invalid UTF-8 bytes."
    />
  );
}
