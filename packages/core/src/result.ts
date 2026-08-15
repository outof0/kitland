/**
 * Discriminated result for pure tool operations.
 * UI and adapters map this to toast / banner / field errors.
 */
export type ToolError = {
  code: string;
  message: string;
};

export type ToolResult<T> = { ok: true; value: T } | { ok: false; error: ToolError };

export function ok<T>(value: T): ToolResult<T> {
  return { ok: true, value };
}

export function err<T = never>(code: string, message: string): ToolResult<T> {
  return { ok: false, error: { code, message } };
}
