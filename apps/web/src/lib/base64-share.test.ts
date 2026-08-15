import { describe, expect, it } from "vitest";
import {
  BASE64_SHARE_HASH_PREFIX,
  BASE64_SHARE_URL_MAX_LENGTH,
  createBase64ShareUrl,
  isBase64ShareHash,
  readBase64ShareState,
} from "./base64-share";

const ORIGIN = "https://kitland.dev";

describe("createBase64ShareUrl", () => {
  it("creates a fragment-only link and strips the caller's query string", () => {
    const href = `${ORIGIN}/explore/base64?campaign=tracked&token=secret`;
    const url = createBase64ShareUrl(
      { mode: "encode", format: "standard", input: "Share me ✓" },
      href,
    );
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(`${ORIGIN}/explore/base64`);
    expect(parsed.search).toBe("");
    expect(parsed.hash.startsWith(BASE64_SHARE_HASH_PREFIX)).toBe(true);
    const params = new URLSearchParams(parsed.hash.slice(BASE64_SHARE_HASH_PREFIX.length));
    expect(Object.fromEntries(params)).toEqual({
      mode: "encode",
      format: "standard",
      input: "Share me ✓",
    });
  });

  it("never places payload fields on the query string", () => {
    const url = createBase64ShareUrl(
      { mode: "decode", format: "url-safe", input: "abc+/" },
      `${ORIGIN}/explore/base64?input=should-not-leak`,
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get("input")).toBeNull();
    expect(parsed.searchParams.get("mode")).toBeNull();
    expect(parsed.hash).toContain("input=");
  });
});

describe("readBase64ShareState", () => {
  it("restores only validated fragment state", () => {
    const href = createBase64ShareUrl(
      { mode: "decode", format: "url-safe", input: "SGVsbG8=" },
      `${ORIGIN}/explore/base64`,
    );
    expect(readBase64ShareState(href)).toEqual({
      mode: "decode",
      format: "url-safe",
      input: "SGVsbG8=",
    });
  });

  it("rejects malformed mode, format, or missing input without inventing defaults", () => {
    expect(
      readBase64ShareState(`${ORIGIN}/explore/base64#base64?mode=encode&format=standard`),
    ).toBe(null);
    expect(
      readBase64ShareState(`${ORIGIN}/explore/base64#base64?mode=flip&format=standard&input=x`),
    ).toBe(null);
    expect(
      readBase64ShareState(`${ORIGIN}/explore/base64#base64?mode=encode&format=weird&input=x`),
    ).toBe(null);
    expect(
      readBase64ShareState(`${ORIGIN}/explore/base64#other?mode=encode&format=standard&input=x`),
    ).toBe(null);
  });

  it("rejects oversized share URLs so restore cannot populate the editor", () => {
    const huge = "x".repeat(BASE64_SHARE_URL_MAX_LENGTH);
    const href = `${ORIGIN}/explore/base64#base64?mode=encode&format=standard&input=${huge}`;
    expect(href.length).toBeGreaterThan(BASE64_SHARE_URL_MAX_LENGTH);
    expect(readBase64ShareState(href)).toBe(null);
  });
});

describe("isBase64ShareHash", () => {
  it("detects the tool's fragment prefix only", () => {
    expect(isBase64ShareHash("#base64?mode=encode")).toBe(true);
    expect(isBase64ShareHash("#json?input=x")).toBe(false);
    expect(isBase64ShareHash("")).toBe(false);
  });
});
