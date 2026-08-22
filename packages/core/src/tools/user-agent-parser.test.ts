import { describe, expect, it } from "vitest";
import { parseUserAgent, USER_AGENT_MAX_INPUT_CHARS } from "./user-agent-parser";

describe("parseUserAgent", () => {
  it("identifies a desktop Chrome client", () => {
    const result = parseUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    expect(result).toEqual({
      ok: true,
      value: {
        browser: { name: "Chrome", version: "120.0.0.0" },
        engine: { name: "Blink", version: "537.36" },
        os: { name: "macOS", version: "10.15.7" },
        device: { type: "desktop", vendor: null, model: null },
      },
    });
  });

  it("gives product-specific browser tokens priority over Chrome", () => {
    expect(
      parseUserAgent(
        "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36 EdgA/122.0.2365.80",
      ),
    ).toMatchObject({
      ok: true,
      value: {
        browser: { name: "Edge", version: "122.0.2365.80" },
        engine: { name: "Blink" },
        os: { name: "Android", version: "14" },
        device: { type: "mobile", vendor: "Samsung", model: "SM-S921B" },
      },
    });
  });

  it("identifies Safari and iPad separately from desktop WebKit", () => {
    expect(
      parseUserAgent(
        "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      ),
    ).toMatchObject({
      ok: true,
      value: {
        browser: { name: "Safari", version: "17.4" },
        engine: { name: "WebKit", version: "605.1.15" },
        os: { name: "iOS", version: "17.4" },
        device: { type: "tablet", vendor: "Apple", model: "iPad" },
      },
    });
  });

  it("does not claim bots are browsers", () => {
    expect(
      parseUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
    ).toEqual({
      ok: true,
      value: {
        browser: { name: "Googlebot", version: "2.1" },
        engine: { name: "Unknown", version: null },
        os: { name: "Unknown", version: null },
        device: { type: "bot", vendor: null, model: null },
      },
    });
  });

  it("handles reduced Windows UA tokens without inventing a model", () => {
    expect(
      parseUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
      ),
    ).toMatchObject({
      ok: true,
      value: {
        os: { name: "Windows 10/11", version: "10.0" },
        device: { type: "desktop", vendor: null, model: null },
      },
    });
  });

  it("rejects unsafe and oversized input", () => {
    expect(parseUserAgent("\u0000bad")).toMatchObject({
      ok: false,
      error: { code: "INVALID_USER_AGENT" },
    });
    expect(parseUserAgent(" ")).toMatchObject({ ok: false, error: { code: "EMPTY_USER_AGENT" } });
    expect(parseUserAgent("x".repeat(USER_AGENT_MAX_INPUT_CHARS + 1))).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
    expect(parseUserAgent("Mozilla/5.0\nChrome/120.0.0.0")).toMatchObject({ ok: true });
  });
});
