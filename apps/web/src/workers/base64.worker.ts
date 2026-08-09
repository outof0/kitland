import { err, runBase64 } from "@kitland/core";
import { isBase64WorkerRequest, type Base64WorkerResponse } from "@/lib/base64-worker-protocol";

/**
 * This module is bundled as a dedicated worker by Vite/Astro. Keep its
 * message contract serializable: the UI only transfers strings and a result.
 */
globalThis.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isBase64WorkerRequest(event.data)) return;

  const { id, input, mode, urlSafe } = event.data;
  let result;

  try {
    result = runBase64(mode, input, { urlSafe });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Base64 conversion failed.";
    result = err("TRANSFORM_FAILED", message);
  }

  const response: Base64WorkerResponse = {
    type: "result",
    id,
    result,
    outputByteLength: outputByteLength(mode, result),
  };

  // The DOM lib types global postMessage as Window#postMessage. A dedicated
  // worker has the one-argument form, so narrow only at this boundary.
  (
    globalThis as unknown as {
      postMessage(message: Base64WorkerResponse): void;
    }
  ).postMessage(response);
});

function outputByteLength(mode: "encode" | "decode", result: ReturnType<typeof runBase64>): number {
  if (!result.ok) return 0;

  // Base64 output is ASCII by definition. Decoded UTF-8 text is measured in
  // this worker as well, so rendering a byte label never re-encodes megabytes
  // of text on React's main thread.
  return mode === "encode" ? result.value.length : new TextEncoder().encode(result.value).length;
}
