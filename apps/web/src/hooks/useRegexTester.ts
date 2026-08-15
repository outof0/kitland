import {
  err,
  ok,
  testRegex,
  type RegexTestResult,
  type ToolResult,
} from "@kitland/core";
import {
  isRegexTesterWorkerResponse,
  type RegexTesterWorkerRequest,
} from "@/lib/regex-tester-worker-protocol";
import { useEffect, useMemo, useRef, useState } from "react";

const TEST_DEBOUNCE_MS = 120;
const UNAVAILABLE_ERROR = {
  code: "WORKER_UNAVAILABLE",
  message: "The local regex tester is unavailable. Refresh the page and try again.",
} as const;

type Query = { pattern: string; input: string; flags: string };
type State = { result: ToolResult<RegexTestResult>; isProcessing: boolean };

const EMPTY_MATCHES: RegexTestResult = { matches: [], truncated: false };

/**
 * Web host hook for the shared Regex Tester. User-provided patterns run in a
 * cancellable Web Worker so a catastrophic pattern cannot freeze the page;
 * the synchronous core `testRegex` is only the explicit fallback when workers
 * are unavailable.
 */
export function useRegexTester(pattern: string, input: string, flags: string): State {
  const query = useMemo<Query>(() => ({ pattern, input, flags }), [pattern, input, flags]);
  const requestId = useRef(0);
  const [state, setState] = useState<State>(() => immediateState(query));

  useEffect(() => {
    const immediate = immediateState(query);
    if (!immediate.isProcessing) {
      setState(immediate);
      return;
    }

    setState({ result: { ok: true, value: EMPTY_MATCHES }, isProcessing: true });

    let worker: Worker | undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      if (typeof Worker === "undefined") {
        setState({ result: testRegex(query.pattern, query.input, { flags: query.flags }), isProcessing: false });
        return;
      }
      try {
        worker = new Worker(new URL("../workers/regex-tester.worker.ts", import.meta.url), {
          type: "module",
        });
      } catch {
        setState({ result: err(UNAVAILABLE_ERROR.code, UNAVAILABLE_ERROR.message), isProcessing: false });
        return;
      }

      const id = requestId.current === Number.MAX_SAFE_INTEGER ? 1 : requestId.current + 1;
      requestId.current = id;
      const fail = () => {
        if (!active) return;
        active = false;
        worker?.terminate();
        setState({ result: err(UNAVAILABLE_ERROR.code, UNAVAILABLE_ERROR.message), isProcessing: false });
      };
      worker.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (!active) return;
        if (!isRegexTesterWorkerResponse(event.data)) {
          fail();
          return;
        }
        if (event.data.id !== id) return;
        active = false;
        worker?.terminate();
        setState({ result: event.data.result, isProcessing: false });
      });
      worker.addEventListener("error", fail);
      worker.addEventListener("messageerror", fail);

      const request: RegexTesterWorkerRequest = {
        type: "test",
        id,
        pattern: query.pattern,
        input: query.input,
        flags: query.flags,
      };
      try {
        worker.postMessage(request);
      } catch {
        fail();
      }
    }, TEST_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
      worker?.terminate();
    };
  }, [query]);

  return state;
}

function immediateState(query: Query): State {
  if (query.pattern.length === 0 || query.input.length === 0) {
    return { result: ok(EMPTY_MATCHES), isProcessing: false };
  }
  return { result: { ok: true, value: EMPTY_MATCHES }, isProcessing: true };
}
