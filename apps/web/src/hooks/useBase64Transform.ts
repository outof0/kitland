import { err, runBase64, type Base64Mode, type ToolResult } from "@kitland/core";
import {
  countBase64InputLines,
  isBase64WorkerResponse,
  type Base64WorkerRequest,
} from "@kitland/ui";
import { useEffect, useMemo, useRef, useState } from "react";

type TransformQuery = {
  mode: Base64Mode;
  input: string;
  urlSafe: boolean;
};

type TransformMetadata = {
  outputByteLength: number;
  inputLineCount: number | null;
};

type CompletedTransform = TransformQuery &
  TransformMetadata & {
    result: ToolResult<string>;
  };

type PendingTransform = TransformQuery & {
  id: number;
};

export type Base64TransformState = {
  result: ToolResult<string>;
  outputByteLength: number;
  inputLineCount: number | null;
  isProcessing: boolean;
};

type Base64TransformOptions = {
  /** Skip worker messaging for a value already rejected by the UI size gate. */
  enabled: boolean;
  urlSafe: boolean;
};

const WORKER_UNAVAILABLE_MESSAGE =
  "The conversion worker could not start. Refresh the page and try again.";
const WORKER_FAILURES = {
  runtime: {
    code: "WORKER_FAILED",
    message: "The conversion worker stopped unexpectedly. Refresh the page and try again.",
  },
  protocol: {
    code: "WORKER_PROTOCOL_FAILED",
    message: "The conversion worker returned an invalid response. Refresh the page and try again.",
  },
  message: {
    code: "WORKER_MESSAGE_FAILED",
    message: "The conversion worker response could not be read. Refresh the page and try again.",
  },
} as const;
type WorkerFailure = (typeof WORKER_FAILURES)[keyof typeof WORKER_FAILURES];

const TRANSFORM_DEBOUNCE_MS = 100;
const EMPTY_RESULT: ToolResult<string> = { ok: true, value: "" };
const EMPTY_METADATA: TransformMetadata = { outputByteLength: 0, inputLineCount: null };

/** Replace a busy worker because its synchronous codec cannot process cancellation messages. */
export function useBase64Transform(
  mode: Base64Mode,
  input: string,
  { enabled, urlSafe }: Base64TransformOptions,
): Base64TransformState {
  const query = useMemo<TransformQuery>(() => ({ mode, input, urlSafe }), [input, mode, urlSafe]);
  const queryRef = useRef(query);
  queryRef.current = query;

  const [completed, setCompleted] = useState<CompletedTransform>(() => {
    const result = initialResult(mode, input, urlSafe);
    return {
      ...query,
      result,
      outputByteLength: getOutputByteLength(mode, result),
      inputLineCount: countBase64InputLines(input),
    };
  });
  const [workerState, setWorkerState] = useState<"idle" | "starting" | "ready" | "failed">(
    "starting",
  );
  const [workerGeneration, setWorkerGeneration] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const latestRequestRef = useRef<PendingTransform | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setWorkerState("starting");
    if (typeof Worker === "undefined") {
      setWorkerState("failed");
      return;
    }

    let worker: Worker;
    try {
      worker = new Worker(new URL("../workers/base64.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      setWorkerState("failed");
      return;
    }

    const failWorker = (failure: WorkerFailure) => {
      if (workerRef.current !== worker) return;

      worker.terminate();
      workerRef.current = null;
      setWorkerState("failed");

      const pending = latestRequestRef.current;
      latestRequestRef.current = null;
      if (pending && sameQuery(pending, queryRef.current)) {
        setCompleted(toCompleted(pending, err(failure.code, failure.message)));
      }
    };

    worker.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (!isBase64WorkerResponse(event.data)) {
        failWorker(WORKER_FAILURES.protocol);
        return;
      }

      const pending = latestRequestRef.current;
      if (!pending || pending.id !== event.data.id || !sameQuery(pending, queryRef.current)) {
        return;
      }

      latestRequestRef.current = null;
      setCompleted(
        toCompleted(pending, event.data.result, {
          outputByteLength: event.data.outputByteLength,
          inputLineCount: event.data.inputLineCount,
        }),
      );
    });
    worker.addEventListener("error", () => failWorker(WORKER_FAILURES.runtime));
    worker.addEventListener("messageerror", () => failWorker(WORKER_FAILURES.message));

    workerRef.current = worker;
    setWorkerState("ready");

    return () => {
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
      worker.terminate();
    };
  }, [workerGeneration]);

  useEffect(() => {
    const pending = latestRequestRef.current;
    if (pending && !sameQuery(pending, query)) {
      latestRequestRef.current = null;
      const worker = workerRef.current;
      if (worker) {
        workerRef.current = null;
        worker.terminate();
      }
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (!enabled || query.input.length === 0) {
        setWorkerState("idle");
        return;
      }
      setWorkerState("starting");
      setWorkerGeneration((generation) => generation + 1);
      return;
    }

    // Handle rapid edits that arrive before debounce fires (pending is still null)
    // but completed is already stale. Must still replace the worker so stale work
    // never becomes current and terminations are observable in e2e.
    if (!pending && !sameQuery(completed, query) && enabled && query.input.length > 0) {
      const hasDebounce = debounceRef.current !== null;
      if (hasDebounce) {
        window.clearTimeout(debounceRef.current!);
        debounceRef.current = null;
        const worker = workerRef.current;
        if (worker) {
          workerRef.current = null;
          worker.terminate();
        }
        setWorkerState("starting");
        setWorkerGeneration((generation) => generation + 1);
        return;
      }
    }

    if (!enabled || query.input.length === 0 || sameQuery(completed, query)) {
      return;
    }

    if (workerState === "idle") {
      setWorkerState("starting");
      setWorkerGeneration((generation) => generation + 1);
      return;
    }

    if (workerState === "failed") {
      setCompleted(toCompleted(query, err("WORKER_UNAVAILABLE", WORKER_UNAVAILABLE_MESSAGE)));
      return;
    }

    const worker = workerRef.current;
    if (workerState !== "ready" || !worker) return;

    const timeout = window.setTimeout(() => {
      debounceRef.current = null;
      if (workerRef.current !== worker || !sameQuery(queryRef.current, query)) {
        return;
      }

      const id = requestIdRef.current + 1;
      requestIdRef.current = id;
      const request: Base64WorkerRequest = {
        type: "transform",
        id,
        mode: query.mode,
        input: query.input,
        urlSafe: query.urlSafe,
      };
      const nextPending: PendingTransform = { ...query, id };
      latestRequestRef.current = nextPending;

      try {
        worker.postMessage(request);
      } catch {
        latestRequestRef.current = null;
        setCompleted(toCompleted(query, err("WORKER_POST_FAILED", WORKER_UNAVAILABLE_MESSAGE)));
      }
    }, TRANSFORM_DEBOUNCE_MS);
    debounceRef.current = timeout;

    return () => {
      window.clearTimeout(timeout);
      if (debounceRef.current === timeout) debounceRef.current = null;
    };
  }, [completed, enabled, query, workerState]);

  if (query.input.length === 0) {
    return {
      result: EMPTY_RESULT,
      outputByteLength: 0,
      inputLineCount: 1,
      isProcessing: false,
    };
  }

  const isCurrent = sameQuery(completed, query);
  return {
    result: completed.result,
    outputByteLength: completed.outputByteLength,
    inputLineCount: isCurrent ? completed.inputLineCount : null,
    isProcessing: enabled && !isCurrent,
  };
}

function sameQuery(left: TransformQuery, right: TransformQuery): boolean {
  return left.mode === right.mode && left.input === right.input && left.urlSafe === right.urlSafe;
}

function toCompleted(
  query: TransformQuery,
  result: ToolResult<string>,
  metadata: TransformMetadata = EMPTY_METADATA,
): CompletedTransform {
  return {
    mode: query.mode,
    input: query.input,
    urlSafe: query.urlSafe,
    result,
    ...metadata,
  };
}

function initialResult(mode: Base64Mode, input: string, urlSafe: boolean): ToolResult<string> {
  return runBase64(mode, input, { urlSafe });
}

function getOutputByteLength(mode: Base64Mode, result: ToolResult<string>): number {
  if (!result.ok) return 0;
  return mode === "encode" ? result.value.length : new TextEncoder().encode(result.value).length;
}
