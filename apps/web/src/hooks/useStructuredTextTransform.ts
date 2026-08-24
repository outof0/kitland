import { err, type ToolResult } from "@kitland/core";
import {
  isStructuredTextWorkerResponse,
  parseStructuredTextTransformKey,
  structuredTextTransformKey,
  type StructuredTextTransform,
  type StructuredTextWorkerRequest,
} from "@/lib/structured-text-worker-protocol";
import { useEffect, useMemo, useRef, useState } from "react";

type TransformQuery = {
  readonly transform: StructuredTextTransform;
  readonly input: string;
};

type CompletedTransform = TransformQuery & {
  readonly result: ToolResult<string>;
};

export type StructuredTextTransformState = {
  readonly result: ToolResult<string>;
  readonly isProcessing: boolean;
};

export type StructuredTextTransformOptions = {
  readonly enabled?: boolean;
};

const DEBOUNCE_MS = 120;
const WORKER_TIMEOUT_MS = 15_000;
const EMPTY_RESULT: ToolResult<string> = { ok: true, value: "" };
const WORKER_FAILURES = {
  unavailable: {
    code: "WORKER_UNAVAILABLE",
    message: "The local conversion worker is unavailable. Refresh the page and try again.",
  },
  runtime: {
    code: "WORKER_FAILED",
    message: "The local conversion worker stopped unexpectedly. Refresh the page and try again.",
  },
  protocol: {
    code: "WORKER_PROTOCOL_FAILED",
    message:
      "The local conversion worker returned an invalid response. Refresh the page and try again.",
  },
  message: {
    code: "WORKER_MESSAGE_FAILED",
    message:
      "The local conversion worker response could not be read. Refresh the page and try again.",
  },
  post: {
    code: "WORKER_POST_FAILED",
    message:
      "The text could not be sent to the local conversion worker. Refresh the page and try again.",
  },
  timeout: {
    code: "WORKER_TIMEOUT",
    message: "The local conversion worker took too long. Try a smaller input or refresh the page.",
  },
} as const;

export function useStructuredTextTransform(
  transform: StructuredTextTransform,
  input: string,
  { enabled = true }: StructuredTextTransformOptions = {},
): StructuredTextTransformState {
  // Callers commonly build the closed transform object inline. Its reference
  // must not restart an equivalent request (or keep the empty-state effect in
  // a render loop), so canonicalize the query from its complete value key.
  const transformKey = structuredTextTransformKey(transform);
  const query = useMemo<TransformQuery>(() => {
    const canonicalTransform = parseStructuredTextTransformKey(transformKey);
    if (!canonicalTransform) {
      throw new Error("Could not reconstruct a structured text transform query.");
    }
    return { transform: canonicalTransform, input };
  }, [input, transformKey]);
  const requestId = useRef(0);
  const [completed, setCompleted] = useState<CompletedTransform>({
    ...query,
    result: EMPTY_RESULT,
  });

  useEffect(() => {
    // The render path owns empty/disabled state. Mirroring it synchronously in
    // an effect can turn a stable input into a render loop.
    if (!enabled || query.input.length === 0) return;

    let worker: Worker | undefined;
    let active = true;
    let watchdog: number | undefined;
    const timer = window.setTimeout(() => {
      if (!active) return;
      if (typeof Worker === "undefined") {
        setCompleted({
          ...query,
          result: err(WORKER_FAILURES.unavailable.code, WORKER_FAILURES.unavailable.message),
        });
        return;
      }

      try {
        worker = new Worker(
          new URL("../workers/structured-text-transform.worker.ts", import.meta.url),
          {
            type: "module",
          },
        );
      } catch {
        setCompleted({
          ...query,
          result: err(WORKER_FAILURES.unavailable.code, WORKER_FAILURES.unavailable.message),
        });
        return;
      }

      const id = requestId.current === Number.MAX_SAFE_INTEGER ? 1 : requestId.current + 1;
      requestId.current = id;
      const fail = (failure: (typeof WORKER_FAILURES)[keyof typeof WORKER_FAILURES]) => {
        if (!active) return;
        active = false;
        if (watchdog !== undefined) window.clearTimeout(watchdog);
        watchdog = undefined;
        worker?.terminate();
        setCompleted({ ...query, result: err(failure.code, failure.message) });
      };

      worker.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (!active) return;
        if (!isStructuredTextWorkerResponse(event.data)) {
          fail(WORKER_FAILURES.protocol);
          return;
        }
        const response = event.data;
        if (response.id !== id) {
          fail(WORKER_FAILURES.protocol);
          return;
        }
        active = false;
        if (watchdog !== undefined) window.clearTimeout(watchdog);
        watchdog = undefined;
        worker?.terminate();
        setCompleted((prev) => {
          if (sameQuery(prev, query) && prev.result === response.result) return prev;
          return { ...query, result: response.result };
        });
      });
      worker.addEventListener("error", () => fail(WORKER_FAILURES.runtime));
      worker.addEventListener("messageerror", () => fail(WORKER_FAILURES.message));

      const request: StructuredTextWorkerRequest = {
        type: "transform",
        id,
        source: query.input,
        ...query.transform,
      };
      watchdog = window.setTimeout(() => fail(WORKER_FAILURES.timeout), WORKER_TIMEOUT_MS);
      try {
        worker.postMessage(request);
      } catch {
        fail(WORKER_FAILURES.post);
      }
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
      if (watchdog !== undefined) window.clearTimeout(watchdog);
      worker?.terminate();
    };
  }, [enabled, query]);

  if (!enabled || query.input.length === 0) return { result: EMPTY_RESULT, isProcessing: false };
  if (!sameQuery(completed, query)) return { result: EMPTY_RESULT, isProcessing: true };
  return { result: completed.result, isProcessing: false };
}

function sameQuery(left: TransformQuery, right: TransformQuery): boolean {
  return (
    left.input === right.input &&
    structuredTextTransformKey(left.transform) === structuredTextTransformKey(right.transform)
  );
}
