import { err, inspectJson } from "@kitland/core";
import {
  isJsonFormatterWorkerRequest,
  type JsonFormatterWorkerResponse,
} from "@/lib/json-formatter-worker-protocol";

globalThis.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isJsonFormatterWorkerRequest(event.data)) return;
  const { id, source, indent, mode } = event.data;
  let result: ReturnType<typeof inspectJson>;
  try {
    result = inspectJson(source, indent, mode);
  } catch {
    result = err("INSPECTION_FAILED", "JSON inspection could not be completed.");
  }
  const response: JsonFormatterWorkerResponse = { type: "result", id, result };
  (
    globalThis as unknown as { postMessage(message: JsonFormatterWorkerResponse): void }
  ).postMessage(response);
});
