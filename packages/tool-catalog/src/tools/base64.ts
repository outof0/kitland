import { defineTool } from "../define-tool";

/**
 * Catalog entry for the Base64 sample tool.
 * Runtime logic lives in `@kitland/core` (`runBase64`).
 */
export const base64Tool = defineTool({
  id: "base64",
  slug: "base64",
  name: "Base64 Encode / Decode",
  shortName: "Base64",
  family: "encoding-text",
  description: "Encode UTF-8 text or decode Standard and URL-safe Base64 locally on your device.",
  keywords: ["base64", "encode", "decode", "b64", "url-safe", "utf-8", "encoding"],
  pattern: "transform",
  status: "available",
  releaseStage: "reference",
  platforms: {
    web: {
      status: "available",
      capabilities: [
        "transform-text",
        "clipboard-write",
        "file-import",
        "file-export",
        "share-link",
      ],
    },
    "browser-extension": {
      status: "available",
      capabilities: ["transform-text", "clipboard-write"],
    },
    "vscode-extension": {
      status: "available",
      capabilities: ["transform-text", "active-editor", "clipboard-write"],
    },
  },
  /** design.pen frame name / id */
  designFrame: "Base64 (Z1RWQB)",
} as const);
