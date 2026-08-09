import {
  err,
  runUrlTransform,
  type ToolResult,
  type UrlEncodingScope,
  type UrlTransformMode,
} from "@kitland/core";
import { useEffect, useMemo, useRef, useState } from "react";

type TransformQuery = {
  mode: UrlTransformMode;
  scope: UrlEncodingScope;
  input: string;
};

type WorkerResult = {
  type: "result";
  id: number;
  result: ToolResult<string>;
};

export type UrlTransformState = {
  result: ToolResult<string>;
  isProcessing: boolean;
};

const DEBOUNCE_MS = 100;
const WORKER_UNAVAILABLE_MESSAGE =
  "The conversion worker could not start. Refresh the page and try again.";

/**
 * Keeps large URI transformations out of React renders. It never falls back
 * to the main thread after the worker has failed, preventing a large pasted
 * value from unexpectedly freezing the editor.
 */
export function useUrlTransform(
  mode: UrlTransformMode,
  scope: UrlEncodingScope,
  input: string,
): UrlTransformState {
  const query = useMemo<TransformQuery>(() => ({ mode, scope, input }), [input, mode, scope]);
  const currentQuery = useRef(query);
  currentQuery.current = query;
  const [completed, setCompleted] = useState(() => ({
    query,
    result: runUrlTransform(mode, input, { scope }),
  }));
  const [workerState, setWorkerState] = useState<"starting" | "ready" | "failed">("starting");
  const workerRef = useRef<Worker | null>(null);
  const latestRequestId = useRef(0);
  const latestRequestQuery = useRef<TransformQuery | null>(null);

  useEffect(() => {
    if (typeof Worker === "undefined") {
      setWorkerState("failed");
      return;
    }

    let worker: Worker;
    try {
      worker = new Worker(new URL("../tools/url-encode.worker.ts", import.meta.url), {
        type: "module",
      });
    } catch {
      setWorkerState("failed");
      return;
    }

    const failWorker = () => {
      if (workerRef.current !== worker) return;
      worker.terminate();
      workerRef.current = null;
      setWorkerState("failed");
    };

    worker.addEventListener("message", (event: MessageEvent<unknown>) => {
      if (!isWorkerResult(event.data) || event.data.id !== latestRequestId.current) return;
      const requestedQuery = latestRequestQuery.current;
      if (!requestedQuery || !sameQuery(currentQuery.current, requestedQuery)) return;
      setCompleted({ query: requestedQuery, result: event.data.result });
    });
    worker.addEventListener("error", failWorker);
    worker.addEventListener("messageerror", failWorker);
    workerRef.current = worker;
    setWorkerState("ready");

    return () => {
      if (workerRef.current === worker) workerRef.current = null;
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    if (query.input.length === 0) return;

    if (workerState === "failed") {
      if (sameQuery(completed.query, query) && isWorkerUnavailable(completed.result)) return;
      setCompleted({
        query,
        result: err("WORKER_UNAVAILABLE", WORKER_UNAVAILABLE_MESSAGE),
      });
      return;
    }

    if (sameQuery(completed.query, query)) return;

    const worker = workerRef.current;
    if (workerState !== "ready" || !worker) return;

    const timeout = window.setTimeout(() => {
      if (workerRef.current !== worker || !sameQuery(currentQuery.current, query)) return;

      const id = latestRequestId.current + 1;
      latestRequestId.current = id;
      latestRequestQuery.current = query;
      try {
        worker.postMessage({ type: "transform", id, ...query });
      } catch {
        latestRequestQuery.current = null;
        setCompleted({
          query,
          result: err("WORKER_POST_FAILED", WORKER_UNAVAILABLE_MESSAGE),
        });
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [completed.query, completed.result, query, workerState]);

  if (query.input.length === 0) return { result: { ok: true, value: "" }, isProcessing: false };

  return {
    result: completed.result,
    isProcessing: !sameQuery(completed.query, query),
  };
}

function sameQuery(left: TransformQuery, right: TransformQuery): boolean {
  return left.mode === right.mode && left.scope === right.scope && left.input === right.input;
}

function isWorkerResult(value: unknown): value is WorkerResult {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return response.type === "result" && typeof response.id === "number" && "result" in response;
}

function isWorkerUnavailable(result: ToolResult<string>): boolean {
  return (
    !result.ok &&
    (result.error.code === "WORKER_UNAVAILABLE" || result.error.code === "WORKER_POST_FAILED")
  );
}
