import { sortLines, type SortLinesOptions } from "@kitland/core";
import { useMemo } from "react";

export function useSortLines(input: string, options: SortLinesOptions) {
  return useMemo(() => sortLines(input, options), [input, options]);
}
