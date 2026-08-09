import { err, ok, type ToolResult } from "../result";

export const CRON_MAX_INPUT_CHARS = 500;
export const CRON_MAX_NEXT_RUNS = 20;

type CronFieldName = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";
type CronField = { source: string; values: ReadonlySet<number>; unrestricted: boolean };

export type ParsedCron = {
  expression: string;
  description: string;
  fields: Readonly<Record<CronFieldName, CronField>>;
};

const FIELD_SPECS: Readonly<
  Record<CronFieldName, { min: number; max: number; names?: Readonly<Record<string, number>> }>
> = {
  minute: { min: 0, max: 59 },
  hour: { min: 0, max: 23 },
  dayOfMonth: { min: 1, max: 31 },
  month: {
    min: 1,
    max: 12,
    names: {
      JAN: 1,
      FEB: 2,
      MAR: 3,
      APR: 4,
      MAY: 5,
      JUN: 6,
      JUL: 7,
      AUG: 8,
      SEP: 9,
      OCT: 10,
      NOV: 11,
      DEC: 12,
    },
  },
  dayOfWeek: {
    min: 0,
    max: 7,
    names: { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 },
  },
};

const FIELD_ORDER: readonly CronFieldName[] = [
  "minute",
  "hour",
  "dayOfMonth",
  "month",
  "dayOfWeek",
];

/** Parse a standard five-field Unix cron expression. */
export function parseCronExpression(source: string): ToolResult<ParsedCron> {
  if (source.length > CRON_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "The cron expression is too long.");
  const expression = source.trim().replace(/\s+/g, " ");
  if (!expression) return err("EMPTY_EXPRESSION", "Enter a five-field cron expression.");
  const parts = expression.split(" ");
  if (parts.length !== 5)
    return err(
      "INVALID_FIELD_COUNT",
      "Use exactly five fields: minute hour day-of-month month day-of-week.",
    );

  const fields = {} as Record<CronFieldName, CronField>;
  for (const [index, name] of FIELD_ORDER.entries()) {
    const field = parseField(parts[index] ?? "", name);
    if (!field.ok) return field;
    fields[name] = field.value;
  }
  return ok({ expression, fields, description: describe(fields) });
}

/** Return upcoming local-time occurrences without executing or scheduling anything. */
export function getNextCronRuns(
  parsed: ParsedCron,
  from: Date,
  count = 5,
): ToolResult<readonly Date[]> {
  if (!Number.isInteger(count) || count < 1 || count > CRON_MAX_NEXT_RUNS)
    return err("INVALID_COUNT", "Choose between 1 and " + CRON_MAX_NEXT_RUNS + " preview runs.");
  if (Number.isNaN(from.getTime())) return err("INVALID_DATE", "The preview date is invalid.");

  const candidate = new Date(from);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);
  const results: Date[] = [];
  const maximumChecks = 1_053_120;
  for (let checked = 0; checked < maximumChecks && results.length < count; checked += 1) {
    if (matchesCron(parsed, candidate)) results.push(new Date(candidate));
    candidate.setMinutes(candidate.getMinutes() + 1);
  }
  if (results.length < count)
    return err("NO_UPCOMING_RUNS", "No matching run was found in the next two years.");
  return ok(results);
}

function parseField(source: string, name: CronFieldName): ToolResult<CronField> {
  const spec = FIELD_SPECS[name];
  const parts = source.toUpperCase().split(",");
  if (parts.some((part) => !part))
    return err("INVALID_FIELD", label(name) + " contains an empty list item.");
  const values = new Set<number>();

  for (const part of parts) {
    const [rangeSource, stepSource, extra] = part.split("/");
    if (extra !== undefined || rangeSource === undefined)
      return err("INVALID_FIELD", label(name) + " has an invalid step.");
    const step = stepSource === undefined ? 1 : parseInteger(stepSource, name);
    if (typeof step !== "number" || step < 1)
      return err("INVALID_FIELD", label(name) + " needs a positive step value.");

    let start = spec.min;
    let end = spec.max;
    if (rangeSource !== "*") {
      const range = rangeSource.split("-");
      if (range.length === 1) {
        const value = parseValue(range[0] ?? "", spec, name);
        if (typeof value !== "number") return value;
        start = value;
        end = value;
      } else if (range.length === 2) {
        const left = parseValue(range[0] ?? "", spec, name);
        const right = parseValue(range[1] ?? "", spec, name);
        if (typeof left !== "number") return left;
        if (typeof right !== "number") return right;
        start = left;
        end = right;
        if (start > end) return err("INVALID_RANGE", label(name) + " ranges must increase.");
      } else {
        return err("INVALID_FIELD", label(name) + " has an invalid range.");
      }
    }
    for (let value = start; value <= end; value += step)
      values.add(normalizeDayOfWeek(value, name));
  }
  return ok({ source, values, unrestricted: source === "*" });
}

function parseValue(
  source: string,
  spec: { min: number; max: number; names?: Readonly<Record<string, number>> },
  name: CronFieldName,
): number | ToolResult<never> {
  const named = spec.names?.[source];
  const value = named ?? parseInteger(source, name);
  if (typeof value !== "number") return value;
  if (value < spec.min || value > spec.max)
    return err(
      "VALUE_OUT_OF_RANGE",
      label(name) + " must be between " + spec.min + " and " + spec.max + ".",
    );
  return value;
}

function parseInteger(source: string, name: CronFieldName): number | ToolResult<never> {
  if (!/^\d+$/.test(source))
    return err("INVALID_VALUE", label(name) + " contains an invalid value.");
  const value = Number(source);
  return Number.isSafeInteger(value)
    ? value
    : err("INVALID_VALUE", label(name) + " contains an invalid value.");
}

function normalizeDayOfWeek(value: number, name: CronFieldName): number {
  return name === "dayOfWeek" && value === 7 ? 0 : value;
}

function matchesCron(parsed: ParsedCron, date: Date): boolean {
  const fields = parsed.fields;
  if (!fields.minute.values.has(date.getMinutes()) || !fields.hour.values.has(date.getHours()))
    return false;
  if (!fields.month.values.has(date.getMonth() + 1)) return false;
  const monthDayMatches = fields.dayOfMonth.values.has(date.getDate());
  const weekDayMatches = fields.dayOfWeek.values.has(date.getDay());
  return fields.dayOfMonth.unrestricted || fields.dayOfWeek.unrestricted
    ? monthDayMatches && weekDayMatches
    : monthDayMatches || weekDayMatches;
}

function describe(fields: Readonly<Record<CronFieldName, CronField>>): string {
  const minute =
    fields.minute.source === "*" ? "every minute" : "at minute " + fields.minute.source;
  const hour = fields.hour.source === "*" ? "every hour" : "at hour " + fields.hour.source;
  const day =
    fields.dayOfMonth.source === "*"
      ? "every day of the month"
      : "on day " + fields.dayOfMonth.source + " of the month";
  const month = fields.month.source === "*" ? "every month" : "in month " + fields.month.source;
  const week =
    fields.dayOfWeek.source === "*"
      ? "every day of the week"
      : "on weekday " + fields.dayOfWeek.source;
  return capitalize(minute) + ", " + hour + ", " + day + ", " + month + ", " + week + ".";
}

function label(name: CronFieldName): string {
  return name === "dayOfMonth"
    ? "Day of month"
    : name === "dayOfWeek"
      ? "Day of week"
      : capitalize(name);
}

function capitalize(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
