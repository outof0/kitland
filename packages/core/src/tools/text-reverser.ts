import { err, ok, type ToolResult } from "../result";

/** Live web transformation cap; grapheme segmentation is linear but non-trivial. */
export const TEXT_REVERSER_MAX_INPUT_CHARS = 200_000;

export type TextReverseMode = "characters" | "word-order" | "word-characters" | "line-order";
export type TextReverseCase = "keep" | "upper" | "lower";
export type TextReverseOptions = {
  mode?: TextReverseMode;
  case?: TextReverseCase;
};

const MODES = new Set<TextReverseMode>([
  "characters",
  "word-order",
  "word-characters",
  "line-order",
]);
const CASES = new Set<TextReverseCase>(["keep", "upper", "lower"]);

/** Reverse text without splitting Unicode grapheme clusters such as emoji or combining marks. */
export function reverseText(input: string, options: TextReverseOptions = {}): ToolResult<string> {
  if (input.length > TEXT_REVERSER_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Text input exceeds ${TEXT_REVERSER_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  const mode = options.mode ?? "characters";
  const textCase = options.case ?? "keep";
  if (!MODES.has(mode)) return err("INVALID_MODE", "Choose a supported reverse mode.");
  if (!CASES.has(textCase)) return err("INVALID_CASE", "Choose keep, upper, or lower case.");

  try {
    const reversed = reverseByMode(input, mode);
    return ok(
      textCase === "upper"
        ? reversed.toUpperCase()
        : textCase === "lower"
          ? reversed.toLowerCase()
          : reversed,
    );
  } catch {
    return err(
      "GRAPHEME_SEGMENTATION_UNAVAILABLE",
      "This environment cannot safely segment Unicode characters for reversal.",
    );
  }
}

function reverseByMode(input: string, mode: TextReverseMode): string {
  switch (mode) {
    case "characters":
      return graphemes(input).reverse().join("");
    case "word-order":
      return reverseWords(input, (word) => word);
    case "word-characters":
      return input
        .split(/(\s+)/u)
        .map((part) => (/^\s+$/u.test(part) ? part : graphemes(part).reverse().join("")))
        .join("");
    case "line-order":
      return reverseLines(input);
  }
}

function reverseWords(input: string, transformWord: (word: string) => string): string {
  const parts = input.split(/(\s+)/u);
  const words = parts.filter((part) => !/^\s+$/u.test(part)).reverse();
  let wordIndex = 0;
  return parts
    .map((part) => {
      if (/^\s+$/u.test(part)) return part;
      const next = words[wordIndex++] ?? "";
      return transformWord(next);
    })
    .join("");
}

function reverseLines(input: string): string {
  const lineEnding = input.includes("\r\n") ? "\r\n" : input.includes("\r") ? "\r" : "\n";
  const hasFinalLineEnding = /(?:\r\n|\r|\n)$/.test(input);
  const lines = input.replace(/\r\n|\r|\n/g, "\n").split("\n");
  if (hasFinalLineEnding) lines.pop();
  return lines.reverse().join(lineEnding) + (hasFinalLineEnding ? lineEnding : "");
}

function graphemes(input: string): string[] {
  const Segmenter = (
    Intl as unknown as {
      Segmenter?: new (
        locales?: string | readonly string[],
        options?: { granularity: "grapheme" },
      ) => { segment(value: string): Iterable<{ segment: string }> };
    }
  ).Segmenter;
  if (!Segmenter) throw new Error("Intl.Segmenter is unavailable");
  return Array.from(
    new Segmenter(undefined, { granularity: "grapheme" }).segment(input),
    ({ segment }) => segment,
  );
}
