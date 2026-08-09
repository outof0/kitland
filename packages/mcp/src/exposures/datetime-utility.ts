import {
  addDaysToIsoDate,
  calculateAge,
  calculateIpv4Subnet,
  convertColor,
  convertDataSize,
  convertNumberBase,
  convertTemperature,
  convertTimezone,
  decodeBasicAuth,
  diffIsoDates,
  encodeBasicAuth,
  findHttpStatuses,
  formatCurlCommand,
  formatDurationSeconds,
  formatFetchRequest,
  getNextCronRuns,
  lookupMimeTypes,
  ok,
  parseCronExpression,
  parseCurlCommand,
  parseFetchSource,
  parseUnixTimestamp,
  parseUrl,
  parseUserAgent,
  type AgeResult,
  type ColorResult,
  type DataSizeResult,
  type DataSizeUnit,
  type DateAddResult,
  type DateDiffResult,
  type DurationResult,
  type HttpStatus,
  type Ipv4Subnet,
  type MimeLookupResult,
  type NumberBaseResult,
  type ParsedUrl,
  type TemperatureResult,
  type TemperatureUnit,
  type TimezoneConvertResult,
  type ToolResult,
  type UnixTimestamp,
  type UserAgentInspection,
} from "@kitland/core";
import {
  buildAdvertisedOutputSchema,
  DEFAULT_MCP_LIMITS,
  DEFAULT_MCP_SAFETY,
  type McpExposure,
} from "../contracts.ts";
import { createMcpError, type McpErrorPayload } from "../errors.ts";

function mapError(code: string, _message: string): McpErrorPayload {
  if (code === "INPUT_TOO_LARGE") {
    return createMcpError("INPUT_TOO_LARGE", "Input data exceeds the maximum allowed size.");
  }
  return createMcpError(
    "INVALID_INPUT",
    "The operation could not be completed. Check the input format.",
  );
}

type TextOnlyInput = { readonly input: string };
type TextOnlyOutput = { readonly output: string };

const TEXT_ONLY_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Text content to process." },
  },
} as const;

const TEXT_ONLY_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output"],
  properties: {
    output: { type: "string", description: "Transformed text output." },
  },
} as const;

// ---------------------------------------------------------------------------
// Unix Timestamp
// ---------------------------------------------------------------------------

const UNIX_TIMESTAMP_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["seconds", "milliseconds", "iso"],
  properties: {
    seconds: { type: "string", description: "Unix timestamp in seconds." },
    milliseconds: { type: "string", description: "Unix timestamp in milliseconds." },
    iso: { type: "string", description: "ISO 8601 UTC date string." },
  },
} as const;

export const kitlandUnixTimestampParseExposure: McpExposure<TextOnlyInput, UnixTimestamp> = {
  mcpName: "kitland_unix_timestamp_parse",
  operationId: "unix_timestamp_parse",
  contractVersion: 1,
  catalogToolId: "unix-timestamp",
  title: "Unix Timestamp Parser",
  description: "Parse a Unix epoch timestamp (seconds or milliseconds) to ISO datetime.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(UNIX_TIMESTAMP_SUCCESS_SCHEMA),
  successSchema: UNIX_TIMESTAMP_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<UnixTimestamp> => {
    return parseUnixTimestamp(args.input);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Date Calculator (Diff & Add)
// ---------------------------------------------------------------------------

type DateDiffInput = {
  readonly fromDate: string;
  readonly toDate: string;
};

const DATE_DIFF_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["fromDate", "toDate"],
  properties: {
    fromDate: { type: "string", description: "Start date in YYYY-MM-DD format." },
    toDate: { type: "string", description: "End date in YYYY-MM-DD format." },
  },
} as const;

const DATE_DIFF_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["days", "from", "to"],
  properties: {
    days: { type: "integer", description: "Difference in days (positive or negative)." },
    from: { type: "string" },
    to: { type: "string" },
  },
} as const;

export const kitlandDateDiffExposure: McpExposure<DateDiffInput, DateDiffResult> = {
  mcpName: "kitland_date_diff",
  operationId: "date_diff",
  contractVersion: 1,
  catalogToolId: "date-calculator",
  title: "Date Difference Calculator",
  description: "Calculate the exact day difference between two calendar dates (YYYY-MM-DD).",
  inputSchema: DATE_DIFF_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(DATE_DIFF_SUCCESS_SCHEMA),
  successSchema: DATE_DIFF_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: DateDiffInput): ToolResult<DateDiffResult> => {
    return diffIsoDates(args.fromDate, args.toDate);
  },
  mapCoreError: mapError,
};

type DateAddInput = {
  readonly date: string;
  readonly days: number;
};

const DATE_ADD_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["date", "days"],
  properties: {
    date: { type: "string", description: "Base date in YYYY-MM-DD format." },
    days: {
      type: "integer",
      description: "Number of days to add (positive) or subtract (negative).",
    },
  },
} as const;

const DATE_ADD_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["date", "days"],
  properties: {
    date: { type: "string", description: "Resulting date in YYYY-MM-DD format." },
    days: { type: "integer" },
  },
} as const;

export const kitlandDateAddExposure: McpExposure<DateAddInput, DateAddResult> = {
  mcpName: "kitland_date_add",
  operationId: "date_add",
  contractVersion: 1,
  catalogToolId: "date-calculator",
  title: "Date Add Calculator",
  description: "Add or subtract a number of days to/from a calendar date (YYYY-MM-DD).",
  inputSchema: DATE_ADD_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(DATE_ADD_SUCCESS_SCHEMA),
  successSchema: DATE_ADD_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: DateAddInput): ToolResult<DateAddResult> => {
    return addDaysToIsoDate(args.date, String(args.days));
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Age Calculator
// ---------------------------------------------------------------------------

type AgeCalculateInput = {
  readonly birthDate: string;
  readonly referenceDate?: string;
};

const AGE_CALCULATE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["birthDate"],
  properties: {
    birthDate: { type: "string", description: "Birth date in YYYY-MM-DD format." },
    referenceDate: {
      type: "string",
      description: "Optional reference date in YYYY-MM-DD format (default today).",
    },
  },
} as const;

const AGE_CALCULATE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["years", "months", "days", "totalDays"],
  properties: {
    years: { type: "integer" },
    months: { type: "integer" },
    days: { type: "integer" },
    totalDays: { type: "integer" },
  },
} as const;

export const kitlandAgeCalculateExposure: McpExposure<AgeCalculateInput, AgeResult> = {
  mcpName: "kitland_age_calculate",
  operationId: "age_calculate",
  contractVersion: 1,
  catalogToolId: "age-calculator",
  title: "Age Calculator",
  description: "Calculate exact age breakdown (years, months, days, total days) between dates.",
  inputSchema: AGE_CALCULATE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(AGE_CALCULATE_SUCCESS_SCHEMA),
  successSchema: AGE_CALCULATE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: AgeCalculateInput): ToolResult<AgeResult> => {
    const ref = args.referenceDate ?? new Date().toISOString().slice(0, 10);
    return calculateAge(args.birthDate, ref);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Duration Formatter
// ---------------------------------------------------------------------------

type DurationFormatInput = {
  readonly seconds: number;
};

const DURATION_FORMAT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["seconds"],
  properties: {
    seconds: { type: "number", description: "Duration in seconds." },
  },
} as const;

const DURATION_FORMAT_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["seconds", "formatted"],
  properties: {
    seconds: { type: "number" },
    formatted: { type: "string", description: "Formatted duration string (e.g. '1d 2h 3m 4s')." },
  },
} as const;

export const kitlandDurationFormatExposure: McpExposure<DurationFormatInput, DurationResult> = {
  mcpName: "kitland_duration_format",
  operationId: "duration_format",
  contractVersion: 1,
  catalogToolId: "duration-formatter",
  title: "Duration Formatter",
  description: "Format a second count into human-readable days, hours, minutes, and seconds.",
  inputSchema: DURATION_FORMAT_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(DURATION_FORMAT_SUCCESS_SCHEMA),
  successSchema: DURATION_FORMAT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: DurationFormatInput): ToolResult<DurationResult> => {
    return formatDurationSeconds(String(args.seconds));
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Timezone Converter
// ---------------------------------------------------------------------------

type TimezoneConvertInput = {
  readonly datetime: string;
  readonly sourceZone: string;
  readonly targetZone: string;
};

const TIMEZONE_CONVERT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["datetime", "sourceZone", "targetZone"],
  properties: {
    datetime: {
      type: "string",
      description: "Local ISO datetime (e.g. '2026-08-20T12:00' or '2026-08-20T12:00:00').",
    },
    sourceZone: {
      type: "string",
      description:
        "Source timezone ('UTC', 'America/New_York', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney').",
    },
    targetZone: {
      type: "string",
      description:
        "Target timezone ('UTC', 'America/New_York', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney').",
    },
  },
} as const;

const TIMEZONE_CONVERT_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sourceIso", "targetIso", "sourceZone", "targetZone"],
  properties: {
    sourceIso: { type: "string" },
    targetIso: { type: "string" },
    sourceZone: { type: "string" },
    targetZone: { type: "string" },
  },
} as const;

export const kitlandTimezoneConvertExposure: McpExposure<
  TimezoneConvertInput,
  TimezoneConvertResult
> = {
  mcpName: "kitland_timezone_convert",
  operationId: "timezone_convert",
  contractVersion: 1,
  catalogToolId: "timezone-converter",
  title: "Timezone Converter",
  description: "Convert datetime strings between fixed standard timezones locally.",
  inputSchema: TIMEZONE_CONVERT_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TIMEZONE_CONVERT_SUCCESS_SCHEMA),
  successSchema: TIMEZONE_CONVERT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TimezoneConvertInput): ToolResult<TimezoneConvertResult> => {
    return convertTimezone(args.datetime, args.sourceZone, args.targetZone);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Number Base Converter
// ---------------------------------------------------------------------------

type NumberBaseInput = {
  readonly input: string;
  readonly fromBase: number;
  readonly toBase: number;
};

const NUMBER_BASE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input", "fromBase", "toBase"],
  properties: {
    input: { type: "string", description: "Number representation in source base." },
    fromBase: { type: "integer", minimum: 2, maximum: 36, description: "Source base (2 to 36)." },
    toBase: { type: "integer", minimum: 2, maximum: 36, description: "Target base (2 to 36)." },
  },
} as const;

const NUMBER_BASE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["value", "fromBase", "toBase"],
  properties: {
    value: { type: "string", description: "Converted number in target base." },
    fromBase: { type: "integer" },
    toBase: { type: "integer" },
  },
} as const;

export const kitlandNumberBaseConvertExposure: McpExposure<NumberBaseInput, NumberBaseResult> = {
  mcpName: "kitland_number_base_convert",
  operationId: "number_base_convert",
  contractVersion: 1,
  catalogToolId: "number-base",
  title: "Number Base Converter",
  description: "Convert numbers across arbitrary radix bases from base 2 through base 36.",
  inputSchema: NUMBER_BASE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(NUMBER_BASE_SUCCESS_SCHEMA),
  successSchema: NUMBER_BASE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: NumberBaseInput): ToolResult<NumberBaseResult> => {
    return convertNumberBase(args.input, args.fromBase, args.toBase);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Temperature Converter
// ---------------------------------------------------------------------------

type TemperatureInput = {
  readonly value: number;
  readonly fromUnit: "C" | "F" | "K";
};

const TEMPERATURE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["value", "fromUnit"],
  properties: {
    value: { type: "number", description: "Temperature value to convert." },
    fromUnit: { type: "string", enum: ["C", "F", "K"], description: "Source temperature unit." },
  },
} as const;

const TEMPERATURE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["celsius", "fahrenheit", "kelvin"],
  properties: {
    celsius: { type: "number" },
    fahrenheit: { type: "number" },
    kelvin: { type: "number" },
  },
} as const;

export const kitlandTemperatureConvertExposure: McpExposure<TemperatureInput, TemperatureResult> = {
  mcpName: "kitland_temperature_convert",
  operationId: "temperature_convert",
  contractVersion: 1,
  catalogToolId: "temperature",
  title: "Temperature Converter",
  description: "Convert temperature values across Celsius, Fahrenheit, and Kelvin scales.",
  inputSchema: TEMPERATURE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEMPERATURE_SUCCESS_SCHEMA),
  successSchema: TEMPERATURE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TemperatureInput): ToolResult<TemperatureResult> => {
    return convertTemperature(String(args.value), args.fromUnit as TemperatureUnit);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Data Size Converter
// ---------------------------------------------------------------------------

type DataSizeInput = {
  readonly value: number;
  readonly fromUnit: "B" | "KB" | "MB" | "GB" | "TB" | "KiB" | "MiB" | "GiB" | "TiB";
};

const DATA_SIZE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["value", "fromUnit"],
  properties: {
    value: { type: "number", description: "Data size quantity." },
    fromUnit: {
      type: "string",
      enum: ["B", "KB", "MB", "GB", "TB", "KiB", "MiB", "GiB", "TiB"],
      description: "Source unit.",
    },
  },
} as const;

const DATA_SIZE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["bytes", "si", "binary"],
  properties: {
    bytes: { type: "number" },
    si: { type: "string" },
    binary: { type: "string" },
  },
} as const;

export const kitlandDataSizeConvertExposure: McpExposure<DataSizeInput, DataSizeResult> = {
  mcpName: "kitland_data_size_convert",
  operationId: "data_size_convert",
  contractVersion: 1,
  catalogToolId: "data-size",
  title: "Data Size Converter",
  description:
    "Convert data sizes across SI decimal (KB, MB, GB, TB) and binary (KiB, MiB, GiB, TiB) units.",
  inputSchema: DATA_SIZE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(DATA_SIZE_SUCCESS_SCHEMA),
  successSchema: DATA_SIZE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: DataSizeInput): ToolResult<DataSizeResult> => {
    return convertDataSize(String(args.value), args.fromUnit as DataSizeUnit);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Color Converter
// ---------------------------------------------------------------------------

const COLOR_CONVERT_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["hex", "rgb", "hsl", "r", "g", "b"],
  properties: {
    hex: { type: "string" },
    rgb: { type: "string" },
    hsl: { type: "string" },
    r: { type: "integer" },
    g: { type: "integer" },
    b: { type: "integer" },
  },
} as const;

export const kitlandColorConvertExposure: McpExposure<TextOnlyInput, ColorResult> = {
  mcpName: "kitland_color_convert",
  operationId: "color_convert",
  contractVersion: 1,
  catalogToolId: "color-converter",
  title: "Color Converter",
  description: "Convert CSS colors between hex, rgb(), and hsl() notations with RGB channels.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(COLOR_CONVERT_SUCCESS_SCHEMA),
  successSchema: COLOR_CONVERT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<ColorResult> => {
    return convertColor(args.input);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// URL Parser
// ---------------------------------------------------------------------------

const URL_PARSE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "href",
    "origin",
    "protocol",
    "host",
    "hostname",
    "port",
    "pathname",
    "search",
    "hash",
    "params",
  ],
  properties: {
    href: { type: "string" },
    origin: { type: "string" },
    protocol: { type: "string" },
    host: { type: "string" },
    hostname: { type: "string" },
    port: { type: "string" },
    pathname: { type: "string" },
    search: { type: "string" },
    hash: { type: "string" },
    params: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "value"],
        properties: {
          name: { type: "string" },
          value: { type: "string" },
        },
      },
    },
  },
} as const;

export const kitlandUrlParseExposure: McpExposure<TextOnlyInput, ParsedUrl> = {
  mcpName: "kitland_url_parse",
  operationId: "url_parse",
  contractVersion: 1,
  catalogToolId: "url-parser",
  title: "URL Parser",
  description:
    "Parse an absolute URL into its component protocol, host, port, path, and query params.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(URL_PARSE_SUCCESS_SCHEMA),
  successSchema: URL_PARSE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<ParsedUrl> => {
    return parseUrl(args.input);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// HTTP Status Codes
// ---------------------------------------------------------------------------

type HttpStatusLookupInput = {
  readonly query?: string;
};

type HttpStatusLookupOutput = {
  readonly matches: readonly HttpStatus[];
};

const HTTP_STATUS_LOOKUP_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    query: { type: "string", description: "Search query (status code, name, or description)." },
  },
} as const;

const HTTP_STATUS_LOOKUP_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["matches"],
  properties: {
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "code",
          "name",
          "category",
          "description",
          "detail",
          "spec",
          "cacheable",
          "hasResponseBody",
        ],
        properties: {
          code: { type: "integer" },
          name: { type: "string" },
          category: { type: "string" },
          description: { type: "string" },
          detail: { type: "string" },
          spec: { type: "string" },
          cacheable: {},
          hasResponseBody: {},
          commonHeaders: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

export const kitlandHttpStatusLookupExposure: McpExposure<
  HttpStatusLookupInput,
  HttpStatusLookupOutput
> = {
  mcpName: "kitland_http_status_lookup",
  operationId: "http_status_lookup",
  contractVersion: 1,
  catalogToolId: "http-status-codes",
  title: "HTTP Status Code Lookup",
  description: "Look up and search standard HTTP response status codes and RFC specifications.",
  inputSchema: HTTP_STATUS_LOOKUP_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(HTTP_STATUS_LOOKUP_SUCCESS_SCHEMA),
  successSchema: HTTP_STATUS_LOOKUP_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: HttpStatusLookupInput): ToolResult<HttpStatusLookupOutput> => {
    const matches = findHttpStatuses(args.query ?? "");
    return ok({ matches });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// MIME Types Lookup
// ---------------------------------------------------------------------------

type MimeTypeLookupInput = {
  readonly query: string;
};

const MIME_TYPE_LOOKUP_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["query"],
  properties: {
    query: {
      type: "string",
      description: "File extension (e.g. '.png' or 'png') or MIME type string.",
    },
  },
} as const;

const MIME_TYPE_LOOKUP_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["query", "kind", "matches"],
  properties: {
    query: { type: "string" },
    kind: { type: "string" },
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "mime",
          "type",
          "subtype",
          "category",
          "extensions",
          "description",
          "compressible",
          "source",
        ],
        properties: {
          mime: { type: "string" },
          type: { type: "string" },
          subtype: { type: "string" },
          category: { type: "string" },
          extensions: { type: "array", items: { type: "string" } },
          description: { type: "string" },
          charset: { type: "string" },
          compressible: { type: "boolean" },
          source: { type: "string" },
        },
      },
    },
  },
} as const;

export const kitlandMimeTypeLookupExposure: McpExposure<MimeTypeLookupInput, MimeLookupResult> = {
  mcpName: "kitland_mime_type_lookup",
  operationId: "mime_type_lookup",
  contractVersion: 1,
  catalogToolId: "mime-types",
  title: "MIME Types Lookup",
  description: "Look up media MIME types, file extensions, compressibility, and RFC categories.",
  inputSchema: MIME_TYPE_LOOKUP_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(MIME_TYPE_LOOKUP_SUCCESS_SCHEMA),
  successSchema: MIME_TYPE_LOOKUP_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: MimeTypeLookupInput): ToolResult<MimeLookupResult> => {
    return lookupMimeTypes(args.query);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// User Agent Parser
// ---------------------------------------------------------------------------

const USER_AGENT_PARSE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["browser", "engine", "os", "device"],
  properties: {
    browser: {
      type: "object",
      additionalProperties: false,
      required: ["name", "version"],
      properties: { name: { type: "string" }, version: { type: ["string", "null"] } },
    },
    engine: {
      type: "object",
      additionalProperties: false,
      required: ["name", "version"],
      properties: { name: { type: "string" }, version: { type: ["string", "null"] } },
    },
    os: {
      type: "object",
      additionalProperties: false,
      required: ["name", "version"],
      properties: { name: { type: "string" }, version: { type: ["string", "null"] } },
    },
    device: {
      type: "object",
      additionalProperties: false,
      required: ["type", "vendor", "model"],
      properties: {
        type: { type: "string" },
        vendor: { type: ["string", "null"] },
        model: { type: ["string", "null"] },
      },
    },
  },
} as const;

export const kitlandUserAgentParseExposure: McpExposure<TextOnlyInput, UserAgentInspection> = {
  mcpName: "kitland_user_agent_parse",
  operationId: "user_agent_parse",
  contractVersion: 1,
  catalogToolId: "user-agent-parser",
  title: "User Agent Parser",
  description: "Parse browser, engine, OS, and device information from a User-Agent header string.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(USER_AGENT_PARSE_SUCCESS_SCHEMA),
  successSchema: USER_AGENT_PARSE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<UserAgentInspection> => {
    return parseUserAgent(args.input);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Basic Auth Header
// ---------------------------------------------------------------------------

type BasicAuthEncodeInput = {
  readonly username: string;
  readonly password: string;
};

type BasicAuthEncodeOutput = {
  readonly header: string;
};

const BASIC_AUTH_ENCODE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["username", "password"],
  properties: {
    username: { type: "string", description: "Basic Auth username." },
    password: { type: "string", description: "Basic Auth password." },
  },
} as const;

const BASIC_AUTH_ENCODE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["header"],
  properties: {
    header: { type: "string", description: "Authorization: Basic header value." },
  },
} as const;

export const kitlandBasicAuthEncodeExposure: McpExposure<
  BasicAuthEncodeInput,
  BasicAuthEncodeOutput
> = {
  mcpName: "kitland_basic_auth_encode",
  operationId: "basic_auth_encode",
  contractVersion: 1,
  catalogToolId: "basic-auth-header",
  title: "Basic Auth Encode",
  description: "Encode username and password credentials into an HTTP Basic Authorization header.",
  inputSchema: BASIC_AUTH_ENCODE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(BASIC_AUTH_ENCODE_SUCCESS_SCHEMA),
  successSchema: BASIC_AUTH_ENCODE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: BasicAuthEncodeInput): ToolResult<BasicAuthEncodeOutput> => {
    const res = encodeBasicAuth(args.username, args.password);
    if (!res.ok) return res;
    return ok({ header: res.value });
  },
  mapCoreError: mapError,
};

type BasicAuthDecodeOutput = {
  readonly username: string;
  readonly password: string;
};

const BASIC_AUTH_DECODE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["username", "password"],
  properties: {
    username: { type: "string" },
    password: { type: "string" },
  },
} as const;

export const kitlandBasicAuthDecodeExposure: McpExposure<TextOnlyInput, BasicAuthDecodeOutput> = {
  mcpName: "kitland_basic_auth_decode",
  operationId: "basic_auth_decode",
  contractVersion: 1,
  catalogToolId: "basic-auth-header",
  title: "Basic Auth Decode",
  description: "Decode an HTTP Basic Authorization header into username and password credentials.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(BASIC_AUTH_DECODE_SUCCESS_SCHEMA),
  successSchema: BASIC_AUTH_DECODE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<BasicAuthDecodeOutput> => {
    return decodeBasicAuth(args.input);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// cURL / Fetch Converter
// ---------------------------------------------------------------------------

export const kitlandCurlToFetchExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_curl_to_fetch",
  operationId: "curl_to_fetch",
  contractVersion: 1,
  catalogToolId: "curl-converter",
  title: "cURL to Fetch Converter",
  description: "Convert a cURL command into equivalent JavaScript fetch() code.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = parseCurlCommand(args.input);
    if (!res.ok) return res;
    return ok({ output: formatFetchRequest(res.value) });
  },
  mapCoreError: mapError,
};

export const kitlandFetchToCurlExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_fetch_to_curl",
  operationId: "fetch_to_curl",
  contractVersion: 1,
  catalogToolId: "curl-converter",
  title: "Fetch to cURL Converter",
  description: "Convert JavaScript fetch() code into an equivalent cURL command line.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = parseFetchSource(args.input);
    if (!res.ok) return res;
    return ok({ output: formatCurlCommand(res.value) });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Cron Parser
// ---------------------------------------------------------------------------

type CronParseInput = {
  readonly expression: string;
  readonly nextRunsCount?: number;
};

type CronParseOutput = {
  readonly expression: string;
  readonly description: string;
  readonly nextRuns: readonly string[];
};

const CRON_PARSE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["expression"],
  properties: {
    expression: {
      type: "string",
      description: "Five-field Unix cron expression (e.g. '*/5 * * * *').",
    },
    nextRunsCount: {
      type: "integer",
      minimum: 1,
      maximum: 20,
      description: "Number of upcoming executions to compute (default 5).",
    },
  },
} as const;

const CRON_PARSE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["expression", "description", "nextRuns"],
  properties: {
    expression: { type: "string" },
    description: { type: "string" },
    nextRuns: { type: "array", items: { type: "string" } },
  },
} as const;

export const kitlandCronParseExposure: McpExposure<CronParseInput, CronParseOutput> = {
  mcpName: "kitland_cron_parse",
  operationId: "cron_parse",
  contractVersion: 1,
  catalogToolId: "cron-parser",
  title: "Cron Parser",
  description: "Explain Unix 5-field cron schedules and preview next scheduled execution times.",
  inputSchema: CRON_PARSE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(CRON_PARSE_SUCCESS_SCHEMA),
  successSchema: CRON_PARSE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: CronParseInput): ToolResult<CronParseOutput> => {
    const parsed = parseCronExpression(args.expression);
    if (!parsed.ok) return parsed;
    const count = args.nextRunsCount ?? 5;
    const nextRunsRes = getNextCronRuns(parsed.value, new Date(), count);
    const nextRuns = nextRunsRes.ok ? nextRunsRes.value.map((d) => d.toISOString()) : [];
    return ok({
      expression: parsed.value.expression,
      description: parsed.value.description,
      nextRuns,
    });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// IP Subnet Calculator
// ---------------------------------------------------------------------------

const IP_SUBNET_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "cidr",
    "networkCidr",
    "ipAddress",
    "prefixLength",
    "networkAddress",
    "broadcastAddress",
    "subnetMask",
    "wildcardMask",
    "firstHost",
    "lastHost",
    "totalAddresses",
    "usableHosts",
  ],
  properties: {
    cidr: { type: "string" },
    networkCidr: { type: "string" },
    ipAddress: { type: "string" },
    prefixLength: { type: "integer" },
    networkAddress: { type: "string" },
    broadcastAddress: { type: "string" },
    subnetMask: { type: "string" },
    wildcardMask: { type: "string" },
    firstHost: { type: "string" },
    lastHost: { type: "string" },
    totalAddresses: { type: "string" },
    usableHosts: { type: "string" },
  },
} as const;

export const kitlandIpSubnetCalculateExposure: McpExposure<TextOnlyInput, Ipv4Subnet> = {
  mcpName: "kitland_ip_subnet_calculate",
  operationId: "ip_subnet_calculate",
  contractVersion: 1,
  catalogToolId: "ip-subnet-calculator",
  title: "IP Subnet Calculator",
  description:
    "Calculate IPv4 subnet addresses, CIDR ranges, network/broadcast addresses, and host counts.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(IP_SUBNET_SUCCESS_SCHEMA),
  successSchema: IP_SUBNET_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<Ipv4Subnet> => {
    return calculateIpv4Subnet(args.input);
  },
  mapCoreError: mapError,
};

export const DATETIME_UTILITY_EXPOSURES = [
  kitlandUnixTimestampParseExposure,
  kitlandDateDiffExposure,
  kitlandDateAddExposure,
  kitlandAgeCalculateExposure,
  kitlandDurationFormatExposure,
  kitlandTimezoneConvertExposure,
  kitlandNumberBaseConvertExposure,
  kitlandTemperatureConvertExposure,
  kitlandDataSizeConvertExposure,
  kitlandColorConvertExposure,
  kitlandUrlParseExposure,
  kitlandHttpStatusLookupExposure,
  kitlandMimeTypeLookupExposure,
  kitlandUserAgentParseExposure,
  kitlandBasicAuthEncodeExposure,
  kitlandBasicAuthDecodeExposure,
  kitlandCurlToFetchExposure,
  kitlandFetchToCurlExposure,
  kitlandCronParseExposure,
  kitlandIpSubnetCalculateExposure,
] as const;
