import { describe, expect, it } from "vitest";
import {
  JSON_SHARE_HASH_PREFIX,
  JSON_SHARE_URL_MAX_LENGTH,
  createJsonShareUrl,
  isJsonShareHash,
  readJsonShareState,
} from "./json-share";

const ORIGIN = "https://kitland.dev";

describe("createJsonShareUrl", () => {
  it("creates a fragment-only link and strips the caller's query string", () => {
    const href = `${ORIGIN}/explore/json-formatter?utm=track&session=abc`;
    const url = createJsonShareUrl({ input: '{"a":1}' }, href);
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(`${ORIGIN}/explore/json-formatter`);
    expect(parsed.search).toBe("");
    expect(parsed.hash.startsWith(JSON_SHARE_HASH_PREFIX)).toBe(true);
    const params = new URLSearchParams(parsed.hash.slice(JSON_SHARE_HASH_PREFIX.length));
    expect(params.get("input")).toBe('{"a":1}');
  });

  it("never places the input payload on the query string", () => {
    const url = createJsonShareUrl(
      { input: "secret-payload" },
      `${ORIGIN}/explore/json-formatter?input=query-must-not-win`,
    );
    const parsed = new URL(url);
    expect(parsed.search).toBe("");
    expect(parsed.searchParams.get("input")).toBeNull();
    expect(parsed.hash).toContain("input=secret-payload");
  });
});

describe("readJsonShareState", () => {
  it("restores validated fragment input", () => {
    const href = createJsonShareUrl(
      { input: '{\n  "ok": true\n}' },
      `${ORIGIN}/explore/json-formatter`,
    );
    expect(readJsonShareState(href)).toEqual({ input: '{\n  "ok": true\n}' });
  });

  it("rejects missing input and foreign hash prefixes", () => {
    expect(readJsonShareState(`${ORIGIN}/explore/json-formatter#json?`)).toBe(null);
    expect(readJsonShareState(`${ORIGIN}/explore/json-formatter#base64?input=x`)).toBe(null);
    expect(readJsonShareState(`${ORIGIN}/explore/json-formatter`)).toBe(null);
  });

  it("rejects oversized share URLs so restore cannot populate the editor", () => {
    const huge = "x".repeat(JSON_SHARE_URL_MAX_LENGTH);
    const href = `${ORIGIN}/explore/json-formatter#json?input=${huge}`;
    expect(href.length).toBeGreaterThan(JSON_SHARE_URL_MAX_LENGTH);
    expect(readJsonShareState(href)).toBe(null);
  });
});

describe("isJsonShareHash", () => {
  it("detects the tool's fragment prefix only", () => {
    expect(isJsonShareHash("#json?input=x")).toBe(true);
    expect(isJsonShareHash("#base64?mode=encode")).toBe(false);
  });
});
