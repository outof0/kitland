import { describe, expect, it } from "vitest";
import { REGEX_TEST_MAX_INPUT_CHARS, REGEX_TEST_MAX_MATCHES, testRegex } from "./regex-tester";

describe("testRegex", () => {
  it("collects Unicode matches, code-unit offsets, captures, and named captures", () => {
    expect(testRegex("(?<letter>[A-Z])(?<digit>\\d)", "A1 🍵 B2", { flags: "u" })).toEqual({
      ok: true,
      value: {
        truncated: false,
        matches: [
          {
            value: "A1",
            index: 0,
            end: 2,
            captures: [
              { index: 1, value: "A" },
              { index: 2, value: "1" },
            ],
            namedCaptures: { letter: "A", digit: "1" },
          },
          {
            value: "B2",
            index: 6,
            end: 8,
            captures: [
              { index: 1, value: "B" },
              { index: 2, value: "2" },
            ],
            namedCaptures: { letter: "B", digit: "2" },
          },
        ],
      },
    });
  });

  it("handles zero-width matches without looping forever", () => {
    const result = testRegex("(?=a)", "aa");
    expect(result).toEqual({
      ok: true,
      value: {
        truncated: false,
        matches: [
          { value: "", index: 0, end: 0, captures: [], namedCaptures: {} },
          { value: "", index: 1, end: 1, captures: [], namedCaptures: {} },
        ],
      },
    });
  });

  it.each(["(", "[a-", "(?<name>a)(?<name>b)"])("returns invalid regex errors: %s", (pattern) => {
    expect(testRegex(pattern, "sample").ok).toBe(false);
  });

  it("bounds test text and match output", () => {
    expect(testRegex(".", "x".repeat(REGEX_TEST_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    const result = testRegex("a", "a".repeat(REGEX_TEST_MAX_MATCHES + 10));
    expect(result).toEqual({
      ok: true,
      value: { truncated: true, matches: expect.any(Array) },
    });
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.matches).toHaveLength(REGEX_TEST_MAX_MATCHES);
  });
});
