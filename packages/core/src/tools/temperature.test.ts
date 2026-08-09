import { describe, expect, it } from "vitest";
import { convertTemperature } from "./temperature";

describe("convertTemperature", () => {
  it("converts boiling water from C", () => {
    expect(convertTemperature("100", "C")).toEqual({
      ok: true,
      value: { celsius: 100, fahrenheit: 212, kelvin: 373.15 },
    });
  });
  it("rejects below absolute zero and empty", () => {
    expect(convertTemperature("-500", "C").ok).toBe(false);
    expect(convertTemperature("", "C").ok).toBe(false);
  });
});
