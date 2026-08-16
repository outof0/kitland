import { describe, expect, it } from "vitest";
import {
  generateMimeApacheSnippet,
  generateMimeContentTypeHeader,
  generateMimeFetchSnippet,
  generateMimeNginxSnippet,
  lookupMimeTypes,
  MIME_TYPES,
  MIME_TYPES_MAX_QUERY_CHARS,
} from "./mime-types";

describe("MIME type lookup", () => {
  it("looks up a dotted extension and preserves multiple valid mappings", () => {
    const result = lookupMimeTypes(".xml");
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        value: expect.objectContaining({ kind: "extension" }),
      }),
    );
    if (!result.ok) throw new Error("Expected MIME type lookup to succeed.");

    expect(result.value.matches.map((entry) => entry.mime)).toEqual([
      "application/xml",
      "text/xml",
    ]);
  });

  it("normalizes a MIME type with parameters", () => {
    const result = lookupMimeTypes(" IMAGE/SVG+XML ; charset=utf-8 ");
    expect(result.ok && result.value.matches[0]).toMatchObject({
      mime: "image/svg+xml",
      extensions: ["svg", "svgz"],
      type: "image",
      subtype: "svg+xml",
    });
  });

  it("accepts a filename and can return no matches without treating it as invalid", () => {
    const found = lookupMimeTypes("release.webmanifest");
    const missing = lookupMimeTypes("unknown-extension");
    expect(found.ok && found.value.matches[0]?.mime).toBe("application/manifest+json");
    expect(missing).toEqual(
      expect.objectContaining({
        ok: true,
        value: { query: "unknown-extension", kind: "search", matches: [] },
      }),
    );
  });

  it("rejects missing and oversized input", () => {
    const empty = lookupMimeTypes(" ");
    const long = lookupMimeTypes("x".repeat(MIME_TYPES_MAX_QUERY_CHARS + 1));
    expect(empty.ok ? null : empty.error.code).toBe("EMPTY_INPUT");
    expect(long.ok ? null : long.error.code).toBe("INPUT_TOO_LONG");
  });

  it("keeps the local registry structurally valid", () => {
    expect(MIME_TYPES.length).toBeGreaterThanOrEqual(100);
    expect(MIME_TYPES.every((entry) => entry.mime === `${entry.type}/${entry.subtype}`)).toBe(true);
    expect(
      MIME_TYPES.every((entry) =>
        entry.extensions.every((extension) => !extension.startsWith(".")),
      ),
    ).toBe(true);
    const categories = new Set(MIME_TYPES.map((entry) => entry.category));
    expect(categories).toEqual(
      new Set(["application", "text", "image", "audio", "video", "font", "model", "multipart"]),
    );
  });

  it("generates correct snippets for headers, nginx, apache, and fetch", () => {
    const jsonEntry = MIME_TYPES.find((m) => m.mime === "application/json")!;
    expect(generateMimeContentTypeHeader(jsonEntry)).toBe(
      "Content-Type: application/json; charset=utf-8",
    );
    expect(generateMimeNginxSnippet(jsonEntry)).toContain("application/json json map;");
    expect(generateMimeApacheSnippet(jsonEntry)).toBe(
      "# Apache .htaccess / httpd.conf\nAddType application/json .json .map",
    );
    expect(generateMimeFetchSnippet(jsonEntry)).toContain('"Content-Type": "application/json; charset=utf-8"');

    const octetEntry = MIME_TYPES.find((m) => m.mime === "application/octet-stream")!;
    expect(generateMimeContentTypeHeader(octetEntry)).toBe("Content-Type: application/octet-stream");
    expect(generateMimeFetchSnippet(octetEntry)).toContain('"Content-Type": "application/octet-stream"');
  });
});

