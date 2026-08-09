import { base64Adapter } from "../../src/adapters/base64";
import { hasOverlappingRanges, transformSelectedValues } from "../../src/selectionTransform";

describe("selection transformations", () => {
  it("encodes every selection through the registered adapter", () => {
    const result = transformSelectedValues(base64Adapter, "encode", "standard", ["hello", "✓"]);

    expect(result).toEqual({ ok: true, value: ["aGVsbG8=", "4pyT"] });
  });

  it("aborts the whole batch when one selection is invalid", () => {
    const result = transformSelectedValues(base64Adapter, "decode", "standard", [
      "aGVsbG8=",
      "not base64",
    ]);

    expect(result).toMatchObject({ ok: false, error: { code: "INVALID_BASE64" } });
  });

  it("rejects empty and oversized selections before execution", () => {
    expect(transformSelectedValues(base64Adapter, "encode", "standard", [""]).ok).toBe(false);
    expect(
      transformSelectedValues(base64Adapter, "encode", "standard", [
        "x".repeat(base64Adapter.maxSelectionChars + 1),
      ]).ok,
    ).toBe(false);
  });

  it("detects overlap but permits adjacent ranges", () => {
    expect(
      hasOverlappingRanges([
        { start: 0, end: 5 },
        { start: 4, end: 8 },
      ]),
    ).toBe(true);
    expect(
      hasOverlappingRanges([
        { start: 0, end: 5 },
        { start: 5, end: 8 },
      ]),
    ).toBe(false);
  });
});
