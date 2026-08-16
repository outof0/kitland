import { err, inspectJson, type JsonFormatMode } from "@kitland/core";
import { getToolBySlug } from "@kitland/tools";
import type { TextInspectAdapter } from "../toolAdapter";

const jsonFormatter = getToolBySlug("json-formatter");
if (!jsonFormatter) throw new Error("Missing JSON Formatter registry definition.");

export const jsonFormatterAdapter: TextInspectAdapter = {
  registryTool: jsonFormatter,
  descriptor: {
    id: jsonFormatter.id,
    title: jsonFormatter.shortName,
    description: jsonFormatter.description,
    renderer: {
      kind: "text-inspect",
      operations: [
        { id: "beautify", label: "Beautify", actionLabel: "Beautify JSON" },
        { id: "minify", label: "Minify", actionLabel: "Minify JSON" },
      ],
      options: [
        { id: "indent-2", label: "2 spaces" },
        { id: "indent-4", label: "4 spaces" },
        { id: "indent-tab", label: "Tab" },
      ],
      optionLabel: "Indentation",
      defaultOperationId: "beautify",
      defaultOptionId: "indent-2",
    },
  },
  maxInputChars: 100_000,
  maxOutputChars: 1_000_000,
  maxSelectionChars: 100_000,
  selectionCommands: [],
  inspect(request) {
    const mode: JsonFormatMode | undefined =
      request.operationId === "beautify" || request.operationId === "minify"
        ? request.operationId
        : undefined;
    if (!mode) return err("INVALID_OPERATION", "Choose Beautify or Minify.");
    const indent: 2 | 4 | "tab" | null =
      request.optionId === "indent-2"
        ? 2
        : request.optionId === "indent-4"
          ? 4
          : request.optionId === "indent-tab"
            ? "tab"
            : null;
    if (!indent) return err("INVALID_OPTION", "Choose 2-space, 4-space, or tab indentation.");
    if (request.input.length > 100_000) {
      return err("INPUT_TOO_LARGE", "JSON input exceeds the 100,000 UTF-16 code unit limit.");
    }
    return inspectJson(request.input, indent, mode);
  },
};
