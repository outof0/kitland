import { PROTOCOL_MAX_TEXT_CHARS } from "../../src/constants";
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
  });

  it("rejects unknown fields, malformed identifiers, and oversized payloads", () => {
    expect(parseWebviewMessage({ type: "ready", unexpected: true })).toBeUndefined();
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

  it("accepts a complete catalog-backed initialization message", () => {
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
