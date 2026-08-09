import {
  runEncodingTextTransform,
  type EncodingTextFormat,
  type EncodingTextMode,
  type EncodingTextTool,
} from "./encoding-text-transform";
import { type ToolResult } from "@kitland/core";

type TransformRequest = {
  type: "transform";
  id: number;
  tool: EncodingTextTool;
  mode: EncodingTextMode;
  input: string;
  format?: EncodingTextFormat;
};

type TransformResponse = {
  type: "result";
  id: number;
  result: ToolResult<string>;
};

type WorkerScope = {
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  postMessage(message: TransformResponse): void;
};

const workerScope = self as unknown as WorkerScope;

workerScope.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isTransformRequest(event.data)) return;

  workerScope.postMessage({
    type: "result",
    id: event.data.id,
    result: runEncodingTextTransform(
      event.data.tool,
      event.data.mode,
      event.data.input,
      event.data.format,
    ),
  });
});

function isTransformRequest(value: unknown): value is TransformRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Record<string, unknown>;
  return (
    request.type === "transform" &&
    typeof request.id === "number" &&
    (request.tool === "html-entities" ||
      request.tool === "hex-text" ||
      request.tool === "unicode-converter" ||
      request.tool === "binary-text") &&
    (request.mode === "encode" || request.mode === "decode") &&
    typeof request.input === "string" &&
    (request.format === undefined ||
      request.format === "named" ||
      request.format === "decimal" ||
      request.format === "hexadecimal" ||
      request.format === "spaced" ||
      request.format === "compact")
  );
}
