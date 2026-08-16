import {
  JSON_FORMATTER_MAX_DEPTH,
  JSON_FORMATTER_MAX_NODES,
  JSON_FORMATTER_MAX_OUTPUT_CHARS,
} from "@kitland/core";
import {
  PROTOCOL_MAX_DESCRIPTION_CHARS,
  PROTOCOL_MAX_ID_CHARS,
  PROTOCOL_MAX_TEXT_CHARS,
} from "../../src/constants";
import { parseHostMessage, parseWebviewMessage } from "../../src/protocol";

const tool = {
  id: "base64",
  title: "Base64",
  description: "Encode and decode locally.",
  renderer: {
    kind: "text-transform",
    operations: [
      { id: "encode", label: "Encode", actionLabel: "Encode" },
      { id: "decode", label: "Decode", actionLabel: "Decode" },
    ],
    options: [
      { id: "standard", label: "Standard" },
      { id: "url-safe", label: "URL-safe" },
    ],
    optionLabel: "Variant",
    defaultOperationId: "encode",
    defaultOptionId: "standard",
  },
};

describe("webview protocol", () => {
  it("accepts exact, bounded webview messages", () => {
    expect(parseWebviewMessage({ type: "ready" })).toEqual({ type: "ready" });
    expect(parseWebviewMessage({ type: "clear", toolId: "base64" })).toEqual({
      type: "clear",
      toolId: "base64",
    });
    expect(
      parseWebviewMessage({
        type: "transform",
        requestId: 1,
        toolId: "base64",
        operationId: "encode",
        optionId: "standard",
        input: "hello",
      }),
    ).toEqual({
      type: "transform",
      requestId: 1,
      toolId: "base64",
      operationId: "encode",
      optionId: "standard",
      input: "hello",
    });
    expect(
      parseWebviewMessage({
        type: "transform",
        requestId: 2,
        toolId: "curl-converter",
        operationId: "convert",
        optionId: "fetch",
        input: "curl https://example.test",
      }),
    ).toEqual({
      type: "transform",
      requestId: 2,
      toolId: "curl-converter",
      operationId: "convert",
      optionId: "fetch",
      input: "curl https://example.test",
    });
    expect(parseWebviewMessage({ type: "listTools" })).toEqual({ type: "listTools" });
    expect(parseWebviewMessage({ type: "selectTool", toolId: "base64" })).toEqual({
      type: "selectTool",
      toolId: "base64",
    });
    expect(
      parseWebviewMessage({
        type: "regexTest",
        requestId: 9,
        pattern: "(?<w>\\w+)",
        input: "a b",
        flags: "gu",
      }),
    ).toEqual({
      type: "regexTest",
      requestId: 9,
      pattern: "(?<w>\\w+)",
      input: "a b",
      flags: "gu",
    });
  });

  it("round-trips regex tester host results", () => {
    expect(
      parseHostMessage({
        type: "regexResult",
        requestId: 9,
        result: { ok: true, value: { matches: [], truncated: false } },
      }),
    ).toEqual({
      type: "regexResult",
      requestId: 9,
      result: { ok: true, value: { matches: [], truncated: false } },
    });
    expect(
      parseHostMessage({
        type: "regexResult",
        requestId: 10,
        result: { ok: false, error: { code: "INVALID_REGEX", message: "Unterminated group" } },
      }),
    ).toEqual({
      type: "regexResult",
      requestId: 10,
      result: { ok: false, error: { code: "INVALID_REGEX", message: "Unterminated group" } },
    });
    expect(
      parseHostMessage({
        type: "regexResult",
        requestId: 11,
        result: { ok: true, value: { matches: "no", truncated: true } },
      }),
    ).toBeUndefined();
  });

  it("rejects unknown fields, malformed identifiers, and oversized payloads", () => {
    expect(parseWebviewMessage({ type: "ready", unexpected: true })).toBeUndefined();
    expect(
      parseWebviewMessage({ type: "selectTool", toolId: "base64", extra: true }),
    ).toBeUndefined();
    expect(
      parseWebviewMessage({
        type: "copy",
        requestId: 2,
        toolId: "../../workspace",
      }),
    ).toBeUndefined();
    expect(
      parseWebviewMessage({
        type: "transform",
        requestId: 3,
        toolId: "base64",
        operationId: "encode",
        optionId: "standard",
        input: "x".repeat(PROTOCOL_MAX_TEXT_CHARS + 1),
      }),
    ).toBeUndefined();
  });

  it("accepts a complete registry-backed initialization message", () => {
    const message = {
      type: "init",
      tool,
      input: "prefill",
      limits: {
        inputs: [
          { operationId: "encode", maxInputChars: 250_000 },
          { operationId: "decode", maxInputChars: 1_000_000 },
        ],
        maxOutputChars: 1_000_000,
      },
    };
    expect(parseHostMessage(message)).toEqual(message);
  });

  it("preserves the host's explicit sidebar layout mode", () => {
    const message = {
      type: "toolsList",
      tools: [
        {
          id: "base64",
          slug: "base64",
          shortName: "Base64",
          name: "Base64",
          description: "Encode and decode locally.",
          family: "encode-decode",
        },
      ],
      activeToolId: "base64",
      initialInput: "",
      collapseSidebar: true,
    };
    expect(parseHostMessage(message)).toEqual(message);
  });

  it("validates exact JSON inspect descriptors, requests, and structured results", () => {
    const inspectTool = {
      id: "json-formatter",
      title: "JSON Formatter",
      description: "Inspect JSON locally.",
      renderer: {
        kind: "text-inspect",
        operations: [
          { id: "beautify", label: "Beautify", actionLabel: "Beautify JSON" },
          { id: "minify", label: "Minify", actionLabel: "Minify JSON" },
        ],
        options: [
          { id: "indent-2", label: "2 spaces" },
          { id: "indent-4", label: "4 spaces" },
        ],
        optionLabel: "Indentation",
        defaultOperationId: "beautify",
        defaultOptionId: "indent-2",
      },
    };
    const init = {
      type: "init",
      tool: inspectTool,
      input: "null",
      limits: { maxInputChars: 100_000, maxOutputChars: 1_000_000 },
    };
    expect(parseHostMessage(init)).toEqual(init);
    expect(
      parseWebviewMessage({
        type: "inspect",
        requestId: 7,
        toolId: "json-formatter",
        operationId: "minify",
        optionId: "indent-2",
        input: "null",
      }),
    ).toEqual({
      type: "inspect",
      requestId: 7,
      toolId: "json-formatter",
      operationId: "minify",
      optionId: "indent-2",
      input: "null",
    });
    expect(
      parseWebviewMessage({
        type: "inspect",
        requestId: 7,
        toolId: "json-formatter",
        operationId: "beautify",
        optionId: "indent-2",
        input: "x".repeat(PROTOCOL_MAX_TEXT_CHARS + 1),
      }),
    ).toBeUndefined();
    expect(
      parseWebviewMessage({
        type: "inspect",
        requestId: 7,
        toolId: "json-formatter",
        optionId: "indent-2",
        input: "null",
      }),
    ).toBeUndefined();
    const inspection = {
      formatted: "null",
      rootType: "null",
      totalValues: 1,
      objectCount: 0,
      arrayCount: 0,
      stringCount: 0,
      numberCount: 0,
      booleanCount: 0,
      nullCount: 1,
      maxDepth: 0,
    };
    expect(
      parseHostMessage({
        type: "inspectResult",
        requestId: 7,
        toolId: "json-formatter",
        ok: true,
        inspection,
      }),
    ).toEqual({
      type: "inspectResult",
      requestId: 7,
      toolId: "json-formatter",
      ok: true,
      inspection,
    });
    expect(
      parseHostMessage({
        type: "inspectResult",
        requestId: 7,
        toolId: "json-formatter",
        ok: true,
        inspection: { ...inspection, maxDepth: -1 },
      }),
    ).toBeUndefined();
    const inspectResult = (value: object) =>
      parseHostMessage({
        type: "inspectResult",
        requestId: 7,
        toolId: "json-formatter",
        ok: true,
        inspection: value,
      });
    expect(
      inspectResult({
        ...inspection,
        formatted: "x".repeat(JSON_FORMATTER_MAX_OUTPUT_CHARS + 1),
      }),
    ).toBeUndefined();
    expect(
      inspectResult({ ...inspection, totalValues: JSON_FORMATTER_MAX_NODES + 1 }),
    ).toBeUndefined();
    expect(
      inspectResult({ ...inspection, nullCount: JSON_FORMATTER_MAX_NODES + 1 }),
    ).toBeUndefined();
    expect(
      inspectResult({ ...inspection, maxDepth: JSON_FORMATTER_MAX_DEPTH + 1 }),
    ).toBeUndefined();
    expect(inspectResult({ ...inspection, totalValues: 2 })).toBeUndefined();
    expect(inspectResult({ ...inspection, rootType: "array" })).toBeUndefined();
    expect(
      parseHostMessage({
        type: "inspectResult",
        requestId: 7,
        toolId: "json-toolbox",
        ok: false,
        code: "E".repeat(PROTOCOL_MAX_ID_CHARS + 1),
        message: "Failed.",
      }),
    ).toBeUndefined();
    expect(
      parseHostMessage({
        type: "inspectResult",
        requestId: 7,
        toolId: "json-toolbox",
        ok: false,
        code: "FAILED",
        message: "x".repeat(PROTOCOL_MAX_DESCRIPTION_CHARS + 1),
      }),
    ).toBeUndefined();
    expect(parseHostMessage({ ...init, limits: { ...init.limits, extra: true } })).toBeUndefined();
  });

  it("rejects inconsistent or extended host descriptors", () => {
    expect(
      parseHostMessage({
        type: "init",
        tool: { ...tool, unexpected: true },
        input: "",
        limits: {
          inputs: [{ operationId: "encode", maxInputChars: 10 }],
          maxOutputChars: 10,
        },
      }),
    ).toBeUndefined();
    expect(
      parseHostMessage({
        type: "transformResult",
        requestId: 4,
        toolId: "base64",
        ok: true,
        value: "done",
        injected: true,
      }),
    ).toBeUndefined();
  });
});
