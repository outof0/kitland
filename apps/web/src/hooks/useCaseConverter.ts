import { convertCase, type CaseFormat } from "@kitland/core";
import { useMemo } from "react";

export function useCaseConverter(input: string, format: CaseFormat) {
  return useMemo(() => convertCase(input, format), [format, input]);
}
