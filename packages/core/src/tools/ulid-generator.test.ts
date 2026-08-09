import { describe, expect, it } from "vitest";
import { generateUlid } from "./ulid-generator";
describe("ULID generator", () => {
  it("encodes timestamp then fixed-size entropy", () => {
    expect(generateUlid(1469918176385, () => new Uint8Array(10))).toEqual({
      ok: true,
      value: "01ARYZ6S410000000000000000",
    });
  });
  it("rejects invalid time and entropy", () => {
    expect(generateUlid(-1, () => new Uint8Array(10))).toMatchObject({
      ok: false,
      error: { code: "INVALID_TIMESTAMP" },
    });
    expect(generateUlid(1, () => new Uint8Array(9))).toMatchObject({
      ok: false,
      error: { code: "INVALID_ENTROPY" },
    });
  });
});
