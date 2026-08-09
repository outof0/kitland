import { jsonToToml } from "@kitland/core";
import { useCallback } from "react";
import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
} from "./useDeferredTextTransform";

export function useJsonToToml(source: string): DeferredTextTransformState {
  const transform = useCallback((value: string) => jsonToToml(value), []);
  return useDeferredTextTransform(source, "toml", transform);
}
