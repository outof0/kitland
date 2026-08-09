import { formatSql } from "@kitland/core";
import { useCallback } from "react";
import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
  type TextTransformResult,
} from "./useDeferredTextTransform";

export function useSqlFormatter(
  source: string,
  indent: 2 | 4,
  keywordCase: "upper" | "lower",
): DeferredTextTransformState {
  const transform = useCallback(
    (value: string): TextTransformResult => {
      const result = formatSql(value, { indent, keywordCase });
      return result.ok ? { ok: true, value: result.value } : { ok: false, error: result.error };
    },
    [indent, keywordCase],
  );
  return useDeferredTextTransform(source, `${indent}-${keywordCase}`, transform);
}
