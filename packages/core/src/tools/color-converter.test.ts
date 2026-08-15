import { describe, expect, it } from "vitest";
import { convertColor } from "./color-converter";

describe("convertColor", () => {
  it("parses hex white", () => {
    expect(convertColor("#fff")).toEqual({
      ok: true,
      value: {
        hex: "#ffffff",
        rgb: "rgb(255, 255, 255)",
        hsl: "hsl(0, 0%, 100%)",
        r: 255,
        g: 255,
        b: 255,
      },
    });
  });
  it("rejects invalid colors", () => {
    expect(convertColor("nope").ok).toBe(false);
    expect(convertColor("").ok).toBe(false);
  });
});
