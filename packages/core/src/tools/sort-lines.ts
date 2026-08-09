import { err, ok, type ToolResult } from "../result";

/** Bound sorting cost tightly enough for a live local transformation. */
export const SORT_LINES_MAX_INPUT_CHARS = 200_000;
export const SORT_LINES_MAX_LINES = 25_000;

export type SortLinesOptions = {
  direction?: "ascending" | "descending";
  caseSensitive?: boolean;
  numeric?: boolean;
};

type LineDocument = {
  lines: string[];
  lineEnding: string;
  hasFinalLineEnding: boolean;
};

/** Sort text lines stably, retaining their original line-ending convention. */
export function sortLines(input: string, options: SortLinesOptions = {}): ToolResult<string> {
  const document = parseLineDocument(input, "Sort Lines");
  if (!document.ok) return document;

  const direction = options.direction ?? "ascending";
  if (direction !== "ascending" && direction !== "descending") {
    return err("INVALID_DIRECTION", "Sort direction must be ascending or descending.");
  }

  const collator = new Intl.Collator("en", {
    sensitivity: options.caseSensitive === true ? "variant" : "accent",
    numeric: options.numeric === true,
  });
  const multiplier = direction === "ascending" ? 1 : -1;
  const sorted = document.value.lines
    .map((line, index) => ({ line, index }))
    .sort(
      (left, right) =>
        multiplier * collator.compare(left.line, right.line) || left.index - right.index,
    )
    .map(({ line }) => line);

  return ok(serializeLineDocument({ ...document.value, lines: sorted }));
}

export function parseLineDocument(input: string, toolName: string): ToolResult<LineDocument> {
  if (input.length > SORT_LINES_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `${toolName} input exceeds ${SORT_LINES_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  const lineEnding = input.includes("\r\n") ? "\r\n" : input.includes("\r") ? "\r" : "\n";
  const hasFinalLineEnding = /(?:\r\n|\r|\n)$/.test(input);
  const lines = input.replace(/\r\n|\r|\n/g, "\n").split("\n");
  if (hasFinalLineEnding) lines.pop();

  if (lines.length > SORT_LINES_MAX_LINES) {
    return err(
      "TOO_MANY_LINES",
      `${toolName} supports up to ${SORT_LINES_MAX_LINES.toLocaleString()} lines.`,
    );
  }

  return ok({ lines, lineEnding, hasFinalLineEnding });
}

export function serializeLineDocument(document: LineDocument): string {
  return (
    document.lines.join(document.lineEnding) +
    (document.hasFinalLineEnding ? document.lineEnding : "")
  );
}
