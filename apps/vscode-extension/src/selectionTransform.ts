import { err, ok, type ToolResult } from "@kitland/core";
import type { ToolAdapter } from "./toolAdapter";

export type OffsetRange = { start: number; end: number };

export function hasOverlappingRanges(ranges: readonly OffsetRange[]): boolean {
  const ordered = [...ranges].sort(
    (left, right) => left.start - right.start || left.end - right.end,
  );
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (previous && current && current.start < previous.end) return true;
  }
  return false;
}

export function transformSelectedValues(
  adapter: ToolAdapter,
  operationId: string,
  optionId: string,
  inputs: readonly string[],
): ToolResult<readonly string[]> {
  if (inputs.length === 0 || inputs.some((input) => input.length === 0)) {
    return err("EMPTY_SELECTION", "Select non-empty text before running this command.");
  }

  const inputLimit = adapter.inputLimit(operationId);
  if (inputLimit === undefined) {
    return err("INVALID_OPERATION", "This tool does not support the requested operation.");
  }

  let totalCharacters = 0;
  for (const input of inputs) {
    totalCharacters += input.length;
    if (totalCharacters > adapter.maxSelectionChars || input.length > inputLimit) {
      return err(
        "INPUT_TOO_LARGE",
        `Selected text exceeds the ${Math.min(adapter.maxSelectionChars, inputLimit).toLocaleString()} character safety limit.`,
      );
    }
  }

  const values: string[] = [];
  for (const input of inputs) {
    const result = adapter.transform({ operationId, optionId, input });
    if (!result.ok) return result;
    if (result.value.length > adapter.maxOutputChars) {
      return err("OUTPUT_TOO_LARGE", "Output exceeds this tool's editor safety limit.");
    }
    values.push(result.value);
  }
  return ok(values);
}
