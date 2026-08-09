import type { JsonFormatMode, JsonInspection, ToolError } from "@kitland/core";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type View = "code" | "tree";
export type FeedbackTone = "success" | "error";

export type JsonFormatterState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; inspection: JsonInspection }
  | { status: "error"; kind: "error" | "limit" | "unavailable"; error: ToolError };

export type JsonFormatterHook = (
  source: string,
  indent: 2 | 4,
  mode?: JsonFormatMode,
) => JsonFormatterState;
