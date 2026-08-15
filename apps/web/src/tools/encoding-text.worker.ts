import { err } from "@kitland/core";
import {
  ENCODING_TEXT_WORKER_MAX_CHARS,
  isEncodingTextWorkerRequest,
  type EncodingTextWorkerResponse,
} from "@/lib/encoding-text-worker-protocol";
import { runEncodingTextTransform } from "@kitland/ui/tools/encoding-text-transform";

type WorkerScope = {
  addEventListener(type: "message", listener: (event: MessageEvent<unknown>) => void): void;
  postMessage(message: EncodingTextWorkerResponse): void;
};

const workerScope = self as unknown as WorkerScope;

workerScope.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isEncodingTextWorkerRequest(event.data)) return;

  let result: ReturnType<typeof runEncodingTextTransform>;
  try {
    result = runEncodingTextTransform(
      event.data.tool,
      event.data.mode,
      event.data.input,
      event.data.format,
    );
  } catch {
    result = err("TRANSFORM_FAILED", "The local text transformation could not be completed.");
  }

  workerScope.postMessage({
    type: "result",
    id: event.data.id,
    result: boundedResult(result),
  });
});

/** Keep user-derived error strings and output inside the validated wire contract. */
function boundedResult(result: ReturnType<typeof runEncodingTextTransform>) {
  if (result.ok) {
    return result.value.length <= ENCODING_TEXT_WORKER_MAX_CHARS
      ? result
      : err("OUTPUT_TOO_LARGE", "The converted result exceeds this tool's output safety limit.");
  }
  return err(
    result.error.code.slice(0, 64) || "TRANSFORM_FAILED",
    result.error.message.slice(0, 320) || "The local text transformation could not be completed.",
  );
}
