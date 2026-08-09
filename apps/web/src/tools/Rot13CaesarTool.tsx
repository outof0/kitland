import { ROT13_CAESAR_MAX_INPUT_CHARS } from "@kitland/core";
import { RotateCcw } from "lucide-react";
import { EncodingTransformWorkspace } from "./EncodingTransformWorkspace";

const SAMPLE = "Hello world";

/** ROT13 is a fixed Caesar shift of 13 and uses the shared local transform shell. */
export function Rot13CaesarTool() {
  return (
    <EncodingTransformWorkspace
      tool="rot13-caesar"
      title="ROT13 Caesar"
      subtitle="Rotate ASCII letters by 13 positions locally."
      icon={RotateCcw}
      sample={SAMPLE}
      inputLimit={ROT13_CAESAR_MAX_INPUT_CHARS}
      contractNote="ROT13 is its own inverse: Encode and Decode both apply a fixed Caesar shift of 13. Non-Latin characters stay unchanged."
    />
  );
}
