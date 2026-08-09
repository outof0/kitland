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

const multiHostComparePlatforms = Object.freeze({
  web: { status: "available" as const, capabilities: ["compare-text", "clipboard-write"] as const },
  "browser-extension": {
    status: "available" as const,
    capabilities: ["compare-text", "clipboard-write"] as const,
  },
  "vscode-extension": {
    status: "available" as const,
    capabilities: ["compare-text", "clipboard-write", "active-editor"] as const,
  },
});

export const beautifyMinifyTool = defineTool({
  id: "beautify-minify",
  slug: "beautify-minify",
  name: "Beautify / Minify",
  shortName: "Beautify / Minify",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Format or compact JSON locally with predictable indentation.",
  keywords: ["json", "beautify", "minify", "format", "compact"],
  designFrame: "Beautify / Minify (T4mv0)",
  platforms: multiHostTransformPlatforms,
} as const);

export const jsonDiffTool = defineTool({
  id: "json-diff",
  slug: "json-diff",
  name: "JSON Diff",
  shortName: "JSON Diff",
  family: "json-markup",
  pattern: "diff",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Compare two JSON documents and inspect their differences locally.",
  keywords: ["json", "diff", "compare"],
  designFrame: "JSON Diff · Editor (lMoqW) · Compare (pYYdG)",
  platforms: multiHostComparePlatforms,
} as const);

export const jsonFormatterTool = defineTool({
  id: "json-formatter",
  slug: "json-formatter",
  name: "JSON Formatter",
  shortName: "JSON Formatter",
  family: "json-markup",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Beautify, minify, validate, and inspect JSON documents locally.",
  keywords: [
    "json",
    "format",
    "formatter",
    "beautify",
    "minify",
    "validate",
    "inspect",
    "structure",
  ],
  designFrame: "JSON Formatter (FdGX5)",
  platforms: {
    web: {
      status: "available",
      capabilities: ["transform-text", "inspect-text", "clipboard-write", "share-link"],
    },
    "browser-extension": {
      status: "available",
      capabilities: ["transform-text", "inspect-text", "clipboard-write"],
    },
    "vscode-extension": {
      status: "available",
      capabilities: ["transform-text", "inspect-text", "clipboard-write", "active-editor"],
    },
  },
} as const);

export const jsonToYamlTool = defineTool({
  id: "json-to-yaml",
  slug: "json-to-yaml",
  name: "JSON → YAML",
  shortName: "JSON → YAML",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert JSON documents to a safe, readable YAML subset locally.",
  keywords: ["json", "yaml", "convert", "serialize"],
  designFrame: "JSON → YAML (zVNls)",
  platforms: multiHostTransformPlatforms,
} as const);

export const yamlToJsonTool = defineTool({
  id: "yaml-to-json",
  slug: "yaml-to-json",
  name: "YAML → JSON",
  shortName: "YAML → JSON",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert supported YAML documents to formatted JSON locally.",
  keywords: ["yaml", "json", "convert", "parse"],
  designFrame: "YAML → JSON (z4tgms)",
  platforms: multiHostTransformPlatforms,
} as const);

export const jsonToCsvTool = defineTool({
  id: "json-to-csv",
  slug: "json-to-csv",
  name: "JSON → CSV",
  shortName: "JSON → CSV",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert JSON records to safe RFC 4180 CSV locally.",
  keywords: ["json", "csv", "convert", "records"],
  designFrame: "JSON → CSV (RLXps)",
  platforms: multiHostTransformPlatforms,
} as const);

export const jsonToTomlTool = defineTool({
  id: "json-to-toml",
  slug: "json-to-toml",
  name: "JSON → TOML",
  shortName: "JSON → TOML",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert JSON configuration documents into readable TOML tables locally.",
  keywords: ["json", "toml", "convert", "config"],
  designFrame: "JSON → TOML (heQcn)",
  platforms: multiHostTransformPlatforms,
} as const);

export const xmlFormatterTool = defineTool({
  id: "xml-formatter",
  slug: "xml-formatter",
  name: "XML Formatter",
  shortName: "XML Formatter",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Validate and format XML locally without external entities.",
  keywords: ["xml", "format", "validate", "markup"],
  designFrame: "XML Formatter (OWCch)",
  platforms: multiHostTransformPlatforms,
} as const);

export const sqlFormatterTool = defineTool({
  id: "sql-formatter",
  slug: "sql-formatter",
  name: "SQL Formatter",
  shortName: "SQL Formatter",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Format common SQL queries for readable review locally.",
  keywords: ["sql", "format", "query"],
  designFrame: "SQL Formatter (iORC5)",
  platforms: multiHostTransformPlatforms,
} as const);

export const markdownPreviewTool = defineTool({
  id: "markdown-preview",
  slug: "markdown-preview",
  name: "Markdown Preview",
  shortName: "Markdown Preview",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Preview a safe Markdown subset with local rendering.",
  keywords: ["markdown", "preview", "md"],
  designFrame: "Markdown Preview (d3XcA)",
  platforms: multiHostTransformPlatforms,
} as const);

export const jsonToTypescriptTool = defineTool({
  id: "json-to-typescript",
  slug: "json-to-typescript",
  name: "JSON → TypeScript",
  shortName: "JSON → TypeScript",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Create TypeScript type declarations from JSON samples locally.",
  keywords: ["json", "typescript", "types", "convert"],
  designFrame: "JSON → TypeScript (t9KwK)",
  platforms: multiHostTransformPlatforms,
} as const);

export const jsonToJsConstTool = defineTool({
  id: "json-to-js-const",
  slug: "json-to-js-const",
  name: "JSON → JS / const",
  shortName: "JSON → JS / const",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Create JavaScript constants from JSON values locally.",
  keywords: ["json", "javascript", "const", "convert"],
  designFrame: "JSON → JS / const (nSQLS)",
  platforms: multiHostTransformPlatforms,
} as const);

export const htmlToJsxTool = defineTool({
  id: "html-to-jsx",
  slug: "html-to-jsx",
  name: "HTML → JSX",
  shortName: "HTML → JSX",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert HTML markup into JSX without executing input.",
  keywords: ["html", "jsx", "react", "convert"],
  designFrame: "HTML → JSX (GDCpP)",
  platforms: multiHostTransformPlatforms,
} as const);

export const jsonEscapeTool = defineTool({
  id: "json-escape",
  slug: "json-escape",
  name: "JSON Escape",
  shortName: "JSON Escape",
  family: "json-markup",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Escape plain text into JSON string literals or decode them safely locally.",
  keywords: ["json", "escape", "string", "quote"],
  designFrame: "JSON Escape (W5XdLy)",
  platforms: multiHostTransformPlatforms,
} as const);

export const jsonMarkupTools = [
  beautifyMinifyTool,
  jsonDiffTool,
  jsonFormatterTool,
  jsonToYamlTool,
  yamlToJsonTool,
  jsonToCsvTool,
  jsonToTomlTool,
  xmlFormatterTool,
  sqlFormatterTool,
  markdownPreviewTool,
  jsonToTypescriptTool,
  jsonToJsConstTool,
  htmlToJsxTool,
  jsonEscapeTool,
] as const satisfies readonly ToolDefinition[];
