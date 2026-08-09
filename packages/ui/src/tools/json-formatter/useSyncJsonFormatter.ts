import { inspectJson, JSON_FORMATTER_MAX_INPUT_CHARS, type JsonFormatMode } from "@kitland/core";
import { useMemo } from "react";
import type { JsonFormatterState } from "./types";

export function useSyncJsonFormatter(
  source: string,
  indent: 2 | 4,
  mode: JsonFormatMode = "beautify",
): JsonFormatterState {
  return useMemo(() => {
    if (source.trim().length === 0) return { status: "idle" };
    if (source.length > JSON_FORMATTER_MAX_INPUT_CHARS) {
      return {
        status: "error",
        kind: "limit",
        error: {
          code: "INPUT_TOO_LARGE",
          message: `JSON input exceeds the ${JSON_FORMATTER_MAX_INPUT_CHARS.toLocaleString()} UTF-16 code unit limit.`,
        },
      };
    }
    const result = inspectJson(source, indent, mode);
    if (result.ok) {
      return { status: "success", inspection: result.value };
    }
    const code = result.error.code;
    const kind =
      code === "INPUT_TOO_LARGE" ||
      code === "INPUT_TOO_DEEP" ||
      code === "INPUT_TOO_COMPLEX" ||
      code === "OUTPUT_TOO_LARGE"
        ? "limit"
        : "error";
    return { status: "error", kind, error: result.error };
  }, [source, indent, mode]);
}
