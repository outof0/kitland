import { describe, expect, it } from "vitest";
import { JSON_DIFF_MAX_INPUT_CHARS, diffJson, type JsonDiffResult } from "./json-diff";

function expectResult(left: string, right: string): JsonDiffResult {
  const result = diffJson(left, right);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

describe("diffJson", () => {
  it("ignores whitespace and object property order", () => {
    expect(expectResult('{"b":2,"a":1}', '{\n  "a": 1, "b": 2\n}')).toEqual({
      entries: [],
      summary: { added: 0, removed: 0, changed: 0, total: 0 },
    });
  });

  it("reports sorted object changes using JSON Pointer paths", () => {
    expect(
      expectResult(
        '{"z":0,"item":{"name":"old","remove":true}}',
        '{"a":1,"item":{"name":"new","add":false}}',
      ),
    ).toEqual({
      entries: [
        { path: "/a", operation: "added", after: 1 },
        { path: "/item/add", operation: "added", after: false },
        { path: "/item/name", operation: "changed", before: "old", after: "new" },
        { path: "/item/remove", operation: "removed", before: true },
        { path: "/z", operation: "removed", before: 0 },
      ],
      summary: { added: 2, removed: 2, changed: 1, total: 5 },
    });
  });

  it("diffs arrays by index and marks appended and removed values", () => {
    expect(expectResult('["same", 1, 2]', '["same", 3, 2, 4]')).toEqual({
      entries: [
        { path: "/1", operation: "changed", before: 1, after: 3 },
        { path: "/3", operation: "added", after: 4 },
      ],
      summary: { added: 1, removed: 0, changed: 1, total: 2 },
    });
  });

  it("escapes JSON Pointer tokens", () => {
    const result = expectResult('{"a/b":{"~key":1}}', '{"a/b":{"~key":2}}');
    expect(result.entries).toEqual([
      { path: "/a~1b/~0key", operation: "changed", before: 1, after: 2 },
    ]);
  });

  it("treats a type change at the root as one changed entry", () => {
    expect(expectResult("[]", "{}").entries).toEqual([
      { path: "", operation: "changed", before: [], after: {} },
    ]);
  });

  it("identifies which input has invalid JSON", () => {
    const left = diffJson("{", "{}");
    const leftError = expectError(left);
    expect(leftError.code).toBe("LEFT_INVALID_JSON");
    expect(leftError.message).toContain("Left JSON");

    const right = diffJson("{}", "{");
    const rightError = expectError(right);
    expect(rightError.code).toBe("RIGHT_INVALID_JSON");
    expect(rightError.message).toContain("Right JSON");
  });

  it("bounds each source before parsing", () => {
    const tooLarge = `${" ".repeat(JSON_DIFF_MAX_INPUT_CHARS)}0`;
    const result = diffJson(tooLarge, "0");
    expect(result).toMatchObject({ ok: false, error: { code: "LEFT_INPUT_TOO_LARGE" } });
  });
});

function expectError(result: ReturnType<typeof diffJson>) {
  if (result.ok) throw new Error("Expected a failed result.");
  return result.error;
}
