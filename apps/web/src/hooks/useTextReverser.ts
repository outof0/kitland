import { reverseText, type TextReverseOptions } from "@kitland/core";
import { useMemo } from "react";

export function useTextReverser(input: string, options: TextReverseOptions) {
  return useMemo(() => reverseText(input, options), [input, options]);
}
