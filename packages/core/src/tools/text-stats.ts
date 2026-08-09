import { err, ok, type ToolResult } from "../result";

export const TEXT_STATS_MAX_INPUT_CHARS = 2_000_000;

export type TextStats = {
  /** User-perceived characters, segmented with the host's Unicode Segmenter. */
  graphemes: number;
  /** Unicode scalar values; an emoji can consume two UTF-16 code units but one code point. */
  codePoints: number;
  /** Unicode word-like segments (letters and numbers, not punctuation). */
  words: number;
  /** Logical lines; empty input has zero lines. */
  lines: number;
  charactersWithWhitespace: number;
  charactersWithoutWhitespace: number;
  utf8Bytes: number;
};

const ENCODER = new TextEncoder();

/** Measure well-formed Unicode text without normalizing or uploading it. */
export function getTextStats(input: string): ToolResult<TextStats> {
  const checked = validateUnicodeText(input);
  if (!checked.ok) return checked;

  const charactersWithWhitespace = input.length;
  const codePoints = countCodePoints(input);
  const segmenter = getSegmenter();
  const graphemes = segmenter ? countSegments(segmenter, input) : codePoints;
  const words = segmenter ? countWords(input) : countFallbackWords(input);

  return ok({
    graphemes,
    codePoints,
    words,
    lines: countLines(input),
    charactersWithWhitespace,
    charactersWithoutWhitespace: input.replace(/\s/gu, "").length,
    utf8Bytes: ENCODER.encode(input).length,
  });
}

function getSegmenter(): Intl.Segmenter | null {
  if (typeof Intl.Segmenter !== "function") return null;
  return new Intl.Segmenter(undefined, { granularity: "grapheme" });
}

function countSegments(segmenter: Intl.Segmenter, input: string): number {
  let count = 0;
  for (const _segment of segmenter.segment(input)) count += 1;
  return count;
}

function countWords(input: string): number {
  const wordSegmenter = new Intl.Segmenter(undefined, { granularity: "word" });
  let count = 0;
  for (const segment of wordSegmenter.segment(input)) {
    if (segment.isWordLike) count += 1;
  }
  return count;
}

function countFallbackWords(input: string): number {
  return input.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu)?.length ?? 0;
}

function countCodePoints(input: string): number {
  let count = 0;
  for (const _character of input) count += 1;
  return count;
}

function countLines(input: string): number {
  if (!input) return 0;

  let lines = 1;
  for (let index = 0; index < input.length; index += 1) {
    const unit = input.charCodeAt(index);
    if (unit === 10) {
      lines += 1;
    } else if (unit === 13) {
      lines += 1;
      if (input.charCodeAt(index + 1) === 10) index += 1;
    }
  }
  return lines;
}

function validateUnicodeText(input: string): ToolResult<string> {
  if (input.length > TEXT_STATS_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Text input exceeds ${TEXT_STATS_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  for (let index = 0; index < input.length; index += 1) {
    const unit = input.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = input.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        index += 1;
        continue;
      }
      return err("INVALID_UNICODE", "Text contains an unpaired Unicode surrogate.");
    }
    if (unit >= 0xdc00 && unit <= 0xdfff) {
      return err("INVALID_UNICODE", "Text contains an unpaired Unicode surrogate.");
    }
  }
  return ok(input);
}
