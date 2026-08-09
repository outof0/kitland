import { useEffect, useMemo, useRef, useState } from "react";

export type TextTransformResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } };

export type DeferredTextTransformState = {
  readonly result: TextTransformResult;
  readonly isProcessing: boolean;
};

const TRANSFORM_DEBOUNCE_MS = 180;

const EMPTY_RESULT: TextTransformResult = { ok: true, value: "" };

/**
 * Coalesce text edits before invoking a bounded synchronous core transform.
 * A stale result is never shown for a new input value. Empty input never
 * runs the transform or surfaces an error: the editor presents it as a quiet
 * "waiting for input" state instead of validating before the user types.
 */
export function useDeferredTextTransform(
  source: string,
  operationKey: string,
  transform: (source: string) => TextTransformResult,
): DeferredTextTransformState {
  const query = useMemo(() => ({ source, operationKey }), [operationKey, source]);
  const latest = useRef(query);
  latest.current = query;
  const [completed, setCompleted] = useState(() => ({
    query,
    result: query.source.length > 0 ? transform(query.source) : EMPTY_RESULT,
  }));

  useEffect(() => {
    if (
      completed.query.source === query.source &&
      completed.query.operationKey === query.operationKey
    ) {
      return;
    }
    const timeout = window.setTimeout(() => {
      if (
        latest.current.source !== query.source ||
        latest.current.operationKey !== query.operationKey
      ) {
        return;
      }
      setCompleted({
        query,
        result: query.source.length > 0 ? transform(query.source) : EMPTY_RESULT,
      });
    }, TRANSFORM_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [completed.query.operationKey, completed.query.source, query, transform]);

  const isProcessing =
    completed.query.source !== source || completed.query.operationKey !== operationKey;
  return {
    result: isProcessing ? { ok: true, value: "" } : completed.result,
    isProcessing,
  };
}
