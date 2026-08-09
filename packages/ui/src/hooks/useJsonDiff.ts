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
 * When `enabled` is false (Editor mode), no comparison is treated as current:
 * the hook returns a successful empty result without parsing. That keeps
 * Compare-mode results from leaking into Editor mode after an edit.
 */
export function useJsonDiff(
  left: string,
  right: string,
  options: { readonly enabled?: boolean } = {},
): JsonDiffState {
  const enabled = options.enabled ?? true;
  const query = useMemo(() => ({ left, right, enabled }), [enabled, left, right]);
  const latestQuery = useRef(query);
  latestQuery.current = query;
  const [completed, setCompleted] = useState(() => ({
    query,
    result: enabled ? diffJson(left, right) : emptyPendingResult(),
  }));

  useEffect(() => {
    if (
      completed.query.left === query.left &&
      completed.query.right === query.right &&
      completed.query.enabled === query.enabled
    ) {
      return;
    }

    if (!query.enabled) {
      setCompleted({ query, result: emptyPendingResult() });
      return;
    }

    const timeout = window.setTimeout(() => {
      // A queued callback must not parse a query the user has already replaced.
      if (
        latestQuery.current.left !== query.left ||
        latestQuery.current.right !== query.right ||
        !latestQuery.current.enabled
      ) {
        return;
      }
      setCompleted({ query, result: diffJson(query.left, query.right) });
    }, DIFF_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [completed.query.enabled, completed.query.left, completed.query.right, query]);

  const isProcessing =
    enabled &&
    (!completed.query.enabled || completed.query.left !== left || completed.query.right !== right);
  return {
    result: !enabled || isProcessing ? emptyPendingResult() : completed.result,
    isProcessing,
  };
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
