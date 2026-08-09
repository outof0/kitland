import { defineTool } from "../define-tool";
import type { ToolDefinition } from "../types";

const multiHostTransformPlatforms = Object.freeze({
  web: {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write"] as const,
  },
  "browser-extension": {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write"] as const,
  },
  "vscode-extension": {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write", "active-editor"] as const,
  },
});

const multiHostInspectPlatforms = Object.freeze({
  web: {
    status: "available" as const,
    capabilities: ["inspect-text", "clipboard-write"] as const,
  },
  "browser-extension": {
    status: "available" as const,
    capabilities: ["inspect-text", "clipboard-write"] as const,
  },
  "vscode-extension": {
    status: "available" as const,
    capabilities: ["inspect-text", "clipboard-write", "active-editor"] as const,
  },
});

export const unixTimestampTool = defineTool({
  id: "unix-timestamp",
  slug: "unix-timestamp",
  name: "Unix Timestamp",
  shortName: "Unix Timestamp",
  family: "time-network",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert Unix seconds or milliseconds to ISO 8601 timestamps locally.",
  keywords: ["unix", "timestamp", "date", "epoch"],
  designFrame: "Unix Timestamp (p3FVq)",
  platforms: multiHostTransformPlatforms,
} as const);

export const dateCalculatorTool = defineTool({
  id: "date-calculator",
  slug: "date-calculator",
  name: "Date Calculator",
  shortName: "Date Calculator",
  family: "time-network",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Calculate day offsets and differences between ISO dates locally.",
  keywords: ["date", "calculator", "duration"],
  designFrame: "Date Calculator (WE1Ij)",
  platforms: multiHostInspectPlatforms,
} as const);

export const ageCalculatorTool = defineTool({
  id: "age-calculator",
  slug: "age-calculator",
  name: "Age Calculator",
  shortName: "Age Calculator",
  family: "time-network",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Calculate exact age in years, months, and days between two dates locally.",
  keywords: ["age", "date", "calculator"],
  designFrame: "Age Calculator (XjVrH)",
  platforms: multiHostInspectPlatforms,
} as const);

export const durationFormatterTool = defineTool({
  id: "duration-formatter",
  slug: "duration-formatter",
  name: "Duration Formatter",
  shortName: "Duration Formatter",
  family: "time-network",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Format second counts into day/hour/minute/second labels locally.",
  keywords: ["duration", "time", "format"],
  designFrame: "Duration Formatter (dVb5J)",
  platforms: multiHostTransformPlatforms,
} as const);

export const timezoneConverterTool = defineTool({
  id: "timezone-converter",
  slug: "timezone-converter",
  name: "Timezone Converter",
  shortName: "Timezone Converter",
  family: "time-network",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert wall times between a fixed set of IANA zones locally (no network).",
  keywords: ["timezone", "time", "convert", "utc"],
  designFrame: "Timezone Converter (qYlMU)",
  platforms: multiHostTransformPlatforms,
} as const);

export const numberBaseTool = defineTool({
  id: "number-base",
  slug: "number-base",
  name: "Number Base",
  shortName: "Number Base",
  family: "time-network",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert integers between binary, octal, decimal, hex, and bases 2–36 locally.",
  keywords: ["number", "base", "binary", "hex"],
  designFrame: "Number Base (vY4K3)",
  platforms: multiHostTransformPlatforms,
} as const);

export const temperatureTool = defineTool({
  id: "temperature",
  slug: "temperature",
  name: "Temperature",
  shortName: "Temperature",
  family: "time-network",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert temperatures between Celsius, Fahrenheit, and Kelvin locally.",
  keywords: ["temperature", "celsius", "fahrenheit", "kelvin"],
  designFrame: "Temperature (EWuTR)",
  platforms: multiHostTransformPlatforms,
} as const);

export const dataSizeTool = defineTool({
  id: "data-size",
  slug: "data-size",
  name: "Data Size",
  shortName: "Data Size",
  family: "time-network",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert data sizes across SI and binary units locally.",
  keywords: ["data", "bytes", "kb", "mb", "size"],
  designFrame: "Data Size (d07Zls)",
  platforms: multiHostTransformPlatforms,
} as const);

export const colorConverterTool = defineTool({
  id: "color-converter",
  slug: "color-converter",
  name: "Color Converter",
  shortName: "Color Converter",
  family: "time-network",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert and inspect color values between Hex, RGB, and HSL locally.",
  keywords: ["color", "hex", "rgb", "hsl"],
  designFrame: "Color Converter (kX9ZC)",
  platforms: multiHostTransformPlatforms,
} as const);

export const urlParserTool = defineTool({
  id: "url-parser",
  slug: "url-parser",
  name: "URL Parser",
  shortName: "URL Parser",
  family: "time-network",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Parse, inspect, and decode URL components and query parameters locally.",
  keywords: ["url", "parse", "query", "host"],
  designFrame: "URL Parser (H1TZfA)",
  platforms: multiHostTransformPlatforms,
} as const);

export const httpStatusCodesTool = defineTool({
  id: "http-status-codes",
  slug: "http-status-codes",
  name: "HTTP Status Codes",
  shortName: "HTTP Status",
  family: "time-network",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Look up, search, and inspect standard HTTP response status codes locally.",
  keywords: ["http", "status", "response", "codes"],
  designFrame: "HTTP Status Codes (LjXun)",
  platforms: multiHostTransformPlatforms,
} as const);

export const mimeTypesTool = defineTool({
  id: "mime-types",
  slug: "mime-types",
  name: "MIME Types",
  shortName: "MIME Types",
  family: "time-network",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Look up standard MIME media types and corresponding file extensions locally.",
  keywords: ["mime", "content-type", "extension"],
  designFrame: "MIME Types (A9PoHZ)",
  platforms: multiHostTransformPlatforms,
} as const);

export const userAgentParserTool = defineTool({
  id: "user-agent-parser",
  slug: "user-agent-parser",
  name: "User Agent Parser",
  shortName: "User Agent",
  family: "time-network",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Parse browser and device details from a user-agent string locally.",
  keywords: ["user-agent", "browser", "device", "parse"],
  designFrame: "User Agent Parser (pjnzX)",
  platforms: multiHostTransformPlatforms,
} as const);

export const basicAuthHeaderTool = defineTool({
  id: "basic-auth-header",
  slug: "basic-auth-header",
  name: "Basic Auth Header",
  shortName: "Basic Auth",
  family: "hash-crypto",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Build or inspect Basic Authorization headers for HTTP authentication locally.",
  keywords: ["basic", "auth", "header", "authorization"],
  designFrame: "Basic Auth Header (eYC3i)",
  platforms: multiHostTransformPlatforms,
} as const);

export const curlConverterTool = defineTool({
  id: "curl-converter",
  slug: "curl-converter",
  name: "cURL Converter",
  shortName: "cURL Converter",
  family: "time-network",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert a portable cURL request into copy-ready Fetch code locally.",
  keywords: ["curl", "http", "request", "fetch", "convert"],
  designFrame: "cURL Converter (J2LJzD)",
  platforms: {
    web: {
      status: "available",
      capabilities: ["transform-text", "clipboard-write"],
    },
    "browser-extension": {
      status: "available",
      capabilities: ["transform-text", "clipboard-write"],
    },
    "vscode-extension": {
      status: "available",
      capabilities: ["transform-text", "clipboard-write", "active-editor"],
    },
  },
} as const);

export const cronParserTool = defineTool({
  id: "cron-parser",
  slug: "cron-parser",
  name: "Cron Parser",
  shortName: "Cron Parser",
  family: "time-network",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Explain five-field Unix cron schedules and preview their local-time runs.",
  keywords: ["cron", "schedule", "time", "parser"],
  designFrame: "Cron Parser (XENy7)",
  platforms: multiHostTransformPlatforms,
} as const);

export const ipSubnetCalculatorTool = defineTool({
  id: "ip-subnet-calculator",
  slug: "ip-subnet-calculator",
  name: "IP Subnet Calculator",
  shortName: "IP Subnet",
  family: "time-network",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Calculate IPv4 CIDR ranges, masks, and usable host counts locally.",
  keywords: ["ip", "subnet", "cidr", "network", "ipv4"],
  designFrame: "IP Subnet Calculator (CZ1jx)",
  platforms: multiHostTransformPlatforms,
} as const);

export const datetimeUtilityTools = [
  unixTimestampTool,
  dateCalculatorTool,
  ageCalculatorTool,
  durationFormatterTool,
  timezoneConverterTool,
  numberBaseTool,
  temperatureTool,
  dataSizeTool,
  colorConverterTool,
  urlParserTool,
  httpStatusCodesTool,
  mimeTypesTool,
  userAgentParserTool,
  basicAuthHeaderTool,
  curlConverterTool,
  cronParserTool,
  ipSubnetCalculatorTool,
] as const satisfies readonly ToolDefinition[];
