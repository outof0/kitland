import {
  diffJson,
  escapeJson,
  formatCode,
  formatSql,
  formatXml,
  htmlToJsx,
  inspectJson,
  jsonToCsv,
  jsonToJsConst,
  jsonToToml,
  jsonToTypescript,
  jsonToYaml,
  ok,
  renderMarkdown,
  repairJson,
  unescapeJson,
  yamlToJson,
  type BeautifyMinifyLanguage,
  type JsonDiffResult,
  type JsonFormatMode,
  type JsonInspection,
  type MarkdownPreview,
  type ToolResult,
  type XmlFormatResult,
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
    return createMcpError("INPUT_TOO_LARGE", "Input text exceeds the maximum allowed size.");
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
// Beautify / Minify Code
// ---------------------------------------------------------------------------

type BeautifyCodeInput = {
  readonly input: string;
  readonly language?: "auto" | "json" | "javascript" | "html" | "xml" | "css" | "sql";
  readonly indent?: 2 | 4 | "tab";
};

type MinifyCodeInput = {
  readonly input: string;
  readonly language?: "auto" | "json" | "javascript" | "html" | "xml" | "css" | "sql";
};

type CodeFormatOutput = {
  readonly output: string;
  readonly detectedLanguage: string;
};

const BEAUTIFY_CODE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Source code to beautify/format." },
    language: {
      type: "string",
      enum: ["auto", "json", "javascript", "html", "xml", "css", "sql"],
      description: "Code language (default 'auto').",
    },
    indent: {
      type: ["integer", "string"],
      enum: [2, 4, "tab"],
      description: "Indentation spaces (2 or 4) or 'tab' (default 2).",
    },
  },
} as const;

const MINIFY_CODE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "Source code to minify/compact." },
    language: {
      type: "string",
      enum: ["auto", "json", "javascript", "html", "xml", "css", "sql"],
      description: "Code language (default 'auto').",
    },
  },
} as const;

const CODE_FORMAT_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "detectedLanguage"],
  properties: {
    output: { type: "string", description: "Formatted/minified code output." },
    detectedLanguage: { type: "string", description: "Language applied or detected." },
  },
} as const;

export const kitlandBeautifyCodeExposure: McpExposure<BeautifyCodeInput, CodeFormatOutput> = {
  mcpName: "kitland_beautify_code",
  operationId: "beautify_code",
  contractVersion: 1,
  registryToolId: "beautify-minify",
  title: "Beautify Code",
  description: "Format and pretty-print source code (JSON, HTML, XML, CSS, JS, SQL).",
  inputSchema: BEAUTIFY_CODE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(CODE_FORMAT_SUCCESS_SCHEMA),
  successSchema: CODE_FORMAT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: BeautifyCodeInput): ToolResult<CodeFormatOutput> => {
    const lang: BeautifyMinifyLanguage = args.language ?? "auto";
    const indent = args.indent ?? 2;
    const res = formatCode(args.input, lang, "beautify", { indent });
    if (!res.ok) return res;
    return ok({ output: res.value.output, detectedLanguage: res.value.detectedLanguage });
  },
  mapCoreError: mapError,
};

export const kitlandMinifyCodeExposure: McpExposure<MinifyCodeInput, CodeFormatOutput> = {
  mcpName: "kitland_minify_code",
  operationId: "minify_code",
  contractVersion: 1,
  registryToolId: "beautify-minify",
  title: "Minify Code",
  description: "Compact and minify source code (JSON, HTML, XML, CSS, JS, SQL).",
  inputSchema: MINIFY_CODE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(CODE_FORMAT_SUCCESS_SCHEMA),
  successSchema: CODE_FORMAT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: MinifyCodeInput): ToolResult<CodeFormatOutput> => {
    const lang: BeautifyMinifyLanguage = args.language ?? "auto";
    const res = formatCode(args.input, lang, "minify");
    if (!res.ok) return res;
    return ok({ output: res.value.output, detectedLanguage: res.value.detectedLanguage });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// JSON Diff
// ---------------------------------------------------------------------------

type JsonDiffInput = {
  readonly original: string;
  readonly modified: string;
};

const JSON_DIFF_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["original", "modified"],
  properties: {
    original: { type: "string", description: "Original JSON document (JSON string)." },
    modified: { type: "string", description: "Modified JSON document (JSON string)." },
  },
} as const;

const JSON_DIFF_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["entries", "summary"],
  properties: {
    entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "operation"],
        properties: {
          path: { type: "string" },
          operation: { type: "string", enum: ["added", "removed", "changed"] },
          before: {},
          after: {},
        },
      },
    },
    summary: {
      type: "object",
      additionalProperties: false,
      required: ["added", "removed", "changed", "total"],
      properties: {
        added: { type: "integer" },
        removed: { type: "integer" },
        changed: { type: "integer" },
        total: { type: "integer" },
      },
    },
  },
} as const;

export const kitlandJsonDiffExposure: McpExposure<JsonDiffInput, JsonDiffResult> = {
  mcpName: "kitland_json_diff",
  operationId: "json_diff",
  contractVersion: 1,
  registryToolId: "json-diff",
  title: "JSON Diff",
  description: "Compare two JSON documents and produce structured differences.",
  inputSchema: JSON_DIFF_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(JSON_DIFF_SUCCESS_SCHEMA),
  successSchema: JSON_DIFF_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: JsonDiffInput): ToolResult<JsonDiffResult> => {
    return diffJson(args.original, args.modified);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// JSON Inspect & Repair (JSON Formatter Tool)
// ---------------------------------------------------------------------------

type JsonInspectInput = {
  readonly input: string;
  readonly indent?: 2 | 4 | "tab";
  readonly mode?: "beautify" | "minify";
};

const JSON_INSPECT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "JSON string to inspect." },
    indent: {
      type: ["integer", "string"],
      enum: [2, 4, "tab"],
      description: "Indent spaces (2 or 4) or 'tab' (default 2).",
    },
    mode: { type: "string", enum: ["beautify", "minify"], description: "Formatting mode." },
  },
} as const;

const JSON_INSPECT_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "formatted",
    "rootType",
    "totalValues",
    "objectCount",
    "arrayCount",
    "stringCount",
    "numberCount",
    "booleanCount",
    "nullCount",
    "maxDepth",
  ],
  properties: {
    formatted: { type: "string" },
    rootType: {
      type: "string",
      enum: ["object", "array", "string", "number", "boolean", "null"],
    },
    totalValues: { type: "integer" },
    objectCount: { type: "integer" },
    arrayCount: { type: "integer" },
    stringCount: { type: "integer" },
    numberCount: { type: "integer" },
    booleanCount: { type: "integer" },
    nullCount: { type: "integer" },
    maxDepth: { type: "integer" },
  },
} as const;

export const kitlandJsonInspectExposure: McpExposure<JsonInspectInput, JsonInspection> = {
  mcpName: "kitland_json_inspect",
  operationId: "json_inspect",
  contractVersion: 1,
  registryToolId: "json-formatter",
  title: "JSON Inspect",
  description: "Inspect JSON structure, calculate node counts and depth, and format the output.",
  inputSchema: JSON_INSPECT_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(JSON_INSPECT_SUCCESS_SCHEMA),
  successSchema: JSON_INSPECT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: JsonInspectInput): ToolResult<JsonInspection> => {
    const indent: 2 | 4 | "tab" = args.indent ?? 2;
    const mode: JsonFormatMode = args.mode ?? "beautify";
    return inspectJson(args.input, indent, mode);
  },
  mapCoreError: mapError,
};

type JsonRepairOutput = {
  readonly output: string;
  readonly repaired: boolean;
};

const JSON_REPAIR_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "repaired"],
  properties: {
    output: { type: "string", description: "Repaired JSON string." },
    repaired: { type: "boolean", description: "True if modifications were made to repair JSON." },
  },
} as const;

export const kitlandJsonRepairExposure: McpExposure<TextOnlyInput, JsonRepairOutput> = {
  mcpName: "kitland_json_repair",
  operationId: "json_repair",
  contractVersion: 1,
  registryToolId: "json-formatter",
  title: "JSON Repair",
  description:
    "Fix common JSON syntax errors (trailing commas, unquoted keys, comments, single quotes).",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(JSON_REPAIR_SUCCESS_SCHEMA),
  successSchema: JSON_REPAIR_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<JsonRepairOutput> => {
    const repaired = repairJson(args.input);
    if (repaired === null) {
      return {
        ok: false,
        error: { code: "REPAIR_FAILED", message: "Could not repair invalid JSON." },
      };
    }
    return ok({ output: repaired, repaired: repaired !== args.input });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// JSON <-> YAML
// ---------------------------------------------------------------------------

export const kitlandJsonToYamlExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_json_to_yaml",
  operationId: "json_to_yaml",
  contractVersion: 1,
  registryToolId: "json-to-yaml",
  title: "JSON to YAML",
  description: "Convert JSON to YAML format.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = jsonToYaml(args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

type YamlToJsonInput = {
  readonly input: string;
  readonly indent?: 2 | 4 | "tab";
};

const YAML_TO_JSON_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "YAML text to convert to JSON." },
    indent: {
      type: ["integer", "string"],
      enum: [2, 4, "tab"],
      description: "JSON indentation spaces (2 or 4) or 'tab' (default 2).",
    },
  },
} as const;

export const kitlandYamlToJsonExposure: McpExposure<YamlToJsonInput, TextOnlyOutput> = {
  mcpName: "kitland_yaml_to_json",
  operationId: "yaml_to_json",
  contractVersion: 1,
  registryToolId: "yaml-to-json",
  title: "YAML to JSON",
  description: "Convert YAML text to formatted JSON.",
  inputSchema: YAML_TO_JSON_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: YamlToJsonInput): ToolResult<TextOnlyOutput> => {
    const indent: 2 | 4 | "tab" = args.indent ?? 2;
    const res = yamlToJson(args.input, indent);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// JSON to CSV
// ---------------------------------------------------------------------------

type JsonToCsvInput = {
  readonly input: string;
  readonly escapeFormulae?: boolean;
};

const JSON_TO_CSV_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "JSON array of objects or single JSON object." },
    escapeFormulae: {
      type: "boolean",
      description: "Prevent formula interpretation in spreadsheets (default true).",
    },
  },
} as const;

export const kitlandJsonToCsvExposure: McpExposure<JsonToCsvInput, TextOnlyOutput> = {
  mcpName: "kitland_json_to_csv",
  operationId: "json_to_csv",
  contractVersion: 1,
  registryToolId: "json-to-csv",
  title: "JSON to CSV",
  description: "Convert JSON array or record to RFC 4180 CSV.",
  inputSchema: JSON_TO_CSV_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: JsonToCsvInput): ToolResult<TextOnlyOutput> => {
    const res = jsonToCsv(args.input, { escapeFormulae: args.escapeFormulae ?? true });
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// JSON to TOML
// ---------------------------------------------------------------------------

export const kitlandJsonToTomlExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_json_to_toml",
  operationId: "json_to_toml",
  contractVersion: 1,
  registryToolId: "json-to-toml",
  title: "JSON to TOML",
  description: "Convert JSON object to TOML format.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = jsonToToml(args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// XML Formatter
// ---------------------------------------------------------------------------

type XmlFormatInput = {
  readonly input: string;
  readonly indent?: 2 | 4 | "tab";
};

const XML_FORMAT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "XML string to format." },
    indent: {
      type: ["integer", "string"],
      enum: [2, 4, "tab"],
      description: "Indent spaces (2 or 4) or 'tab' (default 2).",
    },
  },
} as const;

const XML_FORMAT_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["output", "elementCount", "maxDepth"],
  properties: {
    output: { type: "string", description: "Formatted XML output." },
    elementCount: { type: "integer" },
    maxDepth: { type: "integer" },
  },
} as const;

export const kitlandXmlFormatExposure: McpExposure<XmlFormatInput, XmlFormatResult> = {
  mcpName: "kitland_xml_format",
  operationId: "xml_format",
  contractVersion: 1,
  registryToolId: "xml-formatter",
  title: "XML Formatter",
  description: "Validate and format XML markup without external entities.",
  inputSchema: XML_FORMAT_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(XML_FORMAT_SUCCESS_SCHEMA),
  successSchema: XML_FORMAT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: XmlFormatInput): ToolResult<XmlFormatResult> => {
    const indent: 2 | 4 | "tab" = args.indent ?? 2;
    return formatXml(args.input, indent);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// SQL Formatter
// ---------------------------------------------------------------------------

type SqlFormatInput = {
  readonly input: string;
  readonly indent?: 2 | 4 | "tab";
  readonly keywordCase?: "upper" | "lower";
};

const SQL_FORMAT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "SQL query to format." },
    indent: {
      type: ["integer", "string"],
      enum: [2, 4, "tab"],
      description: "Indent spaces (2 or 4) or 'tab' (default 2).",
    },
    keywordCase: {
      type: "string",
      enum: ["upper", "lower"],
      description: "Keyword casing (default 'upper').",
    },
  },
} as const;

export const kitlandSqlFormatExposure: McpExposure<SqlFormatInput, TextOnlyOutput> = {
  mcpName: "kitland_sql_format",
  operationId: "sql_format",
  contractVersion: 1,
  registryToolId: "sql-formatter",
  title: "SQL Formatter",
  description: "Format SQL queries for clean readability.",
  inputSchema: SQL_FORMAT_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: SqlFormatInput): ToolResult<TextOnlyOutput> => {
    const res = formatSql(args.input, {
      indent: args.indent ?? 2,
      keywordCase: args.keywordCase ?? "upper",
    });
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Markdown Preview / Render
// ---------------------------------------------------------------------------

const MARKDOWN_RENDER_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["html", "headings", "words", "lines"],
  properties: {
    html: { type: "string", description: "Rendered HTML markup." },
    headings: { type: "integer" },
    words: { type: "integer" },
    lines: { type: "integer" },
  },
} as const;

export const kitlandMarkdownRenderExposure: McpExposure<TextOnlyInput, MarkdownPreview> = {
  mcpName: "kitland_markdown_render",
  operationId: "markdown_render",
  contractVersion: 1,
  registryToolId: "markdown-preview",
  title: "Markdown Render",
  description: "Render Markdown into safe HTML and compute document metrics.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(MARKDOWN_RENDER_SUCCESS_SCHEMA),
  successSchema: MARKDOWN_RENDER_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<MarkdownPreview> => {
    return renderMarkdown(args.input);
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// JSON to TypeScript
// ---------------------------------------------------------------------------

type JsonToTypescriptInput = {
  readonly input: string;
  readonly typeName?: string;
  readonly indent?: 2 | 4 | "tab";
};

const JSON_TO_TYPESCRIPT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "JSON string to generate TypeScript types from." },
    typeName: { type: "string", description: "Root type identifier (default 'Root')." },
    indent: {
      type: ["integer", "string"],
      enum: [2, 4, "tab"],
      description: "Indent spaces (2 or 4) or 'tab' (default 2).",
    },
  },
} as const;

export const kitlandJsonToTypescriptExposure: McpExposure<JsonToTypescriptInput, TextOnlyOutput> = {
  mcpName: "kitland_json_to_typescript",
  operationId: "json_to_typescript",
  contractVersion: 1,
  registryToolId: "json-to-typescript",
  title: "JSON to TypeScript",
  description: "Generate TypeScript type definitions from JSON data.",
  inputSchema: JSON_TO_TYPESCRIPT_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: JsonToTypescriptInput): ToolResult<TextOnlyOutput> => {
    const res = jsonToTypescript(args.input, args.typeName ?? "Root", args.indent ?? 2);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// JSON to JS Const
// ---------------------------------------------------------------------------

type JsonToJsConstInput = {
  readonly input: string;
  readonly name?: string;
  readonly indent?: 2 | 4 | "tab";
};

const JSON_TO_JS_CONST_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "JSON string to convert to JavaScript const." },
    name: { type: "string", description: "Constant identifier name (default 'value')." },
    indent: {
      type: ["integer", "string"],
      enum: [2, 4, "tab"],
      description: "Indent spaces (2 or 4) or 'tab' (default 2).",
    },
  },
} as const;

export const kitlandJsonToJsConstExposure: McpExposure<JsonToJsConstInput, TextOnlyOutput> = {
  mcpName: "kitland_json_to_js_const",
  operationId: "json_to_js_const",
  contractVersion: 1,
  registryToolId: "json-to-js-const",
  title: "JSON to JavaScript Const",
  description: "Convert JSON to a declared JavaScript constant.",
  inputSchema: JSON_TO_JS_CONST_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: JsonToJsConstInput): ToolResult<TextOnlyOutput> => {
    const res = jsonToJsConst(args.input, args.name ?? "value", args.indent ?? 2);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// HTML to JSX
// ---------------------------------------------------------------------------

export const kitlandHtmlToJsxExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_html_to_jsx",
  operationId: "html_to_jsx",
  contractVersion: 1,
  registryToolId: "html-to-jsx",
  title: "HTML to JSX",
  description: "Convert HTML markup into JSX format with attribute transformations.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = htmlToJsx(args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// JSON Escape / Unescape
// ---------------------------------------------------------------------------

export const kitlandJsonEscapeExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_json_escape",
  operationId: "json_escape",
  contractVersion: 1,
  registryToolId: "json-escape",
  title: "JSON Escape",
  description: "Escape plain text into a JSON string literal with quotes.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = escapeJson(args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

export const kitlandJsonUnescapeExposure: McpExposure<TextOnlyInput, TextOnlyOutput> = {
  mcpName: "kitland_json_unescape",
  operationId: "json_unescape",
  contractVersion: 1,
  registryToolId: "json-escape",
  title: "JSON Unescape",
  description: "Unescape a JSON string literal back to raw text.",
  inputSchema: TEXT_ONLY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TEXT_ONLY_SUCCESS_SCHEMA),
  successSchema: TEXT_ONLY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: TextOnlyInput): ToolResult<TextOnlyOutput> => {
    const res = unescapeJson(args.input);
    if (!res.ok) return res;
    return ok({ output: res.value });
  },
  mapCoreError: mapError,
};

export const JSON_MARKUP_EXPOSURES = [
  kitlandBeautifyCodeExposure,
  kitlandMinifyCodeExposure,
  kitlandJsonDiffExposure,
  kitlandJsonInspectExposure,
  kitlandJsonRepairExposure,
  kitlandJsonToYamlExposure,
  kitlandYamlToJsonExposure,
  kitlandJsonToCsvExposure,
  kitlandJsonToTomlExposure,
  kitlandXmlFormatExposure,
  kitlandSqlFormatExposure,
  kitlandMarkdownRenderExposure,
  kitlandJsonToTypescriptExposure,
  kitlandJsonToJsConstExposure,
  kitlandHtmlToJsxExposure,
  kitlandJsonEscapeExposure,
  kitlandJsonUnescapeExposure,
] as const;
