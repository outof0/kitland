import {
  diffText,
  getTextStats,
  renderMarkdown,
  ok,
  testRegex,
  type RegexTestResult,
  type TextDiffResult,
  type ToolResult,
} from "@kitland/core";
import { useMemo } from "react";

export function useMarkdownPreview(source: string) {
  return useMemo(() => renderMarkdown(source), [source]);
}

export function useTextStats(input: string) {
  return useMemo(() => getTextStats(input), [input]);
}

export function useRegexTester(
  pattern: string,
  input: string,
  flags: string,
): { result: ToolResult<RegexTestResult>; isProcessing: boolean } {
  const result = useMemo(() => {
    if (!pattern) {
      return ok({ matches: [], truncated: false });
    }
    if (!input) {
      const test = testRegex(pattern, "", { flags });
      if (!test.ok) return test;
      return ok({ matches: [], truncated: false });
    }
    return testRegex(pattern, input, { flags });
  }, [flags, input, pattern]);

  return { result, isProcessing: false };
}

export function useTextDiff(
  before: string,
  after: string,
): { result: ToolResult<TextDiffResult>; isProcessing: boolean } {
  const result = useMemo(() => diffText(before, after), [after, before]);
  return { result, isProcessing: false };
}
