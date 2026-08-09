import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
} from "../hooks/useDeferredTextTransform";
import {
  runEncodingTextTransform,
  type EncodingTextFormat,
  type EncodingTextMode,
  type EncodingTextTool,
} from "./encoding-text-transform";

export type EncodingTextTransformHook = (
  tool: EncodingTextTool,
  mode: EncodingTextMode,
  source: string,
  format: EncodingTextFormat,
  options?: { readonly enabled?: boolean },
) => DeferredTextTransformState;

export function useSyncEncodingTextTransform(
  tool: EncodingTextTool,
  mode: EncodingTextMode,
  source: string,
  format: EncodingTextFormat,
  options?: { readonly enabled?: boolean },
): DeferredTextTransformState {
  const enabled = options?.enabled ?? true;
  return useDeferredTextTransform(
    enabled ? source : "",
    `${tool}:${mode}:${format ?? "default"}`,
    (input) => runEncodingTextTransform(tool, mode, input, format),
  );
}
