import { err, ok, type ToolResult } from "../result";

export const TEXT_DIFF_MAX_INPUT_CHARS = 500_000;
export const TEXT_DIFF_MAX_LINES = 2_000;
export const TEXT_DIFF_MAX_MATRIX_CELLS = 1_000_000;

export type TextDiffLine = {
  kind: "equal" | "added" | "removed";
  value: string;
  oldLine: number | null;
  newLine: number | null;
};

export type TextDiffResult = {
  equal: boolean;
  added: number;
  removed: number;
  unchanged: number;
  lines: readonly TextDiffLine[];
};

/** Compute a deterministic, line-oriented LCS diff with explicit resource limits. */
export function diffText(before: string, after: string): ToolResult<TextDiffResult> {
  const bounds = validateBounds(before, after);
  if (!bounds.ok) return bounds;

  const oldLines = splitLines(before);
  const newLines = splitLines(after);
  const rows = oldLines.length + 1;
  const columns = newLines.length + 1;
  if (rows * columns > TEXT_DIFF_MAX_MATRIX_CELLS) {
    return err(
      "DIFF_TOO_COMPLEX",
      `Text diff exceeds the ${TEXT_DIFF_MAX_MATRIX_CELLS.toLocaleString()} line-comparison limit.`,
    );
  }

  const lcs = new Uint32Array(rows * columns);
  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      const index = oldIndex * columns + newIndex;
      if (oldLines[oldIndex] === newLines[newIndex]) {
        lcs[index] = (lcs[(oldIndex + 1) * columns + newIndex + 1] ?? 0) + 1;
      } else {
        lcs[index] = Math.max(
          lcs[(oldIndex + 1) * columns + newIndex] ?? 0,
          lcs[oldIndex * columns + newIndex + 1] ?? 0,
        );
      }
    }
  }

  const lines: TextDiffLine[] = [];
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < oldLines.length && newIndex < newLines.length) {
    const oldLine = oldLines[oldIndex] ?? "";
    const newLine = newLines[newIndex] ?? "";
    if (oldLine === newLine) {
      lines.push({
        kind: "equal",
        value: oldLine,
        oldLine: oldIndex + 1,
        newLine: newIndex + 1,
      });
      unchanged += 1;
      oldIndex += 1;
      newIndex += 1;
    } else if (
      (lcs[(oldIndex + 1) * columns + newIndex] ?? 0) >=
      (lcs[oldIndex * columns + newIndex + 1] ?? 0)
    ) {
      lines.push({
        kind: "removed",
        value: oldLine,
        oldLine: oldIndex + 1,
        newLine: null,
      });
      removed += 1;
      oldIndex += 1;
    } else {
      lines.push({
        kind: "added",
        value: newLine,
        oldLine: null,
        newLine: newIndex + 1,
      });
      added += 1;
      newIndex += 1;
    }
  }
  while (oldIndex < oldLines.length) {
    lines.push({
      kind: "removed",
      value: oldLines[oldIndex] ?? "",
      oldLine: oldIndex + 1,
      newLine: null,
    });
    removed += 1;
    oldIndex += 1;
  }
  while (newIndex < newLines.length) {
    lines.push({
      kind: "added",
      value: newLines[newIndex] ?? "",
      oldLine: null,
      newLine: newIndex + 1,
    });
    added += 1;
    newIndex += 1;
  }

  return ok({
    equal: added === 0 && removed === 0,
    added,
    removed,
    unchanged,
    lines,
  });
}

function validateBounds(before: string, after: string): ToolResult<null> {
  if (before.length > TEXT_DIFF_MAX_INPUT_CHARS || after.length > TEXT_DIFF_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Each text input must be at most ${TEXT_DIFF_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }
  const beforeLines = countLines(before);
  const afterLines = countLines(after);
  if (beforeLines > TEXT_DIFF_MAX_LINES || afterLines > TEXT_DIFF_MAX_LINES) {
    return err(
      "INPUT_TOO_LARGE",
      `Each text input must be at most ${TEXT_DIFF_MAX_LINES.toLocaleString()} lines.`,
    );
  }
  return ok(null);
}

function splitLines(input: string): string[] {
  return input ? input.split(/\r\n|\r|\n/) : [];
}

function countLines(input: string): number {
  return input ? input.split(/\r\n|\r|\n/).length : 0;
}
