/**
 * Host-neutral tool map for browser-extension and VS Code simple adapters.
 * Specs return string results (structured tools are serialized for host UIs).
 */
import { err, type ToolResult } from "./result";
import type { HostTransformSpec } from "./host-types";
import { formatJson, type JsonFormatMode } from "./tools/beautify-minify";
import { jsonToYaml } from "./tools/json-to-yaml";
import { yamlToJson } from "./tools/yaml-to-json";
import { jsonToCsv } from "./tools/json-to-csv";
import { jsonToToml } from "./tools/json-to-toml";
import { formatXml } from "./tools/xml-formatter";
import { formatSql } from "./tools/sql-formatter";
import {
  runHtmlEntityTransform,
  type HtmlEntityFormat,
  type HtmlEntityMode,
} from "./tools/html-entities";
import { runHexTextTransform, type HexTextFormat, type HexTextMode } from "./tools/hex-text";
import { runUnicodeConverter, type UnicodeConverterMode } from "./tools/unicode-converter";
import { runBinaryTextTransform, type BinaryTextMode } from "./tools/binary-text";
import { runRot13Caesar, type Rot13CaesarMode } from "./tools/rot13-caesar";
import { runMorseCode, type MorseMode } from "./tools/morse-code";
import { convertCase, type CaseFormat } from "./tools/case-converter";
import { sortLines } from "./tools/sort-lines";
import { dedupeLines } from "./tools/dedupe-lines";
import { reverseText } from "./tools/text-reverser";
import { jsonToTypescript } from "./tools/json-to-typescript";
import { jsonToJsConst } from "./tools/json-to-js-const";
import { htmlToJsx } from "./tools/html-to-jsx";
import { splitToNewlines, type SplitDelimiter } from "./tools/split-to-newlines";
import { joinLines, type JoinDelimiter } from "./tools/join-lines";
import { convertNumberBase } from "./tools/number-base";
import { convertTemperature, type TemperatureUnit } from "./tools/temperature";
import { convertDataSize, type DataSizeUnit } from "./tools/data-size";
import { convertColor } from "./tools/color-converter";
import { formatDurationSeconds } from "./tools/duration-formatter";
import { convertTimezone } from "./tools/timezone-converter";
import { HOST_EXTRA_TOOL_SPECS } from "./host-extra-tools.ts";

export type { HostTransformRequest, HostTransformSpec } from "./host-types";

function singleRun(
  slug: string,
  label: string,
  maxInputChars: number,
  run: (input: string) => ToolResult<string>,
): HostTransformSpec {
  return {
    slug,
    maxInputChars,
    operations: [{ id: "run", label, actionLabel: label }],
    options: [{ id: "default", label: "Default" }],
    optionLabel: "Mode",
    defaultOperationId: "run",
    defaultOptionId: "default",
    transform: (request) => {
      if (request.operationId !== "run") return err("INVALID_OPERATION", `Choose ${label}.`);
      return run(request.input);
    },
  };
}

function encodeDecode(
  slug: string,
  maxInputChars: number,
  run: (mode: "encode" | "decode", input: string, optionId: string) => ToolResult<string>,
  options: readonly { id: string; label: string }[] = [{ id: "default", label: "Default" }],
  optionLabel = "Format",
): HostTransformSpec {
  return {
    slug,
    maxInputChars,
    operations: [
      { id: "encode", label: "Encode", actionLabel: "Encode" },
      { id: "decode", label: "Decode", actionLabel: "Decode" },
    ],
    options,
    optionLabel,
    defaultOperationId: "encode",
    defaultOptionId: options[0]?.id ?? "default",
    transform: (request) => {
      if (request.operationId !== "encode" && request.operationId !== "decode") {
        return err("INVALID_OPERATION", "Choose Encode or Decode.");
      }
      return run(request.operationId, request.input, request.optionId);
    },
  };
}

/** Pure transforms + remaining suite tools for multi-host generic adapters. */
const HOST_CORE_TRANSFORM_SPECS: readonly HostTransformSpec[] = [
  {
    slug: "beautify-minify",
    maxInputChars: 1_000_000,
    operations: [
      { id: "beautify", label: "Beautify", actionLabel: "Beautify" },
      { id: "minify", label: "Minify", actionLabel: "Minify" },
    ],
    options: [
      { id: "2", label: "2 spaces" },
      { id: "4", label: "4 spaces" },
    ],
    optionLabel: "Indent",
    defaultOperationId: "beautify",
    defaultOptionId: "2",
    transform: (request) => {
      const mode = request.operationId as JsonFormatMode;
      if (mode !== "beautify" && mode !== "minify") {
        return err("INVALID_OPERATION", "Choose Beautify or Minify.");
      }
      const indent = request.optionId === "4" ? 4 : 2;
      return formatJson(request.input, mode, { indent });
    },
  },
  singleRun("json-to-yaml", "Convert", 1_000_000, (input) => jsonToYaml(input)),
  singleRun("yaml-to-json", "Convert", 1_000_000, (input) => yamlToJson(input)),
  singleRun("json-to-csv", "Convert", 1_000_000, (input) => jsonToCsv(input)),
  singleRun("json-to-toml", "Convert", 1_000_000, (input) => jsonToToml(input)),
  singleRun("xml-formatter", "Format", 1_000_000, (input) => {
    const result = formatXml(input);
    return result.ok ? { ok: true, value: result.value.output } : result;
  }),
  singleRun("sql-formatter", "Format", 500_000, (input) => formatSql(input)),
  encodeDecode(
    "html-entities",
    2_000_000,
    (mode, input, optionId) =>
      runHtmlEntityTransform(mode as HtmlEntityMode, input, {
        format: (optionId as HtmlEntityFormat) || "named",
      }),
    [
      { id: "named", label: "Named" },
      { id: "decimal", label: "Decimal" },
      { id: "hexadecimal", label: "Hex" },
    ],
  ),
  encodeDecode(
    "hex-text",
    2_000_000,
    (mode, input, optionId) =>
      runHexTextTransform(mode as HexTextMode, input, {
        format: optionId === "compact" ? "compact" : "spaced",
      } as { format?: HexTextFormat }),
    [
      { id: "spaced", label: "Spaced" },
      { id: "compact", label: "Compact" },
    ],
  ),
  encodeDecode("unicode-converter", 500_000, (mode, input) =>
    runUnicodeConverter(mode as UnicodeConverterMode, input),
  ),
  encodeDecode("binary-text", 500_000, (mode, input) =>
    runBinaryTextTransform(mode as BinaryTextMode, input),
  ),
  encodeDecode("rot13-caesar", 2_000_000, (mode, input) =>
    runRot13Caesar(mode as Rot13CaesarMode, input),
  ),
  encodeDecode("morse-code", 100_000, (mode, input) => runMorseCode(mode as MorseMode, input)),
  {
    slug: "case-converter",
    maxInputChars: 200_000,
    operations: [{ id: "convert", label: "Convert", actionLabel: "Convert" }],
    options: [
      { id: "snake", label: "snake_case" },
      { id: "camel", label: "camelCase" },
      { id: "kebab", label: "kebab-case" },
      { id: "pascal", label: "PascalCase" },
    ],
    optionLabel: "Case",
    defaultOperationId: "convert",
    defaultOptionId: "snake",
    transform: (request) => convertCase(request.input, request.optionId as CaseFormat),
  },
  singleRun("sort-lines", "Sort", 200_000, (input) => sortLines(input)),
  singleRun("dedupe-lines", "Dedupe", 200_000, (input) => dedupeLines(input)),
  singleRun("text-reverser", "Reverse", 200_000, (input) => reverseText(input)),
  singleRun("json-to-typescript", "Convert", 500_000, (input) => jsonToTypescript(input)),
  singleRun("json-to-js-const", "Convert", 500_000, (input) => jsonToJsConst(input)),
  singleRun("html-to-jsx", "Convert", 500_000, (input) => htmlToJsx(input)),
  {
    slug: "split-to-newlines",
    maxInputChars: 1_000_000,
    operations: [{ id: "split", label: "Split", actionLabel: "Split" }],
    options: [
      { id: "comma", label: "Comma" },
      { id: "semicolon", label: "Semicolon" },
      { id: "whitespace", label: "Whitespace" },
      { id: "pipe", label: "Pipe" },
    ],
    optionLabel: "Delimiter",
    defaultOperationId: "split",
    defaultOptionId: "comma",
    transform: (request) =>
      splitToNewlines(request.input, { delimiter: request.optionId as SplitDelimiter }),
  },
  {
    slug: "join-lines",
    maxInputChars: 1_000_000,
    operations: [{ id: "join", label: "Join", actionLabel: "Join" }],
    options: [
      { id: "comma", label: "Comma" },
      { id: "semicolon", label: "Semicolon" },
      { id: "whitespace", label: "Whitespace" },
      { id: "pipe", label: "Pipe" },
    ],
    optionLabel: "Delimiter",
    defaultOperationId: "join",
    defaultOptionId: "comma",
    transform: (request) =>
      joinLines(request.input, { delimiter: request.optionId as JoinDelimiter }),
  },
  {
    slug: "number-base",
    maxInputChars: 4_096,
    operations: [{ id: "convert", label: "Convert", actionLabel: "Convert" }],
    options: [
      { id: "16-10", label: "Hex → Dec" },
      { id: "10-16", label: "Dec → Hex" },
      { id: "2-10", label: "Bin → Dec" },
      { id: "10-2", label: "Dec → Bin" },
    ],
    optionLabel: "Bases",
    defaultOperationId: "convert",
    defaultOptionId: "16-10",
    transform: (request) => {
      const [from, to] = request.optionId.split("-").map(Number);
      if (!from || !to) return err("INVALID_OPTION", "Choose a base pair.");
      const result = convertNumberBase(request.input, from, to);
      return result.ok ? { ok: true, value: result.value.value } : result;
    },
  },
  {
    slug: "temperature",
    maxInputChars: 64,
    operations: [{ id: "convert", label: "Convert", actionLabel: "Convert" }],
    options: [
      { id: "C", label: "From °C" },
      { id: "F", label: "From °F" },
      { id: "K", label: "From K" },
    ],
    optionLabel: "Unit",
    defaultOperationId: "convert",
    defaultOptionId: "C",
    transform: (request) => {
      const result = convertTemperature(request.input, request.optionId as TemperatureUnit);
      return result.ok
        ? {
            ok: true,
            value: `${result.value.celsius} °C · ${result.value.fahrenheit} °F · ${result.value.kelvin} K`,
          }
        : result;
    },
  },
  {
    slug: "data-size",
    maxInputChars: 64,
    operations: [{ id: "convert", label: "Convert", actionLabel: "Convert" }],
    options: [
      { id: "B", label: "B" },
      { id: "KB", label: "KB" },
      { id: "MB", label: "MB" },
      { id: "GiB", label: "GiB" },
    ],
    optionLabel: "Unit",
    defaultOperationId: "convert",
    defaultOptionId: "MB",
    transform: (request) => {
      const result = convertDataSize(request.input, request.optionId as DataSizeUnit);
      return result.ok
        ? {
            ok: true,
            value: `${result.value.bytes} bytes · ${result.value.si} · ${result.value.binary}`,
          }
        : result;
    },
  },
  singleRun("color-converter", "Convert", 64, (input) => {
    const result = convertColor(input);
    return result.ok
      ? { ok: true, value: `${result.value.hex} · ${result.value.rgb} · ${result.value.hsl}` }
      : result;
  }),
  singleRun("duration-formatter", "Format", 64, (input) => {
    const result = formatDurationSeconds(input);
    return result.ok ? { ok: true, value: result.value.formatted } : result;
  }),
  {
    slug: "timezone-converter",
    maxInputChars: 64,
    operations: [{ id: "convert", label: "Convert", actionLabel: "Convert" }],
    options: [
      { id: "Asia/Tokyo|UTC", label: "Tokyo → UTC" },
      { id: "UTC|Asia/Tokyo", label: "UTC → Tokyo" },
      { id: "America/New_York|UTC", label: "New York → UTC" },
      { id: "UTC|Europe/London", label: "UTC → London" },
    ],
    optionLabel: "Zones",
    defaultOperationId: "convert",
    defaultOptionId: "Asia/Tokyo|UTC",
    transform: (request) => {
      const [source, target] = request.optionId.split("|");
      if (!source || !target) return err("INVALID_OPTION", "Choose a zone pair.");
      const result = convertTimezone(request.input, source, target);
      return result.ok ? { ok: true, value: result.value.targetIso } : result;
    },
  },
];

export const HOST_TRANSFORM_SPECS: readonly HostTransformSpec[] = [
  ...HOST_CORE_TRANSFORM_SPECS,
  ...HOST_EXTRA_TOOL_SPECS,
];

export function getHostTransformSpec(slug: string): HostTransformSpec | undefined {
  return HOST_TRANSFORM_SPECS.find((spec) => spec.slug === slug);
}

export const HOST_TRANSFORM_SLUGS: readonly string[] = HOST_TRANSFORM_SPECS.map((s) => s.slug);
