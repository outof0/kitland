import { runJsonEscape, type JsonEscapeMode } from "@kitland/core";
import { useCallback } from "react";
import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
} from "./useDeferredTextTransform";

/** Debounced web adapter for the bounded JSON string transform. */
export function useJsonEscape(input: string, mode: JsonEscapeMode): DeferredTextTransformState {
  const transform = useCallback((value: string) => runJsonEscape(mode, value), [mode]);
  return useDeferredTextTransform(input, mode, transform);
}
