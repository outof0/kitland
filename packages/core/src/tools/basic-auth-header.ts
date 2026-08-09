import { err, ok, type ToolResult } from "../result";
export const BASIC_AUTH_MAX_INPUT_CHARS = 100_000;
export function encodeBasicAuth(username: string, password: string): ToolResult<string> {
  if (username.length + password.length > BASIC_AUTH_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "Credentials exceed the allowed size.");
  return ok(
    `Basic ${btoa(new TextEncoder().encode(`${username}:${password}`).reduce((s, b) => s + String.fromCharCode(b), ""))}`,
  );
}
export function decodeBasicAuth(value: string): ToolResult<{ username: string; password: string }> {
  try {
    const raw = value.trim().replace(/^Basic\s+/i, "");
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(atob(raw), (x) => x.charCodeAt(0)),
    );
    const index = text.indexOf(":");
    if (index < 0) throw new Error();
    return ok({ username: text.slice(0, index), password: text.slice(index + 1) });
  } catch {
    return err("INVALID_HEADER", "Enter a valid Basic Authorization header.");
  }
}
