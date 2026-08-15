import type {
  Base64TransformHook,
  Base64TransformState,
} from "@kitland/ui/tools/useSyncBase64Transform";
import { useEffect, useMemo, useRef, useState } from "react";
import { isTransformResponse, type TransformRequest } from "./worker-protocol";

const TRANSFORM_DEBOUNCE_MS = 90;
const EMPTY_STATE: Base64TransformState = {
  result: { ok: true, value: "" },
  outputByteLength: 0,
  inputLineCount: null,
  isProcessing: false,
};

const WORKER_FAILURES = {
  start: "This browser could not start the local conversion worker.",
  runtime: "The local conversion worker stopped. Reopen the extension and try again.",
  protocol: "The local conversion worker returned an invalid result.",
  message: "The local conversion worker could not read the result.",
} as const;

/**
 * Extension base64 engine: the packaged dedicated worker behind the shared
 * Base64Tool component. Same request-id and stale-result guarantees as the
 * web worker hook, but this host keeps its own worker protocol.
 */
export const useWorkerBase64Transform: Base64TransformHook = (
  mode,
  input,
  { enabled, urlSafe },
) => {
  const format: "standard" | "url-safe" = urlSafe ? "url-safe" : "standard";
  const query = useMemo(() => ({ mode, format, input }), [format, input, mode]);
  const queryRef = useRef(query);
  queryRef.current = query;

  const [state, setState] = useState<Base64TransformState>(EMPTY_STATE);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (typeof Worker === "undefined") {
      setState({
        ...EMPTY_STATE,
        result: { ok: false, error: { code: "WORKER_FAILED", message: WORKER_FAILURES.start } },
      });
      return;
    }

    let worker: Worker;
    try {
      worker = new Worker(new URL("./base64.worker.ts", import.meta.url), { type: "module" });
    } catch {
      setState({
        ...EMPTY_STATE,
        result: { ok: false, error: { code: "WORKER_FAILED", message: WORKER_FAILURES.start } },
      });
      return;
    }
    workerRef.current = worker;

    const onMessage = (event: MessageEvent<unknown>) => {
      if (!isTransformResponse(event.data)) {
        setState({
          ...EMPTY_STATE,
          result: {
            ok: false,
            error: { code: "WORKER_PROTOCOL_FAILED", message: WORKER_FAILURES.protocol },
          },
        });
        return;
      }
      if (event.data.id !== requestIdRef.current) return;
      setState({
        result: event.data.result,
        outputByteLength: event.data.outputByteLength,
        inputLineCount: null,
        isProcessing: false,
      });
    };
    const onFailure = (message: string) => {
      setState({
        ...EMPTY_STATE,
        result: { ok: false, error: { code: "WORKER_FAILED", message } },
      });
    };
    const onError = () => onFailure(WORKER_FAILURES.runtime);
    const onMessageError = () => onFailure(WORKER_FAILURES.message);

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.addEventListener("messageerror", onMessageError);

    return () => {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.removeEventListener("messageerror", onMessageError);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY_STATE);
      return;
    }
    setState((prev) => ({ ...prev, isProcessing: true }));
    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(() => {
      const { mode: m, format: f, input: value } = queryRef.current;
      const request: TransformRequest = {
        type: "transform",
        id: requestId,
        mode: m,
        format: f,
        input: value,
      };
      try {
        workerRef.current?.postMessage(request);
      } catch {
        setState({
          ...EMPTY_STATE,
          result: {
            ok: false,
            error: { code: "WORKER_MESSAGE_FAILED", message: WORKER_FAILURES.message },
          },
        });
      }
    }, TRANSFORM_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, query]);

  return state;
};
