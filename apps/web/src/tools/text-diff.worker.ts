import { diffText, type TextDiffResult, type ToolResult } from "@kitland/core";

type DiffRequest = { id: number; before: string; after: string };
type DiffResponse = { id: number; result: ToolResult<TextDiffResult> };
type WorkerScope = {
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  postMessage(message: DiffResponse): void;
};

const workerScope = self as unknown as WorkerScope;

workerScope.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isDiffRequest(event.data)) return;
  workerScope.postMessage({
    id: event.data.id,
    result: diffText(event.data.before, event.data.after),
  });
});

function isDiffRequest(value: unknown): value is DiffRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Record<string, unknown>;
  return (
    typeof request.id === "number" &&
    typeof request.before === "string" &&
    typeof request.after === "string"
  );
}
