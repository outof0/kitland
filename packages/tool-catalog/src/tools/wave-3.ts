import { defineTool } from "../define-tool";
import type { ToolDefinition } from "../types";

const webTransformPlatforms = Object.freeze({
  web: {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write"] as const,
  },
  "browser-extension": { status: "planned" as const, capabilities: ["transform-text"] as const },
  "vscode-extension": { status: "planned" as const, capabilities: ["transform-text"] as const },
});
const webComparePlatforms = Object.freeze({
  web: { status: "available" as const, capabilities: ["compare-text", "clipboard-write"] as const },
  "browser-extension": { status: "planned" as const, capabilities: ["compare-text"] as const },
  "vscode-extension": { status: "planned" as const, capabilities: ["compare-text"] as const },
});
const webGeneratePlatforms = Object.freeze({
  web: {
    status: "available" as const,
    capabilities: ["generate-value", "clipboard-write"] as const,
  },
  "browser-extension": { status: "planned" as const, capabilities: ["generate-value"] as const },
  "vscode-extension": { status: "planned" as const, capabilities: ["generate-value"] as const },
});

function transformTool<
  const T extends {
    readonly id: string;
    readonly name: string;
    readonly family: "json-markup" | "encoding-text";
    readonly description: string;
    readonly keywords: readonly string[];
    readonly designFrame: string;
  },
>(spec: T) {
  return defineTool({
    ...spec,
    slug: spec.id,
    shortName: spec.name,
    pattern: "transform",
    status: "available",
    releaseStage: "implemented",
    platforms: webTransformPlatforms,
  } as const);
}
function specialTool<
  const T extends {
    readonly id: string;
    readonly name: string;
    readonly family: "json-markup" | "generators";
    readonly pattern: "diff" | "generate";
    readonly description: string;
    readonly keywords: readonly string[];
    readonly designFrame: string;
  },
>(spec: T) {
  const capability = spec.pattern === "diff" ? "compare-text" : "generate-value";
  return defineTool({
    ...spec,
    slug: spec.id,
    shortName: spec.name,
    status: "available",
    releaseStage: "implemented",
    platforms: capability === "compare-text" ? webComparePlatforms : webGeneratePlatforms,
  } as const);
}

export const waveThreeTools = [
  specialTool({
    id: "json-diff",
    name: "JSON Diff",
    family: "json-markup",
    pattern: "diff",
    description: "Compare two JSON documents and inspect their differences locally.",
    keywords: ["json", "diff", "compare"],
    designFrame: "JSON Diff (lMoqW)",
  }),
  transformTool({
    id: "sql-formatter",
    name: "SQL Formatter",
    family: "json-markup",
    description: "Format common SQL queries for readable review locally.",
    keywords: ["sql", "format", "query"],
    designFrame: "SQL Formatter (iORC5)",
  }),
  transformTool({
    id: "markdown-preview",
    name: "Markdown Preview",
    family: "json-markup",
    description: "Preview a safe Markdown subset with local rendering.",
    keywords: ["markdown", "preview", "md"],
    designFrame: "Markdown Preview (d3XcA)",
  }),
  transformTool({
    id: "json-escape",
    name: "JSON Escape",
    family: "json-markup",
    description: "Escape or unescape JSON string literals locally.",
    keywords: ["json", "escape", "string", "quote"],
    designFrame: "JSON Escape (W5XdLy)",
  }),
  transformTool({
    id: "url-encode",
    name: "URL Encode",
    family: "encoding-text",
    description: "Encode or decode URL-safe text locally.",
    keywords: ["url", "encode", "decode", "percent"],
    designFrame: "URL Encode (C2SF76)",
  }),
  specialTool({
    id: "uuid-id",
    name: "UUID / ID",
    family: "generators",
    pattern: "generate",
    description: "Generate UUIDs and format identifiers locally with secure entropy.",
    keywords: ["uuid", "id", "identifier", "random"],
    designFrame: "UUID / ID (TSKpr)",
  }),
] as const satisfies readonly ToolDefinition[];
