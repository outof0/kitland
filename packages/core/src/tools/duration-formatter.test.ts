import { describe, expect, it } from "vitest";
import { formatDurationSeconds } from "./duration-formatter";

describe("formatDurationSeconds", () => {
  it("formats 3661 seconds", () => {
    expect(formatDurationSeconds("3661")).toEqual({
      ok: true,
      value: { seconds: 3661, formatted: "1h 1m 1s" },
    });
  });
  it("rejects empty", () => {
    expect(formatDurationSeconds("").ok).toBe(false);
  });
});
