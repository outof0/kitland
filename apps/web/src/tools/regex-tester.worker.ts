import { testRegex, type RegexTestResult, type ToolResult } from "@kitland/core";

type RegexRequest = {
  id: number;
  pattern: string;
  input: string;
  flags: string;
};
type RegexResponse = { id: number; result: ToolResult<RegexTestResult> };
type WorkerScope = {
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  postMessage(message: RegexResponse): void;
};

const workerScope = self as unknown as WorkerScope;

workerScope.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isRegexRequest(event.data)) return;
  workerScope.postMessage({
    id: event.data.id,
    result: testRegex(event.data.pattern, event.data.input, {
      flags: event.data.flags,
    }),
  });
});

function isRegexRequest(value: unknown): value is RegexRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Record<string, unknown>;
  return (
    typeof request.id === "number" &&
    typeof request.pattern === "string" &&
    typeof request.input === "string" &&
    typeof request.flags === "string"
  );
}
