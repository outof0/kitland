import { describe, expect, it } from "vitest";
import { generateToken } from "./token-generator";
describe("generateToken", () => {
  it("formats exact requested lengths", () => {
    const r = generateToken(5, "hex", (n) => new Uint8Array(n).fill(15));
    expect(r).toEqual({ ok: true, value: "0f0f0" });
    expect(generateToken(8, "base64url", (n) => new Uint8Array(n).fill(255))).toMatchObject({
      ok: true,
      value: "________",
    });
  });
});
