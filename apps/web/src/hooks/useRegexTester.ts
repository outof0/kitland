import { err, testRegex, type RegexTestResult, type ToolResult } from "@kitland/core";
import { useEffect, useMemo, useRef, useState } from "react";

type Query = { pattern: string; input: string; flags: string };
type WorkerResponse = { id: number; result: ToolResult<RegexTestResult> };

export type RegexTesterState = {
  result: ToolResult<RegexTestResult>;
  isProcessing: boolean;
};

const DEBOUNCE_MS = 160;
const EXECUTION_TIMEOUT_MS = 750;

/**
 * Runs user patterns in a short-lived worker. The watchdog terminates patterns
 * that exhibit catastrophic backtracking, so an editor remains responsive.
 */
export function useRegexTester(pattern: string, input: string, flags: string): RegexTesterState {
  const query = useMemo<Query>(() => ({ pattern, input, flags }), [flags, input, pattern]);
  const latest = useRef(query);
  latest.current = query;
  const [completed, setCompleted] = useState(() => ({
    query,
    result: testRegex(pattern, input, { flags }),
  }));

  useEffect(() => {
    if (sameQuery(completed.query, query)) return;

    let worker: Worker | null = null;
    let watchdog: number | undefined;
    const debounce = window.setTimeout(() => {
      try {
        worker = new Worker(new URL("../tools/regex-tester.worker.ts", import.meta.url), {
          type: "module",
        });
      } catch {
        setCompleted({
          query,
          result: err("WORKER_UNAVAILABLE", "The regex worker could not start."),
        });
        return;
      }

      const complete = (result: ToolResult<RegexTestResult>) => {
        if (watchdog !== undefined) window.clearTimeout(watchdog);
        if (sameQuery(latest.current, query)) setCompleted({ query, result });
      };
      worker.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (!isWorkerResponse(event.data) || event.data.id !== 1) return;
        complete(event.data.result);
      });
      worker.addEventListener("error", () => {
        complete(err("WORKER_FAILED", "The regex worker stopped unexpectedly."));
      });
      watchdog = window.setTimeout(() => {
        worker?.terminate();
        complete(
          err(
            "REGEX_TIMEOUT",
            `The pattern exceeded the ${EXECUTION_TIMEOUT_MS} ms safety limit and was stopped.`,
          ),
        );
      }, EXECUTION_TIMEOUT_MS);
      worker.postMessage({ id: 1, ...query });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(debounce);
      if (watchdog !== undefined) window.clearTimeout(watchdog);
      worker?.terminate();
    };
  }, [completed.query, query]);

  return {
    result: completed.result,
    isProcessing: !sameQuery(completed.query, query),
  };
}

function sameQuery(left: Query, right: Query): boolean {
  return left.pattern === right.pattern && left.input === right.input && left.flags === right.flags;
}

function isWorkerResponse(value: unknown): value is WorkerResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return typeof response.id === "number" && "result" in response;
}
