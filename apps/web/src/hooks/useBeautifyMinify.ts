import { formatJson, type JsonFormatMode } from "@kitland/core";
import { useCallback } from "react";
import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
} from "./useDeferredTextTransform";

export function useBeautifyMinify(
  source: string,
  mode: JsonFormatMode,
  indent: 2 | 4,
): DeferredTextTransformState {
  const transform = useCallback(
    (value: string) => formatJson(value, mode, { indent }),
    [indent, mode],
  );
  return useDeferredTextTransform(source, `${mode}:${indent}`, transform);
}
