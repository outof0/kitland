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

/**
 * Indexable tool copy lives beside the catalog rather than inside a client
 * component. A new public tool must supply real explanatory content; this
 * prevents 64 thin, near-duplicate landing pages from entering the sitemap.
 */
export const TOOL_SEO_CONTENT: Readonly<Record<string, ToolSeoContent>> = {
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
