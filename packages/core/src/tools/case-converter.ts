import { err, ok, type ToolResult } from "../result";

/** Live web transformation cap; adapters enforce the same host-neutral bound. */
export const CASE_CONVERTER_MAX_INPUT_CHARS = 200_000;

export type CaseFormat = "camel" | "pascal" | "snake" | "kebab" | "constant" | "title" | "sentence";

const CASE_FORMATS = new Set<CaseFormat>([
  "camel",
  "pascal",
  "snake",
  "kebab",
  "constant",
  "title",
  "sentence",
]);

/** Convert separated or mixed-case Unicode text into a common naming convention. */
export function convertCase(input: string, format: CaseFormat): ToolResult<string> {
  if (input.length > CASE_CONVERTER_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Text input exceeds ${CASE_CONVERTER_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }
  if (!CASE_FORMATS.has(format)) {
    return err("INVALID_FORMAT", "Choose a supported case format.");
  }

  const words = toWords(input);
  if (words.length === 0) return ok("");

  const lowerWords = words.map((word) => word.toLowerCase());
  switch (format) {
    case "camel":
      return ok(lowerWords[0] + lowerWords.slice(1).map(upperFirst).join(""));
    case "pascal":
      return ok(lowerWords.map(upperFirst).join(""));
    case "snake":
      return ok(lowerWords.join("_"));
    case "kebab":
      return ok(lowerWords.join("-"));
    case "constant":
      return ok(lowerWords.join("_").toUpperCase());
    case "title":
      return ok(lowerWords.map(upperFirst).join(" "));
    case "sentence":
      return ok(upperFirst(lowerWords.join(" ")));
  }
}

function toWords(input: string): string[] {
  const segments = Array.from(input);
  const words: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) words.push(current.join(""));
    current = [];
  };

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index] ?? "";
    const isLetterOrNumber = /[\p{L}\p{N}]/u.test(segment);
    const isMark = /\p{M}/u.test(segment);
    if (!isLetterOrNumber && !(isMark && current.length > 0)) {
      flush();
      continue;
    }

    // A combining mark belongs to the preceding grapheme/word. It cannot by
    // itself start a word or form a camel-case boundary.
    if (!isLetterOrNumber) {
      current.push(segment);
      continue;
    }

    const previous = lastLetterOrNumber(current);
    const next = nextLetterOrNumber(segments, index + 1);
    if (
      previous &&
      ((isLower(previous) && isUpper(segment)) ||
        (isUpper(previous) && isUpper(segment) && next !== undefined && isLower(next)))
    ) {
      flush();
    }
    current.push(segment);
  }
  flush();

  return words;
}

function lastLetterOrNumber(values: readonly string[]): string | undefined {
  for (let index = values.length - 1; index >= 0; index--) {
    const value = values[index] ?? "";
    if (/[\p{L}\p{N}]/u.test(value)) return value;
  }
  return undefined;
}

function nextLetterOrNumber(values: readonly string[], start: number): string | undefined {
  for (let index = start; index < values.length; index++) {
    const value = values[index] ?? "";
    if (/[\p{L}\p{N}]/u.test(value)) return value;
    if (!/\p{M}/u.test(value)) return undefined;
  }
  return undefined;
}

function isLower(value: string): boolean {
  return /^\p{Ll}/u.test(value);
}

function isUpper(value: string): boolean {
  return /^\p{Lu}/u.test(value);
}

function upperFirst(value: string): string {
  const firstCodePoint = value.codePointAt(0);
  if (firstCodePoint === undefined) return value;
  const first = String.fromCodePoint(firstCodePoint);
  return first.toUpperCase() + value.slice(first.length);
}
