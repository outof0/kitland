import { base64Adapter } from "../../src/adapters/base64";
import { curlConverterAdapter } from "../../src/adapters/curl-converter";
import { hasOverlappingRanges, transformSelectedValues } from "../../src/selectionTransform";

describe("selection transformations", () => {
  it("encodes every selection through the registered adapter", async () => {
    const result = await transformSelectedValues(base64Adapter, "encode", "standard", [
      "hello",
      "✓",
    ]);

    expect(result).toEqual({ ok: true, value: ["aGVsbG8=", "4pyT"] });
  });

  it("aborts the whole batch when one selection is invalid", async () => {
    const result = await transformSelectedValues(base64Adapter, "decode", "standard", [
      "aGVsbG8=",
      "not base64",
    ]);

    expect(result).toMatchObject({ ok: false, error: { code: "INVALID_BASE64" } });
  });

  it("rejects empty and oversized selections before execution", async () => {
    expect((await transformSelectedValues(base64Adapter, "encode", "standard", [""])).ok).toBe(
      false,
    );
    expect(
      (
        await transformSelectedValues(base64Adapter, "encode", "standard", [
          "x".repeat(base64Adapter.maxSelectionChars + 1),
        ])
      ).ok,
    ).toBe(false);
  });

  it("converts every valid cURL selection atomically and rejects an invalid batch", async () => {
    const valid = await transformSelectedValues(curlConverterAdapter, "convert", "fetch", [
      "curl https://one.test",
      "curl -X custom https://two.test",
    ]);
    expect(valid.ok).toBe(true);
    if (!valid.ok) throw new Error("Expected valid cURL selections to transform.");
    expect(valid.value[0]).toContain('fetch("https://one.test"');
    expect(valid.value[1]).toContain('method: "CUSTOM"');
    expect(
      (
        await transformSelectedValues(curlConverterAdapter, "convert", "fetch", [
          "curl https://ok.test",
          "not a curl command",
        ])
      ).ok,
    ).toBe(false);
  });

  it("detects overlapping ranges", () => {
    expect(
      hasOverlappingRanges([
        { start: 0, end: 3 },
        { start: 2, end: 5 },
      ]),
    ).toBe(true);
    expect(
      hasOverlappingRanges([
        { start: 0, end: 3 },
        { start: 3, end: 5 },
      ]),
    ).toBe(false);
  });
});
