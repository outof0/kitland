import { err, ok, type ToolResult } from "../result";

export const TIMEZONE_CONVERTER_MAX_INPUT_CHARS = 64;
/** Fixed offset minutes east of UTC for a small supported IANA set (no network). */
export const SUPPORTED_TIMEZONES = {
  UTC: 0,
  "America/New_York": -300, // EST fixed; DST not modeled
  "Europe/London": 0,
  "Europe/Paris": 60,
  "Asia/Tokyo": 540,
  "Australia/Sydney": 600,
} as const;
export type SupportedTimezone = keyof typeof SUPPORTED_TIMEZONES;
export type TimezoneConvertResult = {
  sourceIso: string;
  targetIso: string;
  sourceZone: SupportedTimezone;
  targetZone: SupportedTimezone;
};

export function convertTimezone(
  isoLocal: string,
  sourceZone: string,
  targetZone: string,
): ToolResult<TimezoneConvertResult> {
  if (isoLocal.length > TIMEZONE_CONVERTER_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "Datetime text exceeds the limit.");
  if (!(sourceZone in SUPPORTED_TIMEZONES))
    return err(
      "UNSUPPORTED_ZONE",
      `Source zone must be one of: ${Object.keys(SUPPORTED_TIMEZONES).join(", ")}.`,
    );
  if (!(targetZone in SUPPORTED_TIMEZONES))
    return err(
      "UNSUPPORTED_ZONE",
      `Target zone must be one of: ${Object.keys(SUPPORTED_TIMEZONES).join(", ")}.`,
    );
  const trimmed = isoLocal.trim();
  // Accept YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return err("INVALID_DATETIME", "Use YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss.");
  const y = Number(m[1]),
    mo = Number(m[2]),
    d = Number(m[3]);
  const hh = Number(m[4]),
    mm = Number(m[5]),
    ss = Number(m[6] ?? "0");
  if (hh > 23 || mm > 59 || ss > 59)
    return err("INVALID_DATETIME", "Time fields are out of range.");
  const asUtc = Date.UTC(y, mo - 1, d, hh, mm, ss);
  if (Number.isNaN(asUtc)) return err("INVALID_DATETIME", "Could not parse that datetime.");
  // Interpret wall time in source zone: wall = UTC + offset => UTC = wall - offset
  const sourceOffset = SUPPORTED_TIMEZONES[sourceZone as SupportedTimezone];
  const targetOffset = SUPPORTED_TIMEZONES[targetZone as SupportedTimezone];
  const utcMs = asUtc - sourceOffset * 60_000;
  const targetMs = utcMs + targetOffset * 60_000;
  return ok({
    sourceIso: format(asUtc),
    targetIso: format(targetMs),
    sourceZone: sourceZone as SupportedTimezone,
    targetZone: targetZone as SupportedTimezone,
  });
}

function format(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
