import { err, ok, type ToolResult } from "../result";

export const AGE_CALCULATOR_MAX_INPUT_CHARS = 32;
export type AgeResult = { years: number; months: number; days: number; totalDays: number };

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function calculateAge(birthdate: string, referenceDate: string): ToolResult<AgeResult> {
  const birth = parseIso(birthdate);
  if (!birth.ok) return birth;
  const ref = parseIso(referenceDate);
  if (!ref.ok) return ref;
  if (ref.value.getTime() < birth.value.getTime())
    return err("FUTURE_BIRTHDATE", "Birthdate must be on or before the reference date.");
  let years = ref.value.getUTCFullYear() - birth.value.getUTCFullYear();
  let months = ref.value.getUTCMonth() - birth.value.getUTCMonth();
  let days = ref.value.getUTCDate() - birth.value.getUTCDate();
  if (days < 0) {
    months -= 1;
    const prev = new Date(Date.UTC(ref.value.getUTCFullYear(), ref.value.getUTCMonth(), 0));
    days += prev.getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const totalDays = Math.round((ref.value.getTime() - birth.value.getTime()) / 86_400_000);
  return ok({ years, months, days, totalDays });
}

function parseIso(value: string): ToolResult<Date> {
  if (value.length > AGE_CALCULATOR_MAX_INPUT_CHARS)
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
