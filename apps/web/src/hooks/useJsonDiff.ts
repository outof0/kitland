import { diffJson, type JsonDiffResult } from "@kitland/core";
import { useEffect, useMemo, useRef, useState } from "react";

export type JsonDiffState = {
  readonly result: ReturnType<typeof diffJson>;
  readonly isProcessing: boolean;
};

const DIFF_DEBOUNCE_MS = 180;

/**
 * Coalesces edits before parsing the two JSON documents.
 *
 * The core engine has hard input, nesting, node, and output limits; delaying
 * this call prevents a parse on each keystroke without ever exposing stale
 * comparison output as current.
 */
export function useJsonDiff(left: string, right: string): JsonDiffState {
  const query = useMemo(() => ({ left, right }), [left, right]);
  const latestQuery = useRef(query);
  latestQuery.current = query;
  const [completed, setCompleted] = useState(() => ({
    query,
    result: diffJson(left, right),
  }));

  useEffect(() => {
    if (completed.query.left === query.left && completed.query.right === query.right) return;

    const timeout = window.setTimeout(() => {
      // A queued callback must not parse a query the user has already replaced.
      if (latestQuery.current.left !== query.left || latestQuery.current.right !== query.right)
        return;
      setCompleted({ query, result: diffJson(query.left, query.right) });
    }, DIFF_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [completed.query.left, completed.query.right, query]);

  const isProcessing = completed.query.left !== left || completed.query.right !== right;
  return { result: isProcessing ? emptyPendingResult() : completed.result, isProcessing };
}

function emptyPendingResult(): ReturnType<typeof diffJson> {
  // The UI gates output while processing. A successful empty result keeps its
  // presentation stable without showing stale differences from a prior query.
  return {
    ok: true,
    value: {
      entries: [],
      summary: { added: 0, removed: 0, changed: 0, total: 0 },
    } satisfies JsonDiffResult,
  };
}
