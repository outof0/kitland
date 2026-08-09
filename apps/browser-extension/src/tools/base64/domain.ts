import {
  BASE64_MAX_ENCODED_CHARS,
  BASE64_MAX_INPUT_CHARS,
  BASE64_MAX_UTF8_BYTES,
  runBase64,
  type Base64Mode,
  type ToolResult,
} from "@kitland/core";

export type Base64Format = "standard" | "url-safe";

export type TransformQuery = {
  mode: Base64Mode;
  format: Base64Format;
  input: string;
};

export type TransformOutput = {
  result: ToolResult<string>;
  outputByteLength: number;
};

export const SAMPLE_INPUT = "Hello, world!\nTools out. Work on.";

export function inputCharacterLimit(mode: Base64Mode): number {
  return mode === "encode" ? BASE64_MAX_INPUT_CHARS : BASE64_MAX_ENCODED_CHARS;
}

export function inputFileByteLimit(mode: Base64Mode): number {
  return mode === "encode" ? BASE64_MAX_UTF8_BYTES : BASE64_MAX_ENCODED_CHARS;
}

export function runTransform({ mode, format, input }: TransformQuery): TransformOutput {
  const result = runBase64(mode, input, { urlSafe: format === "url-safe" });
  return {
    result,
    outputByteLength: result.ok ? resultByteLength(mode, result.value) : 0,
  };
}

export function canTransferResult(nextMode: Base64Mode, value: string): boolean {
  return value.length <= inputCharacterLimit(nextMode);
}

export function decodeUtf8File(bytes: ArrayBuffer): ToolResult<string> {
  try {
    return {
      ok: true,
      value: new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes),
    };
  } catch {
    return {
      ok: false,
      error: {
        code: "INVALID_UTF8",
        message: "This file is not valid UTF-8 text. Binary files are not supported.",
      },
    };
  }
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resultByteLength(mode: Base64Mode, value: string): number {
  return mode === "encode" ? value.length : new TextEncoder().encode(value).length;
}
