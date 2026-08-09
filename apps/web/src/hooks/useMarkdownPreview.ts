import { renderMarkdown } from "@kitland/core";
import { useMemo } from "react";

export function useMarkdownPreview(source: string) {
  return useMemo(() => renderMarkdown(source), [source]);
}
