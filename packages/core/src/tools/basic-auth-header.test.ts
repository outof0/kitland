import { describe, expect, it } from "vitest";
import { decodeBasicAuth, encodeBasicAuth } from "./basic-auth-header";

describe("basic auth", () => {
  it("round trips UTF-8 credentials", () => {
    const e = encodeBasicAuth("trà", "🍵");
    expect(e.ok).toBe(true);
    if (!e.ok) throw new Error("Expected Basic Auth encoding to succeed.");

    expect(decodeBasicAuth(e.value)).toEqual({
      ok: true,
      value: { username: "trà", password: "🍵" },
    });
  });
});
