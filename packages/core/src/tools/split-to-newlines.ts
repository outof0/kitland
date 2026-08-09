import { err, ok, type ToolResult } from "../result";

export const SPLIT_TO_NEWLINES_MAX_INPUT_CHARS = 1_000_000;
export type SplitDelimiter = "comma" | "semicolon" | "whitespace" | "pipe" | "custom";
export type SplitToNewlinesOptions = {
  delimiter?: SplitDelimiter;
  customDelimiter?: string;
  trimItems?: boolean;
  dropEmpty?: boolean;
};

export function splitToNewlines(
  input: string,
  options: SplitToNewlinesOptions = {},
): ToolResult<string> {
  if (input.length > SPLIT_TO_NEWLINES_MAX_INPUT_CHARS)
    return err(
      "INPUT_TOO_LARGE",
      `Input exceeds ${SPLIT_TO_NEWLINES_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  const delimiter = options.delimiter ?? "comma";
  const trimItems = options.trimItems ?? true;
  const dropEmpty = options.dropEmpty ?? true;
  let parts: string[];
  if (delimiter === "whitespace") {
    parts = input.split(/\s+/u);
  } else if (delimiter === "custom") {
    const custom = options.customDelimiter ?? "";
    if (!custom) return err("EMPTY_DELIMITER", "Enter a custom delimiter.");
    if (custom.length > 32)
      return err("INVALID_DELIMITER", "Custom delimiter must be at most 32 characters.");
    parts = input.split(custom);
  } else {
    const map = { comma: ",", semicolon: ";", pipe: "|" } as const;
    parts = input.split(map[delimiter]);
  }
  let items = trimItems ? parts.map((p) => p.trim()) : parts;
  if (dropEmpty) items = items.filter((p) => p.length > 0);
  return ok(items.join("\n"));
}
