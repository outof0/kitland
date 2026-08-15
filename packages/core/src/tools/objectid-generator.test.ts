import { describe, expect, it } from "vitest";
import { generateObjectId } from "./objectid-generator";
describe("ObjectID generator", () => {
  it("writes timestamp, entropy and counter in big-endian bytes", () =>
    expect(generateObjectId(1, 2, () => Uint8Array.from([3, 4, 5, 6, 7]))).toEqual({
      ok: true,
      value: { value: "000000010304050607000002", timestamp: new Date(1000), counter: 2 },
    }));
  it("rejects unsafe host input", () =>
    expect(generateObjectId(-1, 0, () => new Uint8Array(5))).toMatchObject({
      ok: false,
      error: { code: "INVALID_TIMESTAMP" },
    }));
});
