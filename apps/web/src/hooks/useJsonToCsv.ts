import { jsonToCsv } from "@kitland/core";
import { useCallback } from "react";
import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
} from "./useDeferredTextTransform";

export function useJsonToCsv(source: string, escapeFormulae: boolean): DeferredTextTransformState {
  const transform = useCallback(
    (value: string) => jsonToCsv(value, { escapeFormulae }),
    [escapeFormulae],
  );
  return useDeferredTextTransform(source, String(escapeFormulae), transform);
}
