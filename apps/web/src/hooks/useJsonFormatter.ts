import {
  JSON_FORMATTER_MAX_INPUT_CHARS,
  type JsonFormatMode,
  type JsonInspection,
  type ToolError,
} from "@kitland/core";
import {
  isJsonFormatterWorkerResponse,
  type JsonFormatterWorkerRequest,
} from "@/lib/json-formatter-worker-protocol";
import { useEffect, useMemo, useRef, useState } from "react";

export type JsonFormatterState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; inspection: JsonInspection }
  | { status: "error"; kind: "error" | "limit" | "unavailable"; error: ToolError };

type Query = { source: string; indent: 2 | 4 | "tab"; mode: JsonFormatMode };
type Completed = Query & { state: JsonFormatterState };

const INSPECT_DEBOUNCE_MS = 120;
const UNAVAILABLE = {
  code: "WORKER_UNAVAILABLE",
  message: "The local JSON inspector is unavailable. Refresh the page and try again.",
} as const;

export function useJsonFormatter(
  source: string,
  indent: 2 | 4 | "tab",
  mode: JsonFormatMode = "beautify",
): JsonFormatterState {
  const query = useMemo<Query>(() => ({ source, indent, mode }), [indent, mode, source]);
  const requestId = useRef(0);
  const [completed, setCompleted] = useState<Completed>(() => ({
    ...query,
    state: immediateState(source),
  }));

  useEffect(() => {
    const immediate = immediateState(query.source);
    if (immediate.status !== "processing") {
      setCompleted((prev) => {
        if (
          prev.source === query.source &&
          prev.indent === query.indent &&
          prev.mode === query.mode &&
          prev.state.status === immediate.status
        ) {
          return prev;
        }
        return { ...query, state: immediate };
      });
      return;
    }

    setCompleted({ ...query, state: { status: "processing" } });
    let worker: Worker | undefined;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      if (typeof Worker === "undefined") {
        setCompleted({ ...query, state: unavailableState() });
        return;
      }
      try {
        worker = new Worker(new URL("../workers/json-formatter.worker.ts", import.meta.url), {
          type: "module",
        });
      } catch {
        setCompleted({ ...query, state: unavailableState() });
        return;
      }

      const id = requestId.current === Number.MAX_SAFE_INTEGER ? 1 : requestId.current + 1;
      requestId.current = id;
      const fail = () => {
        if (!active) return;
        active = false;
        worker?.terminate();
        setCompleted({ ...query, state: unavailableState() });
      };
      worker.addEventListener("message", (event: MessageEvent<unknown>) => {
        if (!active) return;
        if (!isJsonFormatterWorkerResponse(event.data)) {
          fail();
          return;
        }
        if (event.data.id !== id) return;
        active = false;
        worker?.terminate();
        const result = event.data.result;
        setCompleted({
          ...query,
          state: result.ok
            ? { status: "success", inspection: result.value }
            : { status: "error", kind: errorKind(result.error.code), error: result.error },
        });
      });
      worker.addEventListener("error", fail);
      worker.addEventListener("messageerror", fail);

      const request: JsonFormatterWorkerRequest = {
        type: "inspect",
        id,
        source: query.source,
        indent: query.indent,
        mode: query.mode,
      };
      try {
        worker.postMessage(request);
      } catch {
        fail();
      }
    }, INSPECT_DEBOUNCE_MS);

    return () => {
      active = false;
      window.clearTimeout(timer);
      worker?.terminate();
    };
  }, [query]);

  if (completed.source !== source || completed.indent !== indent || completed.mode !== mode) {
    return immediateState(source);
  }
  return completed.state;
}

function immediateState(source: string): JsonFormatterState {
  if (source.trim().length === 0) return { status: "idle" };
  if (source.length > JSON_FORMATTER_MAX_INPUT_CHARS) {
    return {
      status: "error",
      kind: "limit",
      error: {
        code: "INPUT_TOO_LARGE",
        message: `JSON input exceeds the ${JSON_FORMATTER_MAX_INPUT_CHARS.toLocaleString()} UTF-16 code unit limit.`,
      },
    };
  }
  return { status: "processing" };
}

function unavailableState(): JsonFormatterState {
  return { status: "error", kind: "unavailable", error: UNAVAILABLE };
}

function errorKind(code: string): "error" | "limit" {
  return code === "INPUT_TOO_LARGE" ||
    code === "INPUT_TOO_DEEP" ||
    code === "INPUT_TOO_COMPLEX" ||
    code === "OUTPUT_TOO_LARGE"
    ? "limit"
    : "error";
}
