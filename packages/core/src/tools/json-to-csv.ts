import { err, ok, type ToolResult } from "../result";

export type JsonToCsvOptions = {
  /** Prevent spreadsheet formula interpretation in exported cells. Default: true. */
  readonly escapeFormulae?: boolean;
};

export const JSON_TO_CSV_MAX_INPUT_CHARS = 1_000_000;
export const JSON_TO_CSV_MAX_ROWS = 50_000;
export const JSON_TO_CSV_MAX_COLUMNS = 500;
export const JSON_TO_CSV_MAX_OUTPUT_CHARS = 8_000_000;

/** Convert a JSON object or array of JSON objects to RFC 4180-compatible CSV. */
export function jsonToCsv(source: string, options: JsonToCsvOptions = {}): ToolResult<string> {
  if (source.length > JSON_TO_CSV_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `JSON input exceeds the ${JSON_TO_CSV_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (source.trim().length === 0) return err("EMPTY_INPUT", "Enter JSON records to convert.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (cause) {
    const detail = cause instanceof SyntaxError && cause.message ? ` ${cause.message}` : "";
    return err("INVALID_JSON", `JSON is invalid.${detail}`);
  }

  const rows = Array.isArray(parsed) ? parsed : [parsed];
  if (rows.length > JSON_TO_CSV_MAX_ROWS) {
    return err(
      "TOO_MANY_ROWS",
      `CSV supports up to ${JSON_TO_CSV_MAX_ROWS.toLocaleString()} records.`,
    );
  }
  if (!rows.every(isRecord)) {
    return err(
      "INVALID_RECORDS",
      "CSV conversion requires a JSON object or an array of JSON objects.",
    );
  }

  const headers: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
        if (headers.length > JSON_TO_CSV_MAX_COLUMNS) {
          return err(
            "TOO_MANY_COLUMNS",
            `CSV supports up to ${JSON_TO_CSV_MAX_COLUMNS.toLocaleString()} columns.`,
          );
        }
      }
    }
  }
  if (headers.length === 0) return ok("");

  const escapeFormulae = options.escapeFormulae !== false;
  const lines = [headers.map((header) => csvCell(header, escapeFormulae)).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header], escapeFormulae)).join(","));
  }
  const output = `${lines.join("\r\n")}\r\n`;
  if (output.length > JSON_TO_CSV_MAX_OUTPUT_CHARS) {
    return err(
      "OUTPUT_TOO_LARGE",
      `CSV output exceeds the ${JSON_TO_CSV_MAX_OUTPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  return ok(output);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function csvCell(value: unknown, escapeFormulae: boolean): string {
  const serialized = serializeCell(value);
  const safe =
    escapeFormulae && /^[\t\r\n ]*[=+\-@]/.test(serialized) ? `'${serialized}` : serialized;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

function serializeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
