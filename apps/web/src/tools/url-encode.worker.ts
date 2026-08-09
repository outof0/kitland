import { runUrlTransform, type UrlEncodingScope, type UrlTransformMode } from "@kitland/core";
import { type ToolResult } from "@kitland/core";

type UrlTransformRequest = {
  type: "transform";
  id: number;
  mode: UrlTransformMode;
  scope: UrlEncodingScope;
  input: string;
};

type UrlTransformResponse = {
  type: "result";
  id: number;
  result: ToolResult<string>;
};

type WorkerScope = {
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  postMessage(message: UrlTransformResponse): void;
};

const workerScope = self as unknown as WorkerScope;

workerScope.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isTransformRequest(event.data)) return;

  const response: UrlTransformResponse = {
    type: "result",
    id: event.data.id,
    result: runUrlTransform(event.data.mode, event.data.input, {
      scope: event.data.scope,
    }),
  };
  workerScope.postMessage(response);
});

function isTransformRequest(value: unknown): value is UrlTransformRequest {
  if (!value || typeof value !== "object") return false;

  const request = value as Record<string, unknown>;
  return (
    request.type === "transform" &&
    typeof request.id === "number" &&
    (request.mode === "encode" || request.mode === "decode") &&
    (request.scope === "component" || request.scope === "url") &&
    typeof request.input === "string"
  );
}
