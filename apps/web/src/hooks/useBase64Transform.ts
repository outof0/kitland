import { err, runBase64, type Base64Mode, type ToolResult } from "@kitland/core";
import { isBase64WorkerResponse, type Base64WorkerRequest } from "@/lib/base64-worker-protocol";
import { useEffect, useMemo, useRef, useState } from "react";

type TransformQuery = {
  mode: Base64Mode;
  input: string;
  urlSafe: boolean;
};

type CompletedTransform = TransformQuery & {
  result: ToolResult<string>;
  outputByteLength: number;
};

type PendingTransform = TransformQuery & {
  id: number;
};

export type Base64TransformState = {
  result: ToolResult<string>;
  outputByteLength: number;
  isProcessing: boolean;
};

type Base64TransformOptions = {
  /** Skip worker messaging for a value already rejected by the UI size gate. */
  enabled: boolean;
  urlSafe: boolean;
};

const WORKER_UNAVAILABLE_MESSAGE =
  "The conversion worker could not start. Refresh the page and try again.";
const WORKER_FAILED_MESSAGE =
  "The conversion worker stopped unexpectedly. Refresh the page and try again.";
const TRANSFORM_DEBOUNCE_MS = 100;
const EMPTY_RESULT: ToolResult<string> = { ok: true, value: "" };

/**
 * Runs browser-side transformations in a dedicated module worker.
 *
 * The initial result is calculated synchronously so SSR and the first hydrated
 * client render are byte-for-byte deterministic. Every subsequent changed
 * value is sent to the worker; no large conversion runs from React render.
 */
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
    };
  });
  const [workerState, setWorkerState] = useState<"starting" | "ready" | "failed">("starting");
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const latestRequestRef = useRef<PendingTransform | null>(null);

  useEffect(() => {
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

    const failWorker = (message: string) => {
      if (workerRef.current !== worker) return;

      worker.terminate();
      workerRef.current = null;
      setWorkerState("failed");

      const pending = latestRequestRef.current;
      if (pending && sameQuery(pending, queryRef.current)) {
        setCompleted(toCompleted(pending, err("WORKER_FAILED", message)));
      }
    };

    worker.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (!isBase64WorkerResponse(event.data)) {
        failWorker(WORKER_FAILED_MESSAGE);
        return;
      }

      const pending = latestRequestRef.current;
      if (!pending || pending.id !== event.data.id || !sameQuery(pending, queryRef.current)) {
        return;
      }

      setCompleted(toCompleted(pending, event.data.result, event.data.outputByteLength));
    });
    worker.addEventListener("error", () => failWorker(WORKER_FAILED_MESSAGE));
    worker.addEventListener("messageerror", () => failWorker(WORKER_FAILED_MESSAGE));

    workerRef.current = worker;
    setWorkerState("ready");

    return () => {
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    // A response for a prior query must never overwrite a known result after a
    // user has returned to it, even if it arrives before this effect flushes.
    if (!enabled || query.input.length === 0 || sameQuery(completed, query)) {
      latestRequestRef.current = null;
      return;
    }

    if (workerState === "failed") {
      setCompleted(toCompleted(query, err("WORKER_UNAVAILABLE", WORKER_UNAVAILABLE_MESSAGE)));
      return;
    }

    const worker = workerRef.current;
    if (workerState !== "ready" || !worker) return;

    // Cloning a multi-megabyte string for every keystroke can itself become a
    // main-thread cost. Coalesce fast edits, while still marking the UI as
    // processing as soon as the value changes.
    const timeout = window.setTimeout(() => {
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
      const pending: PendingTransform = { ...query, id };
      latestRequestRef.current = pending;

      try {
        worker.postMessage(request);
      } catch {
        // Structured-clone failures should be surfaced as a tool error rather
        // than allowing a stale result to remain actionable.
        latestRequestRef.current = null;
        setCompleted(toCompleted(query, err("WORKER_POST_FAILED", WORKER_UNAVAILABLE_MESSAGE)));
      }
    }, TRANSFORM_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [completed, enabled, query, workerState]);

  if (query.input.length === 0) {
    return { result: EMPTY_RESULT, outputByteLength: 0, isProcessing: false };
  }

  return {
    result: completed.result,
    outputByteLength: completed.outputByteLength,
    isProcessing: enabled && !sameQuery(completed, query),
  };
}

function sameQuery(left: TransformQuery, right: TransformQuery): boolean {
  return left.mode === right.mode && left.input === right.input && left.urlSafe === right.urlSafe;
}

function toCompleted(
  query: TransformQuery,
  result: ToolResult<string>,
  outputByteLength = 0,
): CompletedTransform {
  return {
    mode: query.mode,
    input: query.input,
    urlSafe: query.urlSafe,
    result,
    outputByteLength,
  };
}

function initialResult(mode: Base64Mode, input: string, urlSafe: boolean): ToolResult<string> {
  return runBase64(mode, input, { urlSafe });
}

function getOutputByteLength(mode: Base64Mode, result: ToolResult<string>): number {
  if (!result.ok) return 0;
  return mode === "encode" ? result.value.length : new TextEncoder().encode(result.value).length;
}
