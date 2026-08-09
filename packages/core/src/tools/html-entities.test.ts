import { describe, expect, it } from "vitest";
import {
  HTML_ENTITIES_MAX_INPUT_CHARS,
  decodeHtmlEntities,
  encodeHtmlEntities,
  runHtmlEntityTransform,
  type HtmlEntityMode,
} from "./html-entities";

describe("encodeHtmlEntities", () => {
  it("returns empty input unchanged", () => {
    expect(encodeHtmlEntities("")).toEqual({ ok: true, value: "" });
  });

  it("uses named escapes for HTML-significant characters by default", () => {
    expect(encodeHtmlEntities(`<p title="tea & 'cake'">✓</p>`)).toEqual({
      ok: true,
      value: "&lt;p title=&quot;tea &amp; &apos;cake&apos;&quot;&gt;✓&lt;/p&gt;",
    });
  });

  it("writes every Unicode scalar as decimal or hexadecimal on request", () => {
    expect(encodeHtmlEntities("A🍵", { format: "decimal" })).toEqual({
      ok: true,
      value: "&#65;&#127861;",
    });
    expect(encodeHtmlEntities("A🍵", { format: "hexadecimal" })).toEqual({
      ok: true,
      value: "&#x41;&#x1F375;",
    });
  });

  it("rejects malformed Unicode without replacement", () => {
    expect(encodeHtmlEntities("x\ud800").ok).toBe(false);
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes supported named, decimal, and hexadecimal entities", () => {
    expect(decodeHtmlEntities("&lt;&amp;&quot;&#169;&#x1F375;&nbsp;")).toEqual({
      ok: true,
      value: '<&"©🍵\u00a0',
    });
  });

  it("leaves ordinary ampersands without a semicolon alone", () => {
    expect(decodeHtmlEntities("research & development")).toEqual({
      ok: true,
      value: "research & development",
    });
  });

  it("rejects malformed Unicode rather than returning it unchanged", () => {
    expect(decodeHtmlEntities("x\ud800").ok).toBe(false);
  });

  it.each(["&madeup;", "&#xD800;", "&#1114112;", "&#xNOPE;"])(
    "rejects invalid entities: %s",
    (input) => {
      expect(decodeHtmlEntities(input).ok).toBe(false);
    },
  );
});

describe("runHtmlEntityTransform", () => {
  it("dispatches modes and bounds source text", () => {
    expect(runHtmlEntityTransform("decode", "&amp;")).toEqual({
      ok: true,
      value: "&",
    });
    expect(runHtmlEntityTransform("unexpected" as HtmlEntityMode, "x").ok).toBe(false);
    expect(encodeHtmlEntities("x".repeat(HTML_ENTITIES_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });
});
