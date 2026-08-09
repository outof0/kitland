import { yamlToJson } from "@kitland/core";
import { useCallback } from "react";
import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
} from "./useDeferredTextTransform";

export function useYamlToJson(source: string, indent: 2 | 4): DeferredTextTransformState {
  const transform = useCallback((value: string) => yamlToJson(value, indent), [indent]);
  return useDeferredTextTransform(source, String(indent), transform);
}
