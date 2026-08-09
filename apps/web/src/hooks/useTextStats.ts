import { getTextStats } from "@kitland/core";
import { useMemo } from "react";

/** Memoized browser adapter for the bounded Text Stats core operation. */
export function useTextStats(input: string) {
  return useMemo(() => getTextStats(input), [input]);
}
