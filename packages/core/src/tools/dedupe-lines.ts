import { err, ok, type ToolResult } from "../result";

/** Bound set growth tightly enough for a live local transformation. */
export const DEDUPE_LINES_MAX_INPUT_CHARS = 200_000;
export const DEDUPE_LINES_MAX_LINES = 25_000;

export type DedupeLinesOptions = {
  mode?: "exact" | "trim";
  caseSensitive?: boolean;
};

/**
 * Remove repeated lines while retaining the first original spelling, whitespace,
 * ordering, line-ending convention, and terminal newline.
 */
export function dedupeLines(input: string, options: DedupeLinesOptions = {}): ToolResult<string> {
  if (input.length > DEDUPE_LINES_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Dedupe Lines input exceeds ${DEDUPE_LINES_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  const mode = options.mode ?? "exact";
  if (mode !== "exact" && mode !== "trim") {
    return err("INVALID_MODE", "Dedupe mode must be exact or trim.");
  }

  const lineEnding = input.includes("\r\n") ? "\r\n" : input.includes("\r") ? "\r" : "\n";
  const hasFinalLineEnding = /(?:\r\n|\r|\n)$/.test(input);
  const lines = input.replace(/\r\n|\r|\n/g, "\n").split("\n");
  if (hasFinalLineEnding) lines.pop();

  if (lines.length > DEDUPE_LINES_MAX_LINES) {
    return err(
      "TOO_MANY_LINES",
      `Dedupe Lines supports up to ${DEDUPE_LINES_MAX_LINES.toLocaleString()} lines.`,
    );
  }

  const seen = new Set<string>();
  const unique = lines.filter((line) => {
    const normalized = mode === "trim" ? line.trim() : line;
    const key = options.caseSensitive === false ? normalized.toLocaleLowerCase("en") : normalized;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return ok(unique.join(lineEnding) + (hasFinalLineEnding ? lineEnding : ""));
}
