import { defineTool } from "../define-tool";
import type { ToolDefinition, ToolUiPattern } from "../types";

const webFirstPlatforms = (
  capability: "transform-text" | "inspect-text" | "compare-text" | "generate-value",
) => ({
  web: { status: "available" as const, capabilities: [capability, "clipboard-write"] as const },
  "browser-extension": { status: "planned" as const, capabilities: [capability] as const },
  "vscode-extension": { status: "planned" as const, capabilities: [capability] as const },
});

function implemented<
  const T extends {
    readonly id: string;
    readonly name: string;
    readonly family: "json-markup" | "generators" | "text-regex";
    readonly pattern: ToolUiPattern;
    readonly capability: "transform-text" | "inspect-text" | "compare-text" | "generate-value";
    readonly description: string;
    readonly keywords: readonly string[];
    readonly designFrame: string;
  },
>({ capability, ...spec }: T) {
  return defineTool({
    ...spec,
    slug: spec.id,
    shortName: spec.name,
    status: "available",
    releaseStage: "implemented",
    platforms: webFirstPlatforms(capability),
  } as const);
}

export const waveTwoTools = [
  implemented({
    id: "json-toolbox",
    name: "JSON Toolbox",
    family: "json-markup",
    pattern: "inspect",
    capability: "inspect-text",
    description: "Validate and inspect JSON documents locally.",
    keywords: ["json", "validate", "inspect", "structure"],
    designFrame: "JSON Toolbox (NChG5)",
  }),
  implemented({
    id: "json-to-csv",
    name: "JSON → CSV",
    family: "json-markup",
    pattern: "transform",
    capability: "transform-text",
    description: "Convert JSON records to safe RFC 4180 CSV locally.",
    keywords: ["json", "csv", "convert", "records"],
    designFrame: "JSON → CSV (RLXps)",
  }),
  implemented({
    id: "json-to-toml",
    name: "JSON → TOML",
    family: "json-markup",
    pattern: "transform",
    capability: "transform-text",
    description: "Convert JSON objects to readable TOML locally.",
    keywords: ["json", "toml", "convert", "config"],
    designFrame: "JSON → TOML (heQcn)",
  }),
  implemented({
    id: "xml-formatter",
    name: "XML Formatter",
    family: "json-markup",
    pattern: "transform",
    capability: "transform-text",
    description: "Validate and format XML locally without external entities.",
    keywords: ["xml", "format", "validate", "markup"],
    designFrame: "XML Formatter (OWCch)",
  }),
  implemented({
    id: "text-stats",
    name: "Text Stats",
    family: "text-regex",
    pattern: "inspect",
    capability: "inspect-text",
    description: "Inspect characters, words, lines, and reading metrics locally.",
    keywords: ["text", "stats", "count", "words", "characters"],
    designFrame: "Text Stats (fxy2c)",
  }),
  implemented({
    id: "text-diff",
    name: "Text Diff",
    family: "text-regex",
    pattern: "diff",
    capability: "compare-text",
    description: "Compare two text documents with a bounded local diff.",
    keywords: ["text", "diff", "compare", "changes"],
    designFrame: "Text Diff (J4CAnG)",
  }),
  implemented({
    id: "lorem-ipsum",
    name: "Lorem Ipsum",
    family: "generators",
    pattern: "generate",
    capability: "generate-value",
    description: "Generate deterministic lorem ipsum content locally.",
    keywords: ["lorem", "ipsum", "placeholder", "text"],
    designFrame: "Lorem Ipsum (J65Q8)",
  }),
  implemented({
    id: "regex-tester",
    name: "Regex Tester",
    family: "text-regex",
    pattern: "inspect",
    capability: "inspect-text",
    description: "Test regular expressions against text with bounded matches.",
    keywords: ["regex", "regexp", "pattern", "matches"],
    designFrame: "Regex Tester (rDpjQ)",
  }),
  implemented({
    id: "random-port",
    name: "Random Port",
    family: "generators",
    pattern: "generate",
    capability: "generate-value",
    description: "Generate valid random TCP/UDP port numbers locally.",
    keywords: ["random", "port", "network", "tcp", "udp"],
    designFrame: "Random Port (yahX9)",
  }),
  implemented({
    id: "random-number",
    name: "Random Number",
    family: "generators",
    pattern: "generate",
    capability: "generate-value",
    description: "Generate cryptographically secure random numbers locally.",
    keywords: ["random", "number", "secure", "integer"],
    designFrame: "Random Number (a1wdtS)",
  }),
] as const satisfies readonly ToolDefinition[];
