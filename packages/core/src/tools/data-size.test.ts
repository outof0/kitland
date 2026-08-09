import { describe, expect, it } from "vitest";
import { convertDataSize } from "./data-size";

describe("convertDataSize", () => {
  it("converts 1 KiB to 1024 bytes", () => {
    const result = convertDataSize("1", "KiB");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.bytes).toBe(1024);
  });
  it("rejects empty and negative", () => {
    expect(convertDataSize("", "MB").ok).toBe(false);
    expect(convertDataSize("-1", "MB").ok).toBe(false);
  });
});
