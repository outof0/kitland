import { useCallback, useEffect, useState } from "react";
import {
  clearPersistedToolInput,
  readPersistedToolInput,
  writePersistedToolInput,
} from "../lib/tool-input-storage";

/**
 * Hook for managing draft input persistence.
 * Restores saved input on mount (or initial fallback if empty),
 * and automatically synchronizes updates to localStorage or sessionStorage.
 */
export function usePersistedToolInput(
  slug: string,
  initialFallback = "",
): [string, (next: string | ((prev: string) => string)) => void, () => void] {
  const [value, setValue] = useState(() => {
    const saved = readPersistedToolInput(slug);
    return saved !== null ? saved : initialFallback;
  });

  const setValueAndPersist = useCallback(
    (next: string | ((prev: string) => string)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        writePersistedToolInput(slug, resolved);
        return resolved;
      });
    },
    [slug],
  );

  const clearValue = useCallback(() => {
    setValue("");
    clearPersistedToolInput(slug);
  }, [slug]);

  useEffect(() => {
    writePersistedToolInput(slug, value);
  }, [slug, value]);

  return [value, setValueAndPersist, clearValue];
}
