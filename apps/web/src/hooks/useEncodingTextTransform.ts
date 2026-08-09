import { err, type ToolResult } from "@kitland/core";
import {
  runEncodingTextTransform,
  type EncodingTextFormat,
  type EncodingTextMode,
  type EncodingTextTool,
} from "@/tools/encoding-text-transform";
import { useEffect, useMemo, useRef, useState } from "react";

type TransformQuery = {
  tool: EncodingTextTool;
  mode: EncodingTextMode;
  input: string;
  format?: EncodingTextFormat;
};

type WorkerResponse = {
  type: "result";
  id: number;
  result: ToolResult<string>;
};

export type EncodingTextTransformState = {
  result: ToolResult<string>;
  isProcessing: boolean;
};

const DEBOUNCE_MS = 100;
const WORKER_FAILED_MESSAGE =
  "The conversion worker could not start. Refresh the page and try again.";

/** Run deterministic, potentially large text transforms outside React rendering. */
export function useEncodingTextTransform(
  tool: EncodingTextTool,
  mode: EncodingTextMode,
  input: string,
  format?: EncodingTextFormat,
): EncodingTextTransformState {
  const query = useMemo<TransformQuery>(
    () => ({ tool, mode, input, ...(format === undefined ? {} : { format }) }),
    [format, input, mode, tool],
  );
  const currentQuery = useRef(query);
  currentQuery.current = query;
  const [completed, setCompleted] = useState(() => ({
    query,
    result: runEncodingTextTransform(tool, mode, input, format),
  }));
  const [workerState, setWorkerState] = useState<"starting" | "ready" | "failed">("starting");
  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const pendingQuery = useRef<TransformQuery | null>(null);

  useEffect(() => {
    if (typeof Worker === "undefined") {
      setWorkerState("failed");
      return;
    }

    let worker: Worker;
    try {
      worker = new Worker(new URL("../tools/encoding-text.worker.ts", import.meta.url), {
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
      if (!isWorkerResponse(event.data) || event.data.id !== requestId.current) return;
      const request = pendingQuery.current;
      if (!request || !sameQuery(request, currentQuery.current)) return;
      setCompleted({ query: request, result: event.data.result });
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
    if (query.input.length === 0 || sameQuery(completed.query, query)) return;
    if (workerState === "failed") {
      setCompleted({
        query,
        result: err("WORKER_UNAVAILABLE", WORKER_FAILED_MESSAGE),
      });
      return;
    }

    const worker = workerRef.current;
    if (workerState !== "ready" || !worker) return;

    const timeout = window.setTimeout(() => {
      if (workerRef.current !== worker || !sameQuery(query, currentQuery.current)) return;
      const id = requestId.current + 1;
      requestId.current = id;
      pendingQuery.current = query;
      try {
        worker.postMessage({ type: "transform", id, ...query });
      } catch {
        pendingQuery.current = null;
        setCompleted({
          query,
          result: err("WORKER_POST_FAILED", WORKER_FAILED_MESSAGE),
        });
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [completed.query, query, workerState]);

  if (input.length === 0) return { result: { ok: true, value: "" }, isProcessing: false };
  return {
    result: completed.result,
    isProcessing: !sameQuery(completed.query, query),
  };
}

function sameQuery(left: TransformQuery, right: TransformQuery): boolean {
  return (
    left.tool === right.tool &&
    left.mode === right.mode &&
    left.input === right.input &&
    left.format === right.format
  );
}

function isWorkerResponse(value: unknown): value is WorkerResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return response.type === "result" && typeof response.id === "number" && "result" in response;
}
