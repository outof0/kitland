import {
  readStorageSnapshot,
  writeStorage,
  type WorkspaceStorageKey,
  type WorkspaceStorageValueMap,
} from "@/lib/storage";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

// The first client render must match the server render. Once hydration has
// committed, use a layout effect in the browser so persisted preferences apply
// before paint without making localStorage part of the render path.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * useState that mirrors localStorage without reading it during render. This
 * keeps SSR and hydration deterministic, then restores a persisted value on
 * mount before subsequent changes are written back.
 */
export function usePersistentState<K extends WorkspaceStorageKey>(
  key: K,
  initial: WorkspaceStorageValueMap[K],
): [
  WorkspaceStorageValueMap[K],
  (
    next:
      | WorkspaceStorageValueMap[K]
      | ((prev: WorkspaceStorageValueMap[K]) => WorkspaceStorageValueMap[K]),
  ) => void,
] {
  const [value, setValue] = useState<WorkspaceStorageValueMap[K]>(() => initial);
  const [restored, setRestored] = useState<{
    key: WorkspaceStorageKey;
    allowAutomaticWrite: boolean;
    userRevision: number;
  } | null>(null);

  useIsomorphicLayoutEffect(() => {
    // Mark this key as restored only after its stored value has been queued.
    // The write effect below therefore cannot replace an existing preference
    // with the deterministic initial value during hydration.
    const snapshot = readStorageSnapshot(key, initial);
    setValue(snapshot.value);
    setRestored({
      key,
      allowAutomaticWrite: snapshot.allowAutomaticWrite,
      userRevision: 0,
    });
  }, [key]);

  useEffect(() => {
    if (restored?.key !== key || (!restored.allowAutomaticWrite && restored.userRevision === 0)) {
      return;
    }
    writeStorage(key, value);
  }, [key, restored, value]);

  const setPersistent = useCallback(
    (
      next:
        | WorkspaceStorageValueMap[K]
        | ((prev: WorkspaceStorageValueMap[K]) => WorkspaceStorageValueMap[K]),
    ) => {
      setRestored((current) => ({
        key,
        allowAutomaticWrite: current?.key === key ? current.allowAutomaticWrite : true,
        userRevision: current?.key === key ? current.userRevision + 1 : 1,
      }));
      setValue((prev) =>
        typeof next === "function"
          ? (next as (previous: WorkspaceStorageValueMap[K]) => WorkspaceStorageValueMap[K])(prev)
          : next,
      );
    },
    [key],
  );

  return [value, setPersistent];
}
