import { describe, expect, it } from "vitest";
import { inflateRawSync, deflateRawSync } from "node:zlib";
import {
  DRAWIO_TEXT_MAX_INPUT_CHARS,
  DRAWIO_TEXT_SPEC,
  deflateRawBytes,
  drawioDecode,
  drawioEncode,
  escapeText,
  extractDiagramContent,
  inflateRawBytes,
  normalizeXmlText,
  removeLinebreaks,
  runDrawioText,
  toJsVariable,
  unescapeText,
} from "./drawio-text";

const GRAPH_XML =
  `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>` +
  `<mxCell id="2" value="Hello" vertex="1" parent="1">` +
  `<mxGeometry x="20" y="20" width="80" height="30" as="geometry"/></mxCell></root></mxGraphModel>`;

// Golden vector produced the way draw.io does it:
// base64(deflateRaw(encodeURIComponent(xml))) via node zlib (pako-equivalent).
const GRAPH_PAYLOAD =
  "jZCxDsIwDES/xntwFvZAy8JHRIrVRHJIFQKkf18pMVQdKrH53unOskGbWMdsZ39Pjhj0FbTJKZU+xWqIGVAFB/oCiAoQAYcD99RcNdtMj/JPAHvgbflFndyIOQmlXKgeNjcktSOlSCUvgEoCslgte/kJrviOzoI8hclLpxZmn11Pv97tCMBB7vjK7V/N271zBQ==";
const UNICODE_PAYLOAD = "81B1NlZ1tMzJyVc1MlB1M1C1dFO1cFF1MgUA";
const UNICODE_TEXT = "Héllo 🍵";

function mustOk(result: { ok: boolean; value?: string; error?: { message: string } }): string {
  if (!result.ok) throw new Error(`expected ok, got error: ${result.error?.message}`);
  return result.value as string;
}

function mustErr(result: { ok: boolean; error?: { code: string } }): string {
  if (result.ok) throw new Error("expected error result, got ok");
  return result.error?.code ?? "<missing code>";
}

describe("drawio pipeline", () => {
  it("decodes a real draw.io payload produced by pako-style deflate", async () => {
    expect(mustOk(await drawioDecode(GRAPH_PAYLOAD))).toBe(GRAPH_XML);
  });

  it("decodes unicode payloads", async () => {
    expect(mustOk(await drawioDecode(UNICODE_PAYLOAD))).toBe(UNICODE_TEXT);
  });

  it("encodes to bytes that node zlib can inflate (draw.io byte layout)", async () => {
    const encoded = mustOk(await drawioEncode(GRAPH_XML));
    const bytes = Buffer.from(encoded, "base64");
    const inflated = inflateRawSync(bytes).toString("utf8");
    expect(decodeURIComponent(inflated)).toBe(GRAPH_XML);
  });

  it("round-trips text through encode then decode", async () => {
    for (const text of ["hello world", UNICODE_TEXT, "<a>&\"'</a>", "line1\nline2", ""]) {
      const encoded = mustOk(await drawioEncode(text));
      expect(mustOk(await drawioDecode(encoded))).toBe(text);
    }
  });

  it("decodes a whole mxfile document by extracting the diagram payload", async () => {
    const doc = `<mxfile host="app.diagrams.net"><diagram name="Page-1" id="x">${GRAPH_PAYLOAD}</diagram></mxfile>`;
    expect(mustOk(await drawioDecode(doc))).toBe(GRAPH_XML);
  });

  it("rejects invalid base64", async () => {
    expect(mustErr(await drawioDecode("!!! not base64 !!!"))).toBe("INVALID_BASE64");
  });

  it("rejects corrupt deflate streams", async () => {
    const notDeflate = Buffer.from("this is not deflated data at all....").toString("base64");
    expect(mustErr(await drawioDecode(notDeflate))).toBe("DECOMPRESS_FAILED");
  });

  it("supports toggling pipeline stages", async () => {
    // base64 only
    const b64 = mustOk(await drawioEncode("hi", { urlEncode: false, deflate: false }));
    expect(b64).toBe("aGk=");
    expect(mustOk(await drawioDecode(b64, { urlDecode: false, inflate: false }))).toBe("hi");
    // url-encode only
    expect(mustOk(await drawioEncode("a b", { deflate: false, base64: false }))).toBe("a%20b");
  });
});

describe("raw deflate interop", () => {
  it("deflateRawBytes output inflates with node zlib", async () => {
    const compressed = await deflateRawBytes(new TextEncoder().encode("hello draw.io"));
    expect(inflateRawSync(compressed).toString("utf8")).toBe("hello draw.io");
  });

  it("inflateRawBytes handles node zlib output", async () => {
    const compressed = deflateRawSync(Buffer.from("zlib interop", "utf8"));
    const out = await inflateRawBytes(new Uint8Array(compressed));
    expect(new TextDecoder().decode(out)).toBe("zlib interop");
  });
});

describe("extractDiagramContent", () => {
  it("extracts the first diagram payload", () => {
    expect(
      extractDiagramContent(`<mxfile><diagram id="a">${GRAPH_PAYLOAD}</diagram></mxfile>`),
    ).toBe(GRAPH_PAYLOAD);
  });

  it("returns null for non-mxfile input", () => {
    expect(extractDiagramContent(GRAPH_PAYLOAD)).toBeNull();
    expect(extractDiagramContent("<root><diagram>x</diagram></root>")).toBeNull();
  });
});

describe("individual operations", () => {
  it("url-encode / url-decode", async () => {
    expect(mustOk(await runDrawioText("url-encode", "a/b?c=d&e=f"))).toBe("a%2Fb%3Fc%3Dd%26e%3Df");
    expect(mustOk(await runDrawioText("url-decode", "a%2Fb"))).toBe("a/b");
  });

  it("base64-encode / base64-decode handle UTF-8", async () => {
    const encoded = mustOk(await runDrawioText("base64-encode", UNICODE_TEXT));
    expect(mustOk(await runDrawioText("base64-decode", encoded))).toBe(UNICODE_TEXT);
  });

  it("deflate / inflate round-trip through the binary-string form", async () => {
    const deflated = mustOk(await runDrawioText("deflate", "compress me"));
    expect(deflated).not.toBe("compress me");
    expect(mustOk(await runDrawioText("inflate", deflated))).toBe("compress me");
  });

  it("inflate rejects non-latin1 input", async () => {
    expect(mustErr(await runDrawioText("inflate", "🍵"))).toBe("INVALID_BINARY_TEXT");
  });

  it("escape / unescape match escape() semantics", async () => {
    expect(mustOk(await runDrawioText("escape", "a b+c@d"))).toBe("a%20b+c@d");
    expect(mustOk(await runDrawioText("escape", "🍵"))).toBe("%uD83C%uDF75");
    expect(mustOk(await runDrawioText("unescape", "a%20b+c@d"))).toBe("a b+c@d");
    expect(mustOk(await runDrawioText("unescape", "%uD83C%uDF75"))).toBe("🍵");
    expect(mustOk(escapeText(""))).toBe("");
    expect(mustOk(unescapeText(""))).toBe("");
  });

  it("remove-linebreaks strips all line break forms", async () => {
    expect(mustOk(await runDrawioText("remove-linebreaks", "a\r\nb\nc\rd"))).toBe("abcd");
    expect(mustOk(removeLinebreaks(""))).toBe("");
  });

  it("js-variable wraps lines as concatenated literals", async () => {
    expect(mustOk(await runDrawioText("js-variable", "a'b\\c\nd"))).toBe(
      "'a\\'b\\\\c\\n' +\n'd\\n'",
    );
    expect(mustOk(toJsVariable(""))).toBe("");
  });

  it("format-xml pretty-prints and normalize-xml collapses", async () => {
    const formatted = mustOk(await runDrawioText("format-xml", "<root><a>1</a></root>"));
    expect(formatted).toContain("\n");
    expect(formatted).toContain("<a>1</a>");
    expect(mustOk(await runDrawioText("normalize-xml", "<root>\n  <a>1</a>\n</root>"))).toBe(
      "<root><a>1</a></root>",
    );
    expect(mustOk(normalizeXmlText(""))).toBe("");
  });

  it("format-xml reports invalid XML", async () => {
    const result = await runDrawioText("format-xml", "<root><unclosed>");
    expect(result.ok).toBe(false);
  });

  it("format-json / normalize-json", async () => {
    expect(mustOk(await runDrawioText("format-json", '{"b":2,"a":1}'))).toBe(
      '{\n  "b": 2,\n  "a": 1\n}',
    );
    expect(mustOk(await runDrawioText("normalize-json", '{\n  "b": 2\n}'))).toBe('{"b":2}');
    const bad = await runDrawioText("format-json", "{nope");
    expect(bad.ok).toBe(false);
  });

  it("rejects unknown operations and oversized input", async () => {
    expect(mustErr(await runDrawioText("nope", "x"))).toBe("INVALID_OPERATION");
    const big = "x".repeat(DRAWIO_TEXT_MAX_INPUT_CHARS + 1);
    expect(mustErr(await drawioEncode(big))).toBe("INPUT_TOO_LARGE");
  });
});

describe("DRAWIO_TEXT_SPEC", () => {
  it("exposes sixteen operations with encode as default", () => {
    expect(DRAWIO_TEXT_SPEC.slug).toBe("drawio-text-tools");
    expect(DRAWIO_TEXT_SPEC.operations).toHaveLength(16);
    expect(DRAWIO_TEXT_SPEC.defaultOperationId).toBe("encode");
    const ids = DRAWIO_TEXT_SPEC.operations.map((op) => op.id);
    expect(new Set(ids).size).toBe(16);
  });

  it("is registered in the host transform map", async () => {
    const { getHostTransformSpec } = await import("../host-transforms");
    const spec = getHostTransformSpec("drawio-text-tools");
    expect(spec?.slug).toBe("drawio-text-tools");
    const result = await spec!.transform(
      { operationId: "remove-linebreaks", optionId: "default", input: "a\nb" },
      {} as never,
    );
    expect(result.ok && result.value).toBe("ab");
  });
});
