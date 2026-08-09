import {
  convertCase,
  dedupeLines,
  formatSql,
  formatXml,
  jsonToCsv,
  jsonToToml,
  jsonToYaml,
  ok,
  reverseText,
  runJsonEscape,
  sortLines,
  yamlToJson,
  type CaseFormat,
  type DedupeLinesOptions,
  type JsonEscapeMode,
  type SortLinesOptions,
  type TextReverseOptions,
} from "@kitland/core";
import { useCallback } from "react";
import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
} from "./useDeferredTextTransform";

export function useCaseConverter(input: string, format: CaseFormat): DeferredTextTransformState {
  const transform = useCallback((value: string) => convertCase(value, format), [format]);
  return useDeferredTextTransform(input, format, transform);
}

export function useSortLines(input: string, options: SortLinesOptions): DeferredTextTransformState {
  const key = `${options.direction ?? "ascending"}:${String(options.caseSensitive)}:${String(options.numeric)}`;
  const transform = useCallback((value: string) => sortLines(value, options), [options]);
  return useDeferredTextTransform(input, key, transform);
}

export function useDedupeLines(
  input: string,
  options: DedupeLinesOptions,
): DeferredTextTransformState {
  const key = `${options.mode ?? "exact"}:${String(options.caseSensitive)}`;
  const transform = useCallback((value: string) => dedupeLines(value, options), [options]);
  return useDeferredTextTransform(input, key, transform);
}

export function useTextReverser(
  input: string,
  options: TextReverseOptions,
): DeferredTextTransformState {
  const key = `${options.mode ?? "characters"}:${options.case ?? "keep"}`;
  const transform = useCallback((value: string) => reverseText(value, options), [options]);
  return useDeferredTextTransform(input, key, transform);
}

export function useJsonEscape(input: string, mode: JsonEscapeMode): DeferredTextTransformState {
  const transform = useCallback((value: string) => runJsonEscape(mode, value), [mode]);
  return useDeferredTextTransform(input, mode, transform);
}

export function useSqlFormatter(
  source: string,
  indent: 2 | 4,
  keywordCase: "upper" | "lower",
): DeferredTextTransformState {
  const transform = useCallback(
    (value: string) => formatSql(value, { indent, keywordCase }),
    [indent, keywordCase],
  );
  return useDeferredTextTransform(source, `${indent}:${keywordCase}`, transform);
}

export function useXmlFormatter(source: string, indent: 2 | 4): DeferredTextTransformState {
  const transform = useCallback(
    (value: string) => {
      const result = formatXml(value, indent);
      return result.ok ? ok(result.value.output) : result;
    },
    [indent],
  );
  return useDeferredTextTransform(source, String(indent), transform);
}

export function useJsonToYaml(source: string, indent: 2 | 4): DeferredTextTransformState {
  const transform = useCallback((value: string) => jsonToYaml(value, indent), [indent]);
  return useDeferredTextTransform(source, String(indent), transform);
}

export function useYamlToJson(source: string, indent: 2 | 4): DeferredTextTransformState {
  const transform = useCallback((value: string) => yamlToJson(value, indent), [indent]);
  return useDeferredTextTransform(source, String(indent), transform);
}

export function useJsonToCsv(source: string, escapeFormulae: boolean): DeferredTextTransformState {
  const transform = useCallback(
    (value: string) => jsonToCsv(value, { escapeFormulae }),
    [escapeFormulae],
  );
  return useDeferredTextTransform(source, String(escapeFormulae), transform);
}

export function useJsonToToml(source: string): DeferredTextTransformState {
  const transform = useCallback((value: string) => jsonToToml(value), []);
  return useDeferredTextTransform(source, "toml", transform);
}
