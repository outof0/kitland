import { err, ok, type ToolResult } from "../result";
export const TOKEN_MAX_LENGTH = 4096;
export type TokenFormat = "hex" | "base64url";
export function generateToken(
  length: number,
  format: TokenFormat,
  random: (size: number) => Uint8Array,
): ToolResult<string> {
  if (!Number.isInteger(length) || length < 1 || length > TOKEN_MAX_LENGTH)
    return err("INVALID_LENGTH", `Length must be a whole number from 1 to ${TOKEN_MAX_LENGTH}.`);
  if (format !== "hex" && format !== "base64url")
    return err("INVALID_FORMAT", "Choose hex or Base64URL.");
  const bytesNeeded = format === "hex" ? Math.ceil(length / 2) : Math.ceil((length * 3) / 4);
  let bytes: Uint8Array;
  try {
    bytes = random(bytesNeeded);
  } catch {
    return err("ENTROPY_UNAVAILABLE", "Secure random generation is unavailable.");
  }
  if (!(bytes instanceof Uint8Array) || bytes.length !== bytesNeeded)
    return err("INVALID_ENTROPY", "Secure random source returned an invalid buffer.");
  const encoded =
    format === "hex"
      ? Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
      : toBase64Url(bytes);
  return ok(encoded.slice(0, length));
}
function toBase64Url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
