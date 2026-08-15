import { err, ok, type ToolResult } from "../result";

export const DATE_CALCULATOR_MAX_INPUT_CHARS = 32;
export type DateDiffResult = { days: number; from: string; to: string };
export type DateAddResult = { date: string; days: number };

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function diffIsoDates(from: string, to: string): ToolResult<DateDiffResult> {
  const a = parseIso(from);
  if (!a.ok) return a;
  const b = parseIso(to);
  if (!b.ok) return b;
  const ms = b.value.getTime() - a.value.getTime();
  return ok({ days: Math.round(ms / 86_400_000), from: from.trim(), to: to.trim() });
}

export function addDaysToIsoDate(date: string, daysInput: string): ToolResult<DateAddResult> {
  const d = parseIso(date);
  if (!d.ok) return d;
  if (daysInput.length > DATE_CALCULATOR_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "Day count exceeds the limit.");
  const trimmed = daysInput.trim();
  if (!/^[+-]?\d+$/.test(trimmed)) return err("INVALID_DAYS", "Enter a whole number of days.");
  const days = Number(trimmed);
  if (!Number.isSafeInteger(days) || Math.abs(days) > 365_0000)
    return err("OUT_OF_RANGE", "Day offset is outside the supported range.");
  const next = new Date(d.value.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return ok({ date: toIso(next), days });
}

function parseIso(value: string): ToolResult<Date> {
  if (value.length > DATE_CALCULATOR_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "Date text exceeds the limit.");
  const m = value.trim().match(ISO);
  if (!m) return err("INVALID_DATE", "Use YYYY-MM-DD.");
  const y = Number(m[1]),
    mo = Number(m[2]),
    d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d)
    return err("INVALID_DATE", "That calendar date does not exist.");
  return ok(dt);
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
