import { err, ok, type ToolResult } from "../result";
export const JWT_MAX_INPUT_CHARS = 100_000;
export type JwtInspection = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  expiresAt: Date | null;
  issuedAt: Date | null;
};
export function inspectJwt(token: string): ToolResult<JwtInspection> {
  if (token.length > JWT_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "JWT exceeds the allowed size.");
  const parts = token.trim().split(".");
  if (parts.length !== 3)
    return err("INVALID_JWT", "JWT must have header, payload, and signature segments.");
  const header = parse(parts[0] ?? ""),
    payload = parse(parts[1] ?? "");
  if (!header.ok) return header;
  if (!payload.ok) return payload;
  return ok({
    header: header.value,
    payload: payload.value,
    signature: parts[2] ?? "",
    expiresAt: numericDate(payload.value.exp),
    issuedAt: numericDate(payload.value.iat),
  });
}
function parse(segment: string): ToolResult<Record<string, unknown>> {
  try {
    const padded =
      segment.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((segment.length + 3) % 4);
    const value: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        Uint8Array.from(atob(padded), (x) => x.charCodeAt(0)),
      ),
    );
    if (!value || Array.isArray(value) || typeof value !== "object")
      return err("INVALID_JWT", "JWT JSON segments must be objects.");
    return ok(value as Record<string, unknown>);
  } catch {
    return err("INVALID_JWT", "JWT segments must be valid Base64URL JSON.");
  }
}
function numericDate(value: unknown): Date | null {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value * 1000) : null;
}
