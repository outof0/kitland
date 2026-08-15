import { describe, expect, it } from "vitest";
import { convertTimezone } from "./timezone-converter";

describe("convertTimezone", () => {
  it("converts Tokyo wall time toward UTC", () => {
    const result = convertTimezone("2024-01-01T09:00:00", "Asia/Tokyo", "UTC");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.targetIso).toBe("2024-01-01T00:00:00");
  });
  it("rejects unsupported zones", () => {
    expect(convertTimezone("2024-01-01T00:00", "UTC", "Mars/Phobos").ok).toBe(false);
  });
});
