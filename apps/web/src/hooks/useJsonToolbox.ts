import { inspectJson, type ToolResult } from "@kitland/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INSPECT_DEBOUNCE_MS = 180;

export function useJsonToolbox(source: string, indent: 2 | 4) {
  const query = useMemo(() => ({ source, indent }), [indent, source]);
  const latest = useRef(query);
  latest.current = query;
  const inspect = useCallback((value: string, spaces: 2 | 4) => inspectJson(value, spaces), []);
  const [completed, setCompleted] = useState(() => ({ query, result: inspect(source, indent) }));

  useEffect(() => {
    if (completed.query.source === query.source && completed.query.indent === query.indent) return;
    const timeout = window.setTimeout(() => {
      if (latest.current.source !== query.source || latest.current.indent !== query.indent) return;
      setCompleted({ query, result: inspect(query.source, query.indent) });
    }, INSPECT_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [completed.query.indent, completed.query.source, inspect, query]);

  const isProcessing = completed.query.source !== source || completed.query.indent !== indent;
  return {
    result: isProcessing ? pendingResult() : completed.result,
    isProcessing,
  };
}

function pendingResult(): ToolResult<
  ReturnType<typeof inspectJson> extends ToolResult<infer T> ? T : never
> {
  return { ok: false, error: { code: "PROCESSING", message: "Inspecting JSON…" } };
}
