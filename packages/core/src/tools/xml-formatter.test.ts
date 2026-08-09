import { describe, expect, it } from "vitest";
import { formatXml, XML_FORMATTER_MAX_INPUT_CHARS } from "./xml-formatter";

describe("formatXml", () => {
  it("formats nested XML and preserves Unicode text content", () => {
    expect(formatXml('<root><title>café 🍵</title><item id="1"/></root>')).toEqual({
      ok: true,
      value: {
        output: '<root>\n  <title>café 🍵</title>\n  <item id="1"/>\n</root>\n',
        elementCount: 3,
        maxDepth: 2,
      },
    });
  });

  it("preserves mixed content inline instead of changing its text semantics", () => {
    expect(formatXml("<p>Hello <strong>world</strong>!</p>")).toMatchObject({
      ok: true,
      value: { output: "<p>Hello <strong>world</strong>!</p>\n" },
    });
  });

  it("rejects malformed markup, entity mistakes, DOCTYPE and oversized input", () => {
    expect(formatXml("<a><b></a>")).toMatchObject({ ok: false, error: { code: "INVALID_XML" } });
    expect(formatXml("<a>Fish & chips</a>")).toMatchObject({
      ok: false,
      error: { code: "INVALID_XML" },
    });
    expect(formatXml("<!DOCTYPE a><a/>")).toMatchObject({
      ok: false,
      error: { code: "UNSUPPORTED_XML" },
    });
    expect(formatXml("<a>" + "x".repeat(XML_FORMATTER_MAX_INPUT_CHARS) + "</a>")).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });
});
