import { useEffect, useMemo, useRef, useState } from "react";

export type TextTransformResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } };

export type DeferredTextTransformState = {
  readonly result: TextTransformResult;
  readonly isProcessing: boolean;
};

const TRANSFORM_DEBOUNCE_MS = 180;

/**
 * Coalesce text edits before invoking a bounded synchronous core transform.
 * A stale result is never shown for a new input value.
 */
export function useDeferredTextTransform(
  source: string,
  operationKey: string,
  transform: (source: string) => TextTransformResult,
): DeferredTextTransformState {
  const query = useMemo(() => ({ source, operationKey }), [operationKey, source]);
  const latest = useRef(query);
  latest.current = query;
  const [completed, setCompleted] = useState(() => ({ query, result: transform(source) }));

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
      setCompleted({ query, result: transform(query.source) });
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
