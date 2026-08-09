import type { ToolDefinition } from "@kitland/tool-catalog";

export type ToolSeoContent = {
  heading: string;
  introduction: string;
  steps: readonly string[];
  useCases: readonly string[];
  faqs: readonly {
    question: string;
    answer: string;
  }[];
};

function localTransformSeo(toolName: string, detail: string): ToolSeoContent {
  return {
    heading: `${toolName} runs locally in your browser`,
    introduction: `${detail} Kitland processes the text locally, so ordinary inputs do not leave your device.`,
    steps: [
      "Paste or type a value in the input editor.",
      "Choose the available format or direction options when the tool offers them.",
      "Review the derived result, then copy it when it is ready.",
    ],
    useCases: [
      "Quickly inspect or transform developer text without opening a project.",
      "Keep configuration, snippets, and notes in the browser while working locally.",
      "Validate a result before moving it into another editor or terminal.",
    ],
    faqs: [
      {
        question: "Does Kitland upload my input?",
        answer:
          "No. These transformations run in the browser. Avoid sharing screenshots or copied results that contain secrets.",
      },
      {
        question: "What happens when the input is invalid?",
        answer:
          "The tool keeps the input visible and reports a typed validation message instead of producing a misleading result.",
      },
    ],
  };
}

/**
 * Indexable tool copy lives beside the catalog rather than inside a client
 * component. A new public tool must supply real explanatory content; this
 * prevents 64 thin, near-duplicate landing pages from entering the sitemap.
 */
export const TOOL_SEO_CONTENT: Readonly<Record<string, ToolSeoContent>> = {
  "json-diff": localTransformSeo(
    "JSON Diff",
    "Compare two JSON documents and inspect bounded structural changes.",
  ),
  "sql-formatter": localTransformSeo(
    "SQL Formatter",
    "Format common SQL queries while preserving strings and comments.",
  ),
  "markdown-preview": localTransformSeo(
    "Markdown Preview",
    "Preview a safe Markdown subset locally without executing raw HTML.",
  ),
  "json-escape": localTransformSeo(
    "JSON Escape",
    "Escape plain text into JSON string literals or decode them safely.",
  ),
  "url-encode": localTransformSeo(
    "URL Encode",
    "Encode or decode URL components locally with explicit scope controls.",
  ),
  "uuid-id": localTransformSeo(
    "UUID / ID",
    "Generate UUID identifiers with secure host-provided entropy.",
  ),
  base64: {
    heading: "Encode and decode Base64 without sending your text anywhere",
    introduction:
      "Base64 represents bytes with text characters. It is useful for transport and embedding, but it is not encryption. Kitland converts UTF-8 text locally in your browser and never uploads the text you paste.",
    steps: [
      "Choose Encode for UTF-8 text or Decode for an existing Base64 value.",
      "Paste or upload a UTF-8 text file in the input editor.",
      "Copy or download the result from the output editor when it is valid.",
    ],
    useCases: [
      "Prepare a UTF-8 value for a header, configuration file, or data URL.",
      "Inspect a Base64 or Base64URL value while keeping the source text local.",
      "Switch directions to use a valid result as the next input.",
    ],
    faqs: [
      {
        question: "Is Base64 encryption?",
        answer:
          "No. Base64 is an encoding, so anyone with the value can decode it. Do not use it to protect passwords, tokens, or other secrets.",
      },
      {
        question: "What is Base64URL?",
        answer:
          "Base64URL uses URL-safe characters instead of + and /. It is commonly used in URLs and token formats, and padding may be omitted.",
      },
      {
        question: "Does Kitland upload my text?",
        answer:
          "No. This tool runs in the browser. Share links are optional and put the current input in the URL fragment, so never share a link containing secrets.",
      },
    ],
  },
  "beautify-minify": localTransformSeo(
    "JSON Beautify / Minify",
    "Format JSON for review or compact it for transport while preserving its data.",
  ),
  "json-to-yaml": localTransformSeo(
    "JSON to YAML",
    "Convert JSON documents into a predictable, readable YAML subset.",
  ),
  "yaml-to-json": localTransformSeo(
    "YAML to JSON",
    "Convert supported YAML mappings and sequences into formatted JSON.",
  ),
  "json-toolbox": localTransformSeo(
    "JSON Toolbox",
    "Validate a JSON document and inspect its root type, value count, and nesting depth.",
  ),
  "json-to-csv": localTransformSeo(
    "JSON to CSV",
    "Convert JSON records into escaped RFC 4180 CSV while keeping the conversion local.",
  ),
  "json-to-toml": localTransformSeo(
    "JSON to TOML",
    "Convert JSON configuration objects into readable TOML tables and values.",
  ),
  "xml-formatter": localTransformSeo(
    "XML Formatter",
    "Validate and format XML locally with external entities disabled.",
  ),
  "html-entities": localTransformSeo(
    "HTML Entities",
    "Encode reserved characters or decode common named and numeric HTML entities.",
  ),
  "hex-text": localTransformSeo(
    "Hex Text",
    "Represent UTF-8 text as hexadecimal bytes or decode hexadecimal bytes back to text.",
  ),
  "unicode-converter": localTransformSeo(
    "Unicode Converter",
    "Inspect Unicode code points and turn explicit U+ notation back into text.",
  ),
  "binary-text": localTransformSeo(
    "Binary Text",
    "Represent UTF-8 text as binary bytes or decode binary bytes back into text.",
  ),
  "case-converter": localTransformSeo(
    "Case Converter",
    "Move identifiers and phrases between camel, snake, kebab, title, and sentence case.",
  ),
  "sort-lines": localTransformSeo(
    "Sort Lines",
    "Order line-oriented text with stable, deterministic comparison rules.",
  ),
  "dedupe-lines": localTransformSeo(
    "Dedupe Lines",
    "Remove repeated lines while retaining the first occurrence and original order.",
  ),
  "text-reverser": localTransformSeo(
    "Text Reverser",
    "Reverse characters, words, or lines with Unicode-aware handling.",
  ),
  "text-stats": localTransformSeo(
    "Text Stats",
    "Count characters, words, lines, and reading metrics without uploading your text.",
  ),
  "text-diff": localTransformSeo(
    "Text Diff",
    "Compare two text values and review bounded line-level changes locally.",
  ),
  "lorem-ipsum": localTransformSeo(
    "Lorem Ipsum",
    "Generate placeholder paragraphs and sentences for prototypes and layout tests.",
  ),
  "regex-tester": localTransformSeo(
    "Regex Tester",
    "Test a regular expression against sample text and inspect bounded matches and captures.",
  ),
  "random-port": localTransformSeo(
    "Random Port",
    "Generate valid random network ports for local development and configuration examples.",
  ),
  "random-number": localTransformSeo(
    "Random Number",
    "Generate cryptographically secure random numbers within a chosen range locally.",
  ),
};

export function getToolSeoContent(slug: string): ToolSeoContent | undefined {
  return TOOL_SEO_CONTENT[slug];
}

/** Fail static generation if a catalog entry would create a thin SEO page. */
export function requireToolSeoContent(tool: ToolDefinition): ToolSeoContent {
  const content = getToolSeoContent(tool.slug);
  if (!content) {
    throw new Error(
      `Available tool "${tool.slug}" needs tool SEO content before it can be published.`,
    );
  }
  return content;
}
