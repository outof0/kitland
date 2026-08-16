import { err, formatFetchRequest, parseCurlCommand } from "@kitland/core";
import { getToolBySlug } from "@kitland/tools";
import type { TextTransformAdapter } from "../toolAdapter";

const curlConverterTool = getToolBySlug("curl-converter");
if (!curlConverterTool) throw new Error("Missing cURL Converter registry definition.");

export const curlConverterAdapter: TextTransformAdapter = {
  registryTool: curlConverterTool,
  descriptor: {
    id: curlConverterTool.id,
    title: curlConverterTool.shortName,
    description: curlConverterTool.description,
    renderer: {
      kind: "text-transform",
      operations: [{ id: "convert", label: "Convert", actionLabel: "Convert to Fetch" }],
      options: [{ id: "fetch", label: "Fetch" }],
      optionLabel: "Output",
      defaultOperationId: "convert",
      defaultOptionId: "fetch",
    },
  },
  maxOutputChars: 1_000_000,
  maxSelectionChars: 100_000,
  selectionCommands: [
    {
      commandId: "kitland.curlConverter.convertSelection",
      operationId: "convert",
      optionId: "fetch",
    },
  ],
  inputLimit(operationId) {
    return operationId === "convert" ? 100_000 : undefined;
  },
  transform(request) {
    if (request.operationId !== "convert")
      return err("INVALID_OPERATION", "Choose Convert to Fetch.");
    if (request.optionId !== "fetch") return err("INVALID_OPTION", "Choose Fetch output.");
    const parsed = parseCurlCommand(request.input);
    return parsed.ok ? { ok: true, value: formatFetchRequest(parsed.value) } : parsed;
  },
};
