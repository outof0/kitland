import { UNICODE_CONVERTER_MAX_INPUT_CHARS } from "@kitland/core";
import { EncodingTransformWorkspace } from "./EncodingTransformWorkspace";

export function UnicodeConverterTool() {
  return (
    <EncodingTransformWorkspace
      tool="unicode-converter"
      title="Unicode Converter"
      subtitle="Convert Unicode text to explicit code points, or code points back to text."
      sample="A🍵東"
      inputLimit={UNICODE_CONVERTER_MAX_INPUT_CHARS}
      contractNote="Code points use U+XXXX notation and must be separated with spaces. Invalid surrogate values are rejected."
    />
  );
}
