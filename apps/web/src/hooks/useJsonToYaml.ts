import { jsonToYaml } from "@kitland/core";
import { useCallback } from "react";
import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
} from "./useDeferredTextTransform";

export function useJsonToYaml(source: string, indent: 2 | 4): DeferredTextTransformState {
  const transform = useCallback((value: string) => jsonToYaml(value, indent), [indent]);
  return useDeferredTextTransform(source, String(indent), transform);
}
