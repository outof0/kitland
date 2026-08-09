import { err, ok, type ToolResult } from "../result";

export const REGEX_TEST_MAX_PATTERN_CHARS = 5_000;
export const REGEX_TEST_MAX_INPUT_CHARS = 100_000;
export const REGEX_TEST_MAX_MATCHES = 1_000;

export type RegexTestOptions = { flags?: string };
export type RegexCapture = { index: number; value: string | null };
export type RegexMatch = {
  value: string;
  index: number;
  end: number;
  captures: readonly RegexCapture[];
  namedCaptures: Readonly<Record<string, string | null>>;
};
export type RegexTestResult = {
  matches: readonly RegexMatch[];
  truncated: boolean;
};

/**
 * Test a JavaScript regular expression and collect bounded match detail.
 * Hosts should run user-provided patterns in a cancellable worker: some valid
 * patterns can consume excessive CPU despite these size and match limits.
 */
export function testRegex(
  pattern: string,
  input: string,
  options: RegexTestOptions = {},
): ToolResult<RegexTestResult> {
  if (pattern.length > REGEX_TEST_MAX_PATTERN_CHARS) {
    return err(
      "PATTERN_TOO_LARGE",
      `Regular expression exceeds ${REGEX_TEST_MAX_PATTERN_CHARS.toLocaleString()} characters.`,
    );
  }
  if (input.length > REGEX_TEST_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Test text exceeds ${REGEX_TEST_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  let expression: RegExp;
  try {
    expression = new RegExp(pattern, withGlobalFlag(options.flags ?? ""));
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Invalid regular expression.";
    return err("INVALID_REGEX", message);
  }

  const matches: RegexMatch[] = [];
  while (matches.length < REGEX_TEST_MAX_MATCHES) {
    const match = expression.exec(input);
    if (!match) return ok({ matches, truncated: false });

    matches.push({
      value: match[0] ?? "",
      index: match.index,
      end: match.index + (match[0]?.length ?? 0),
      captures: match.slice(1).map((value, index) => ({ index: index + 1, value: value ?? null })),
      namedCaptures: match.groups ? { ...match.groups } : {},
    });

    if (match[0] === "") {
      expression.lastIndex = advanceStringIndex(input, expression.lastIndex, expression.unicode);
    }
  }
  return ok({ matches, truncated: true });
}

function withGlobalFlag(flags: string): string {
  return flags.includes("g") ? flags : `${flags}g`;
}

function advanceStringIndex(input: string, index: number, unicode: boolean): number {
  if (!unicode) return index + 1;
  const first = input.charCodeAt(index);
  const second = input.charCodeAt(index + 1);
  if (first >= 0xd800 && first <= 0xdbff && second >= 0xdc00 && second <= 0xdfff) return index + 2;
  return index + 1;
}
