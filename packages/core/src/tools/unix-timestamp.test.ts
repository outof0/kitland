import { describe, expect, it } from "vitest";
import { parseUnixTimestamp } from "./unix-timestamp";
describe("unix timestamp", () => {
  it("normalizes seconds", () =>
    expect(parseUnixTimestamp("0")).toEqual({
      ok: true,
      value: { seconds: "0", milliseconds: "0", iso: "1970-01-01T00:00:00.000Z" },
    }));
  it("auto-detects contemporary milliseconds and microseconds", () => {
    expect(parseUnixTimestamp("1786695783")).toEqual({
      ok: true,
      value: {
        seconds: "1786695783",
        milliseconds: "1786695783000",
        iso: "2026-08-14T08:23:03.000Z",
      },
    });
    expect(parseUnixTimestamp("1786695783000")).toEqual({
      ok: true,
      value: {
        seconds: "1786695783",
        milliseconds: "1786695783000",
        iso: "2026-08-14T08:23:03.000Z",
      },
    });
    expect(parseUnixTimestamp("1786695783000000")).toEqual({
      ok: true,
      value: {
        seconds: "1786695783",
        milliseconds: "1786695783000",
        iso: "2026-08-14T08:23:03.000Z",
      },
    });
  });
  it("honors an explicit unit for early timestamps", () => {
    expect(parseUnixTimestamp("86400000", { unit: "ms" })).toEqual({
      ok: true,
      value: { seconds: "86400", milliseconds: "86400000", iso: "1970-01-02T00:00:00.000Z" },
    });
    expect(parseUnixTimestamp("86400000000", { unit: "us" })).toEqual({
      ok: true,
      value: { seconds: "86400", milliseconds: "86400000", iso: "1970-01-02T00:00:00.000Z" },
    });
  });
  it("preserves nanosecond inputs without Number precision loss before conversion", () => {
    expect(parseUnixTimestamp("1000000000000000001", { unit: "ns" })).toEqual({
      ok: true,
      value: {
        seconds: "1000000000",
        milliseconds: "1000000000000",
        iso: "2001-09-09T01:46:40.000Z",
      },
    });
  });
  it("rejects invalid input", () =>
    expect(parseUnixTimestamp("today")).toMatchObject({ ok: false }));
});
