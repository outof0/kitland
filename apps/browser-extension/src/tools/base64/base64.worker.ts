import { runTransform } from "./domain";
import { isTransformRequest, type TransformResponse } from "./worker-protocol";

globalThis.addEventListener("message", (event: MessageEvent<unknown>) => {
  if (!isTransformRequest(event.data)) return;

  const { id, mode, format, input } = event.data;
  const transformed = runTransform({ mode, format, input });
  const response: TransformResponse = {
    type: "result",
    id,
    result: transformed.result,
    outputByteLength: transformed.outputByteLength,
  };

  (
    globalThis as unknown as {
      postMessage(message: TransformResponse): void;
    }
  ).postMessage(response);
});
