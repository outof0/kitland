import { describe, expect, it } from "vitest";
import { parseUnixTimestamp } from "./unix-timestamp";
describe("unix timestamp", () => {
  it("normalizes seconds", () =>
    expect(parseUnixTimestamp("0")).toEqual({
      ok: true,
      value: { seconds: "0", milliseconds: "0", iso: "1970-01-01T00:00:00.000Z" },
    }));
  it("rejects invalid input", () =>
    expect(parseUnixTimestamp("today")).toMatchObject({ ok: false }));
});
