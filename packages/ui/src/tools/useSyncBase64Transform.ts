import { runBase64, type Base64Mode, type ToolResult } from "@kitland/core";
import { useEffect, useMemo, useRef, useState } from "react";

export type Base64TransformState = {
  result: ToolResult<string>;
  outputByteLength: number;
  inputLineCount: number | null;
  isProcessing: boolean;
};

export type Base64TransformOptions = {
  /** Skip the transform for a value already rejected by the UI size gate. */
  enabled: boolean;
  urlSafe: boolean;
};

export type Base64TransformHook = (
  mode: Base64Mode,
  input: string,
  options: Base64TransformOptions,
) => Base64TransformState;

const TRANSFORM_DEBOUNCE_MS = 100;
const EMPTY_RESULT: ToolResult<string> = { ok: true, value: "" };

function getOutputByteLength(mode: Base64Mode, result: ToolResult<string>): number {
  if (!result.ok) return 0;
  return mode === "encode" ? result.value.length : new TextEncoder().encode(result.value).length;
}

/**
 * Default host transform: bounded synchronous core call with the same debounce
 * and stale-result guarantees as the web worker hook. Hosts that run the codec
 * in a worker pass their own hook with this signature instead.
 */
export const useSyncBase64Transform: Base64TransformHook = (mode, input, { enabled, urlSafe }) => {
  const query = useMemo(() => ({ mode, input, urlSafe }), [input, mode, urlSafe]);
  const queryRef = useRef(query);
  queryRef.current = query;

  const [state, setState] = useState<Base64TransformState>(() => ({
    result: runBase64(mode, input, { urlSafe }),
    outputByteLength: 0,
    inputLineCount: null,
    isProcessing: false,
  }));

  useEffect(() => {
    if (!enabled) {
      setState({
        result: EMPTY_RESULT,
        outputByteLength: 0,
        inputLineCount: null,
        isProcessing: false,
      });
      return;
    }
    setState((prev) => ({ ...prev, isProcessing: true }));
    const timer = window.setTimeout(() => {
      const { mode: m, input: value, urlSafe: safe } = queryRef.current;
      const result = runBase64(m, value, { urlSafe: safe });
      setState({
        result,
        outputByteLength: getOutputByteLength(m, result),
        inputLineCount: null,
        isProcessing: false,
      });
    }, TRANSFORM_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, query]);

  return state;
};
