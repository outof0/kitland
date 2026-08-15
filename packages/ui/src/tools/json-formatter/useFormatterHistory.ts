import { useCallback, useRef, useState } from "react";

const HISTORY_LIMIT = 100;

/**
 * Undo/redo history for the input editor. Only user edits occupy history;
 * programmatic fills (sample, repair, upload) reset the stack.
 */
export function useFormatterHistory(initial: string) {
  const [state, setState] = useState({ value: initial, canUndo: false, canRedo: false });
  const valueRef = useRef(initial);
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);

  const set = useCallback((next: string) => {
    if (next === valueRef.current) return;
    past.current = [...past.current.slice(-(HISTORY_LIMIT - 1)), valueRef.current];
    future.current = [];
    valueRef.current = next;
    setState({ value: next, canUndo: true, canRedo: false });
  }, []);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (previous === undefined) return;
    future.current = [...future.current, valueRef.current];
    valueRef.current = previous;
    setState({ value: previous, canUndo: past.current.length > 0, canRedo: true });
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next === undefined) return;
    past.current = [...past.current, valueRef.current];
    valueRef.current = next;
    setState({ value: next, canUndo: true, canRedo: future.current.length > 0 });
  }, []);

  const reset = useCallback((next: string) => {
    past.current = [];
    future.current = [];
    valueRef.current = next;
    setState({ value: next, canUndo: false, canRedo: false });
  }, []);

  return { ...state, set, undo, redo, reset };
}
