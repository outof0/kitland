import { dedupeLines, type DedupeLinesOptions } from "@kitland/core";
import { useMemo } from "react";

export function useDedupeLines(input: string, options: DedupeLinesOptions) {
  return useMemo(() => dedupeLines(input, options), [input, options]);
}
