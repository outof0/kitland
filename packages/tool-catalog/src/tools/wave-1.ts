import { defineTool } from "../define-tool";
import type { ToolDefinition } from "../types";

const transformPlatforms = Object.freeze({
  web: {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write"] as const,
  },
  "browser-extension": { status: "planned" as const, capabilities: ["transform-text"] as const },
  "vscode-extension": { status: "planned" as const, capabilities: ["transform-text"] as const },
});

function implementedTransform<
  const T extends {
    readonly id: string;
    readonly name: string;
    readonly shortName: string;
    readonly family: "json-markup" | "encoding-text" | "text-regex";
    readonly description: string;
    readonly keywords: readonly string[];
    readonly designFrame: string;
  },
>(spec: T) {
  return defineTool({
    ...spec,
    slug: spec.id,
    pattern: "transform",
    status: "available",
    releaseStage: "implemented",
    platforms: transformPlatforms,
  } as const);
}

export const waveOneTools = [
  implementedTransform({
    id: "beautify-minify",
    name: "Beautify / Minify",
    shortName: "Beautify / Minify",
    family: "json-markup",
    description: "Format or compact JSON locally with predictable indentation.",
    keywords: ["json", "beautify", "minify", "format", "compact"],
    designFrame: "Beautify / Minify (T4mv0)",
  }),
  implementedTransform({
    id: "json-to-yaml",
    name: "JSON → YAML",
    shortName: "JSON → YAML",
    family: "json-markup",
    description: "Convert JSON documents to a safe, readable YAML subset locally.",
    keywords: ["json", "yaml", "convert", "serialize"],
    designFrame: "JSON → YAML (zVNls)",
  }),
  implementedTransform({
    id: "yaml-to-json",
    name: "YAML → JSON",
    shortName: "YAML → JSON",
    family: "json-markup",
    description: "Convert supported YAML documents to formatted JSON locally.",
    keywords: ["yaml", "json", "convert", "parse"],
    designFrame: "YAML → JSON (z4tgms)",
  }),
  implementedTransform({
    id: "html-entities",
    name: "HTML Entities",
    shortName: "HTML Entities",
    family: "encoding-text",
    description: "Encode or decode common HTML character entities locally.",
    keywords: ["html", "entities", "encode", "decode", "escape"],
    designFrame: "HTML Entities (b9fWNy)",
  }),
  implementedTransform({
    id: "hex-text",
    name: "Hex Text",
    shortName: "Hex Text",
    family: "encoding-text",
    description: "Convert UTF-8 text to and from hexadecimal bytes locally.",
    keywords: ["hex", "text", "encode", "decode", "bytes"],
    designFrame: "Hex Text (RhxHF)",
  }),
  implementedTransform({
    id: "unicode-converter",
    name: "Unicode Converter",
    shortName: "Unicode Converter",
    family: "encoding-text",
    description: "Convert Unicode text to and from explicit code point notation.",
    keywords: ["unicode", "codepoint", "utf", "characters"],
    designFrame: "Unicode Converter (DZFSs)",
  }),
  implementedTransform({
    id: "binary-text",
    name: "Binary Text",
    shortName: "Binary Text",
    family: "encoding-text",
    description: "Convert UTF-8 text to and from binary byte notation locally.",
    keywords: ["binary", "text", "bits", "bytes", "encode"],
    designFrame: "Binary Text (Ldrhp)",
  }),
  implementedTransform({
    id: "case-converter",
    name: "Case Converter",
    shortName: "Case Converter",
    family: "text-regex",
    description: "Convert identifiers and prose between common casing styles.",
    keywords: ["case", "camel", "snake", "kebab", "pascal", "title"],
    designFrame: "Case Converter (iKwdM)",
  }),
  implementedTransform({
    id: "sort-lines",
    name: "Sort Lines",
    shortName: "Sort Lines",
    family: "text-regex",
    description: "Sort lines deterministically with optional numeric and case rules.",
    keywords: ["sort", "lines", "order", "numeric"],
    designFrame: "Sort Lines (bNW0i)",
  }),
  implementedTransform({
    id: "dedupe-lines",
    name: "Dedupe Lines",
    shortName: "Dedupe Lines",
    family: "text-regex",
    description: "Remove duplicate lines while preserving first-seen order.",
    keywords: ["dedupe", "unique", "lines", "distinct"],
    designFrame: "Dedupe Lines (Kg081)",
  }),
  implementedTransform({
    id: "text-reverser",
    name: "Text Reverser",
    shortName: "Text Reverser",
    family: "text-regex",
    description: "Reverse characters, words, or lines while preserving Unicode safely.",
    keywords: ["reverse", "text", "characters", "words", "lines"],
    designFrame: "Text Reverser (H9EgGy)",
  }),
] as const satisfies readonly ToolDefinition[];
