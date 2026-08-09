import { formatXml, type ToolResult } from "@kitland/core";
import { useCallback } from "react";
import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
  type TextTransformResult,
} from "./useDeferredTextTransform";

export function useXmlFormatter(source: string, indent: 2 | 4): DeferredTextTransformState {
  const transform = useCallback(
    (value: string): TextTransformResult => {
      const result = formatXml(value, indent);
      return result.ok
        ? ({ ok: true, value: result.value.output } satisfies TextTransformResult)
        : ({ ok: false, error: result.error } satisfies ToolResult<string>);
    },
    [indent],
  );
  return useDeferredTextTransform(source, String(indent), transform);
}
