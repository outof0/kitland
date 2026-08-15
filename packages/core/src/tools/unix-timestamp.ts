import { err, ok, type ToolResult } from "../result";
export type UnixTimestamp = { seconds: string; milliseconds: string; iso: string };
export function parseUnixTimestamp(value: string): ToolResult<UnixTimestamp> {
  if (!/^-?\d{1,15}$/.test(value.trim()))
    return err("INVALID_TIMESTAMP", "Enter a Unix timestamp in seconds or milliseconds.");
  const n = Number(value);
  const ms = Math.abs(n) < 100_000_000_000 ? n * 1000 : n;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime()))
    return err("INVALID_TIMESTAMP", "Timestamp is outside the supported date range.");
  return ok({
    seconds: String(Math.floor(ms / 1000)),
    milliseconds: String(ms),
    iso: d.toISOString(),
  });
}
