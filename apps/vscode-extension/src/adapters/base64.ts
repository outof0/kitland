import { err, runBase64, type Base64Mode } from "@kitland/core";
import { base64Tool } from "@kitland/tools";
import type { TextTransformAdapter } from "../toolAdapter";

const MAX_ENCODE_INPUT_CHARS = 250_000;
const MAX_DECODE_INPUT_CHARS = 1_000_000;

export const base64Adapter: TextTransformAdapter = {
  catalogTool: base64Tool,
  descriptor: {
    id: base64Tool.id,
    title: base64Tool.shortName,
    description: base64Tool.description,
    renderer: {
      kind: "text-transform",
      operations: [
        { id: "encode", label: "Encode", actionLabel: "Encode" },
        { id: "decode", label: "Decode", actionLabel: "Decode" },
      ],
      options: [
        { id: "standard", label: "Standard" },
        { id: "url-safe", label: "URL-safe" },
      ],
      optionLabel: "Variant",
      defaultOperationId: "encode",
      defaultOptionId: "standard",
    },
  },
  maxOutputChars: 1_000_000,
  maxSelectionChars: 250_000,
  selectionCommands: [
    {
      commandId: "kitland.base64.encodeSelection",
      operationId: "encode",
      optionId: "standard",
    },
    {
      commandId: "kitland.base64.decodeSelection",
      operationId: "decode",
      optionId: "standard",
    },
  ],
  inputLimit(operationId) {
    if (operationId === "encode") return MAX_ENCODE_INPUT_CHARS;
    if (operationId === "decode") return MAX_DECODE_INPUT_CHARS;
    return undefined;
  },
  transform(request) {
    const mode = asBase64Mode(request.operationId);
    if (!mode) return err("INVALID_OPERATION", "Choose Encode or Decode.");
    if (request.optionId !== "standard" && request.optionId !== "url-safe") {
      return err("INVALID_OPTION", "Choose Standard or URL-safe Base64.");
    }
    return runBase64(mode, request.input, { urlSafe: request.optionId === "url-safe" });
  },
};

function asBase64Mode(value: string): Base64Mode | undefined {
  if (value === "encode" || value === "decode") return value;
  return undefined;
}
