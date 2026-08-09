import { describe, expect, it } from "vitest";
import { decodeBasicAuth, encodeBasicAuth } from "./basic-auth-header";
describe("basic auth", () =>
  it("round trips UTF-8 credentials", () => {
    const e = encodeBasicAuth("trà", "🍵");
    expect(e.ok).toBe(true);
    if (e.ok)
      expect(decodeBasicAuth(e.value)).toEqual({
        ok: true,
        value: { username: "trà", password: "🍵" },
      });
  }));
