import { err, ok, type ToolResult } from "../result";

export const JOIN_LINES_MAX_INPUT_CHARS = 1_000_000;
export type JoinDelimiter = "comma" | "semicolon" | "whitespace" | "pipe" | "custom";
export type JoinLinesOptions = {
  delimiter?: JoinDelimiter;
  customDelimiter?: string;
  trimItems?: boolean;
  dropEmpty?: boolean;
};

export function joinLines(input: string, options: JoinLinesOptions = {}): ToolResult<string> {
  if (input.length > JOIN_LINES_MAX_INPUT_CHARS)
    return err(
      "INPUT_TOO_LARGE",
      `Input exceeds ${JOIN_LINES_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  const delimiter = options.delimiter ?? "comma";
  const trimItems = options.trimItems ?? true;
  const dropEmpty = options.dropEmpty ?? true;
  let sep: string;
  if (delimiter === "custom") {
    const custom = options.customDelimiter ?? "";
    if (!custom) return err("EMPTY_DELIMITER", "Enter a custom delimiter.");
    if (custom.length > 32)
      return err("INVALID_DELIMITER", "Custom delimiter must be at most 32 characters.");
    sep = custom;
  } else if (delimiter === "comma") {
    sep = ", ";
  } else if (delimiter === "semicolon") {
    sep = "; ";
  } else if (delimiter === "whitespace") {
    sep = " ";
  } else if (delimiter === "pipe") {
    sep = " | ";
  } else {
    sep = ", ";
  }

  const lines = input.split(/\r?\n/);
  let items = trimItems ? lines.map((l) => l.trim()) : lines;
  if (dropEmpty) items = items.filter((l) => l.length > 0);
  return ok(items.join(sep));
}
