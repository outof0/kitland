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

/**
 * Runs a worker per settled edit. Cleanup terminates the previous worker, so a
 * stale result can never replace the current query and React state changes are
 * only made by timer or worker callbacks.
 */
export function useBase64Transform(
  mode: Base64Mode,
  input: string,
  { enabled, urlSafe }: Base64TransformOptions,
): Base64TransformState {
  const query = useMemo<TransformQuery>(() => ({ mode, input, urlSafe }), [input, mode, urlSafe]);
  const [completed, setCompleted] = useState<CompletedTransform>(() => {
    const result = initialResult(mode, input, urlSafe);
    return {
      ...query,
      result,
      outputByteLength: getOutputByteLength(mode, result),
      inputLineCount: countBase64InputLines(input),
    };
  });
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || query.input.length === 0 || sameQuery(completed, query)) {
      return;
    }

    let worker: Worker | undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      if (typeof Worker === "undefined") {
        setCompleted(toCompleted(query, err("WORKER_UNAVAILABLE", WORKER_UNAVAILABLE_MESSAGE)));
        return;
      }
      try {
        worker = new Worker(new URL("../workers/base64.worker.ts", import.meta.url), {
          type: "module",
        });
      } catch {
        setCompleted(toCompleted(query, err("WORKER_UNAVAILABLE", WORKER_UNAVAILABLE_MESSAGE)));
        return;
      }

      const id = requestIdRef.current === Number.MAX_SAFE_INTEGER ? 1 : requestIdRef.current + 1;
      requestIdRef.current = id;
      const fail = (failure: WorkerFailure) => {
        if (!active) return;
        active = false;
        worker?.terminate();
        setCompleted(toCompleted(query, err(failure.code, failure.message)));
      };
      worker.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (!active) return;
        if (!isBase64WorkerResponse(event.data) || event.data.id !== id) {
          fail(WORKER_FAILURES.protocol);
          return;
        }

        active = false;
        worker?.terminate();
        setCompleted(
          toCompleted(query, event.data.result, {
            outputByteLength: event.data.outputByteLength,
            inputLineCount: event.data.inputLineCount,
          }),
        );
      });
      worker.addEventListener("error", () => fail(WORKER_FAILURES.runtime));
      worker.addEventListener("messageerror", () => fail(WORKER_FAILURES.message));

      const request: Base64WorkerRequest = {
        type: "transform",
        id,
        mode: query.mode,
        input: query.input,
        urlSafe: query.urlSafe,
      };
      try {
        worker.postMessage(request);
      } catch {
        fail(WORKER_FAILURES.message);
      }
    }, TRANSFORM_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
      worker?.terminate();
    };
  }, [completed, enabled, query]);

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
