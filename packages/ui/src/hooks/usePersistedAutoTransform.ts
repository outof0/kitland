import { useCallback, useState } from "react";
import {
  readAutoTransformPreference,
  writeAutoTransformPreference,
} from "../lib/auto-transform-preference";

/**
 * Remembers the Auto rail setting across tools and sessions.
 * Generate tools pass persist=false so they stay explicit-run.
 */
export function usePersistedAutoTransform(
  persist: boolean,
  fallback: boolean,
): [boolean, (next: boolean | ((prev: boolean) => boolean)) => void] {
  const [value, setValue] = useState(() =>
    persist ? (readAutoTransformPreference() ?? fallback) : fallback,
  );

  const setAutoTransform = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        if (persist) writeAutoTransformPreference(resolved);
        return resolved;
      });
    },
    [persist],
  );

  return [value, setAutoTransform];
}
