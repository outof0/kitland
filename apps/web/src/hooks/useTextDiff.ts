import { diffText, err, type TextDiffResult, type ToolResult } from "@kitland/core";
import { useEffect, useMemo, useRef, useState } from "react";

type Query = { before: string; after: string };
type WorkerResponse = { id: number; result: ToolResult<TextDiffResult> };

export type TextDiffState = {
  result: ToolResult<TextDiffResult>;
  isProcessing: boolean;
};

const DEBOUNCE_MS = 150;
const WORKER_ERROR = "The diff worker could not start. Refresh the page and try again.";

/** Runs the quadratic line-diff operation in a disposable module worker. */
export function useTextDiff(before: string, after: string): TextDiffState {
  const query = useMemo<Query>(() => ({ before, after }), [after, before]);
  const latest = useRef(query);
  latest.current = query;
  const [completed, setCompleted] = useState(() => ({
    query,
    result: diffText(before, after),
  }));

  useEffect(() => {
    if (sameQuery(completed.query, query)) return;

    let worker: Worker | null = null;
    let id = 0;
    const timeout = window.setTimeout(() => {
      try {
        worker = new Worker(new URL("../tools/text-diff.worker.ts", import.meta.url), {
          type: "module",
        });
      } catch {
        setCompleted({
          query,
          result: err("WORKER_UNAVAILABLE", WORKER_ERROR),
        });
        return;
      }

      worker.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (
          !isWorkerResponse(event.data) ||
          event.data.id !== id ||
          !sameQuery(latest.current, query)
        ) {
          return;
        }
        setCompleted({ query, result: event.data.result });
      });
      worker.addEventListener("error", () => {
        if (sameQuery(latest.current, query)) {
          setCompleted({ query, result: err("WORKER_FAILED", WORKER_ERROR) });
        }
      });
      id = 1;
      worker.postMessage({ id, ...query });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      worker?.terminate();
    };
  }, [completed.query, query]);

  return {
    result: completed.result,
    isProcessing: !sameQuery(completed.query, query),
  };
}

function sameQuery(left: Query, right: Query): boolean {
  return left.before === right.before && left.after === right.after;
}

function isWorkerResponse(value: unknown): value is WorkerResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return typeof response.id === "number" && "result" in response;
}
