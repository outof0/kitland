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

export const caseConverterTool = defineTool({
  id: "case-converter",
  slug: "case-converter",
  name: "Case Converter",
  shortName: "Case Converter",
  family: "text-regex",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert identifiers and prose between common casing styles.",
  keywords: ["case", "camel", "snake", "kebab", "pascal", "title"],
  designFrame: "Case Converter (iKwdM)",
  platforms: multiHostTransformPlatforms,
} as const);

export const sortLinesTool = defineTool({
  id: "sort-lines",
  slug: "sort-lines",
  name: "Sort Lines",
  shortName: "Sort Lines",
  family: "text-regex",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Sort lines deterministically with optional numeric and case rules.",
  keywords: ["sort", "lines", "order", "numeric"],
  designFrame: "Sort Lines (bNW0i)",
  platforms: multiHostTransformPlatforms,
} as const);

export const dedupeLinesTool = defineTool({
  id: "dedupe-lines",
  slug: "dedupe-lines",
  name: "Dedupe Lines",
  shortName: "Dedupe Lines",
  family: "text-regex",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Remove duplicate lines while preserving first-seen order.",
  keywords: ["dedupe", "unique", "lines", "distinct"],
  designFrame: "Dedupe Lines (Kg081)",
  platforms: multiHostTransformPlatforms,
} as const);

export const textReverserTool = defineTool({
  id: "text-reverser",
  slug: "text-reverser",
  name: "Text Reverser",
  shortName: "Text Reverser",
  family: "text-regex",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Reverse characters, words, or lines while preserving Unicode safely.",
  keywords: ["reverse", "text", "characters", "words", "lines"],
  designFrame: "Text Reverser (H9EgGy)",
  platforms: multiHostTransformPlatforms,
} as const);

export const textStatsTool = defineTool({
  id: "text-stats",
  slug: "text-stats",
  name: "Text Stats",
  shortName: "Text Stats",
  family: "text-regex",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Inspect characters, words, lines, and reading metrics locally.",
  keywords: ["text", "stats", "count", "words", "characters"],
  designFrame: "Text Stats (fxy2c)",
  platforms: multiHostInspectPlatforms,
} as const);

export const textDiffTool = defineTool({
  id: "text-diff",
  slug: "text-diff",
  name: "Text Diff",
  shortName: "Text Diff",
  family: "text-regex",
  pattern: "diff",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Compare two text documents with a bounded local diff.",
  keywords: ["text", "diff", "compare", "changes"],
  designFrame: "Text Diff (J4CAnG)",
  platforms: multiHostComparePlatforms,
} as const);

export const regexTesterTool = defineTool({
  id: "regex-tester",
  slug: "regex-tester",
  name: "Regex Tester",
  shortName: "Regex Tester",
  family: "text-regex",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Test regular expressions against text with bounded matches.",
  keywords: ["regex", "regexp", "pattern", "matches"],
  designFrame: "Regex Tester (rDpjQ)",
  platforms: multiHostInspectPlatforms,
} as const);

export const splitToNewlinesTool = defineTool({
  id: "split-to-newlines",
  slug: "split-to-newlines",
  name: "Split → Newlines",
  shortName: "Split → Newlines",
  family: "text-regex",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Split delimited text into one value per line locally.",
  keywords: ["split", "newlines", "delimiter", "text"],
  designFrame: "Split → Newlines (uZitj)",
  platforms: multiHostTransformPlatforms,
} as const);

export const textRegexTools = [
  caseConverterTool,
  sortLinesTool,
  dedupeLinesTool,
  textReverserTool,
  textStatsTool,
  textDiffTool,
  regexTesterTool,
  splitToNewlinesTool,
] as const satisfies readonly ToolDefinition[];
