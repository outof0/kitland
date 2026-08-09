import { err, ok, type ToolResult } from "../result";

export const DURATION_FORMATTER_MAX_INPUT_CHARS = 64;
export type DurationResult = { seconds: number; formatted: string };

export function formatDurationSeconds(input: string): ToolResult<DurationResult> {
  if (input.length > DURATION_FORMATTER_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "Duration text exceeds the limit.");
  const trimmed = input.trim();
  if (!trimmed) return err("EMPTY_INPUT", "Enter a duration in seconds.");
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed))
    return err("INVALID_NUMBER", "Enter a numeric second count.");
  const seconds = Number(trimmed);
  if (!Number.isFinite(seconds)) return err("INVALID_NUMBER", "Enter a finite duration.");
  if (Math.abs(seconds) > 1e12)
    return err("OUT_OF_RANGE", "Duration is outside the supported range.");
  const sign = seconds < 0 ? "-" : "";
  let rem = Math.abs(Math.trunc(seconds));
  const days = Math.floor(rem / 86400);
  rem %= 86400;
  const hours = Math.floor(rem / 3600);
  rem %= 3600;
  const minutes = Math.floor(rem / 60);
  const secs = rem % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (secs || parts.length === 0) parts.push(`${secs}s`);
  return ok({ seconds, formatted: sign + parts.join(" ") });
}
