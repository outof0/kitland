import { err, type ToolResult } from "@kitland/core";
import {
  isEncodingTextWorkerResponse,
  type EncodingTextWorkerRequest,
} from "@/lib/encoding-text-worker-protocol";
import type {
  EncodingTextFormat,
  EncodingTextMode,
  EncodingTextTool,
} from "@kitland/ui/tools/encoding-text-transform";
import { useEffect, useMemo, useRef, useState } from "react";

type TransformQuery = {
  readonly tool: EncodingTextTool;
  readonly mode: EncodingTextMode;
  readonly input: string;
  readonly format?: EncodingTextFormat;
};

type CompletedTransform = TransformQuery & {
  readonly result: ToolResult<string>;
};

export type EncodingTextTransformState = {
  readonly result: ToolResult<string>;
  readonly isProcessing: boolean;
};

export type EncodingTextTransformOptions = {
  /** The UI already owns a mode-specific input limit; do not post rejected text. */
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

/**
 * Runs one bounded, cancellable request per settled edit. A new edit tears
 * down the old worker, so stale output can never become current after a long
 * conversion or a worker failure.
 */
export function useEncodingTextTransform(
  tool: EncodingTextTool,
  mode: EncodingTextMode,
  input: string,
  format?: EncodingTextFormat,
  { enabled = true }: EncodingTextTransformOptions = {},
): EncodingTextTransformState {
  const query = useMemo<TransformQuery>(
    () => ({ tool, mode, input, ...(format === undefined ? {} : { format }) }),
    [format, input, mode, tool],
  );
  const requestId = useRef(0);
  const [completed, setCompleted] = useState<CompletedTransform>({
    ...query,
    result: EMPTY_RESULT,
  });

  useEffect(() => {
    if (!enabled || query.input.length === 0) {
      setCompleted({ ...query, result: EMPTY_RESULT });
      return;
    }

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
        worker = new Worker(new URL("../tools/encoding-text.worker.ts", import.meta.url), {
          type: "module",
        });
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
        if (!isEncodingTextWorkerResponse(event.data)) {
          fail(WORKER_FAILURES.protocol);
          return;
        }
        if (event.data.id !== id) {
          fail(WORKER_FAILURES.protocol);
          return;
        }
        active = false;
        if (watchdog !== undefined) window.clearTimeout(watchdog);
        watchdog = undefined;
        worker?.terminate();
        setCompleted({ ...query, result: event.data.result });
      });
      worker.addEventListener("error", () => fail(WORKER_FAILURES.runtime));
      worker.addEventListener("messageerror", () => fail(WORKER_FAILURES.message));

      const request: EncodingTextWorkerRequest = { type: "transform", id, ...query };
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
    left.tool === right.tool &&
    left.mode === right.mode &&
    left.input === right.input &&
    left.format === right.format
  );
}
