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
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
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
      capabilities: ["transform-text", "clipboard-write", "file-import", "file-export"],
    },
    "vscode-extension": {
      status: "available",
      capabilities: ["transform-text", "active-editor", "clipboard-write"],
    },
  },
  designFrame: "Base64 · Desktop Dark · Success (Z1RWQB)",
} as const);

export const urlEncodeTool = defineTool({
  id: "url-encode",
  slug: "url-encode",
  name: "URL Encode",
  shortName: "URL Encode",
  family: "encoding-text",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Encode or decode URL components and percent-encoded parameters locally.",
  keywords: ["url", "encode", "decode", "percent"],
  designFrame: "URL Encode (C2SF76)",
  platforms: multiHostTransformPlatforms,
} as const);

export const htmlEntitiesTool = defineTool({
  id: "html-entities",
  slug: "html-entities",
  name: "HTML Entities",
  shortName: "HTML Entities",
  family: "encoding-text",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Encode or decode common HTML character entities locally.",
  keywords: ["html", "entities", "encode", "decode", "escape"],
  designFrame: "HTML Entities (b9fWNy)",
  platforms: multiHostTransformPlatforms,
} as const);

export const hexTextTool = defineTool({
  id: "hex-text",
  slug: "hex-text",
  name: "Hex Text",
  shortName: "Hex Text",
  family: "encoding-text",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert UTF-8 text to and from hexadecimal bytes locally.",
  keywords: ["hex", "text", "encode", "decode", "bytes"],
  designFrame: "Hex Text (RhxHF)",
  platforms: multiHostTransformPlatforms,
} as const);

export const unicodeConverterTool = defineTool({
  id: "unicode-converter",
  slug: "unicode-converter",
  name: "Unicode Converter",
  shortName: "Unicode Converter",
  family: "encoding-text",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert Unicode text to and from explicit code point notation.",
  keywords: ["unicode", "codepoint", "utf", "characters"],
  designFrame: "Unicode Converter (DZFSs)",
  platforms: multiHostTransformPlatforms,
} as const);

export const binaryTextTool = defineTool({
  id: "binary-text",
  slug: "binary-text",
  name: "Binary Text",
  shortName: "Binary Text",
  family: "encoding-text",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Convert UTF-8 text to and from binary byte notation locally.",
  keywords: ["binary", "text", "bits", "bytes", "encode"],
  designFrame: "Binary Text (Ldrhp)",
  platforms: multiHostTransformPlatforms,
} as const);

export const rot13CaesarTool = defineTool({
  id: "rot13-caesar",
  slug: "rot13-caesar",
  name: "ROT13 Caesar",
  shortName: "ROT13 Caesar",
  family: "encoding-text",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Apply ROT13 and customizable Caesar cipher text shifts locally.",
  keywords: ["rot13", "caesar", "cipher"],
  designFrame: "ROT13 Caesar (QiDpT)",
  platforms: multiHostTransformPlatforms,
} as const);

export const morseCodeTool = defineTool({
  id: "morse-code",
  slug: "morse-code",
  name: "Morse Code",
  shortName: "Morse Code",
  family: "encoding-text",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Encode or decode ITU Morse for Latin letters and digits locally.",
  keywords: ["morse", "code", "encode", "decode"],
  designFrame: "Morse Code (c087C)",
  platforms: multiHostTransformPlatforms,
} as const);

export const encodingTools = [
  base64Tool,
  urlEncodeTool,
  htmlEntitiesTool,
  hexTextTool,
  unicodeConverterTool,
  binaryTextTool,
  rot13CaesarTool,
  morseCodeTool,
] as const satisfies readonly ToolDefinition[];
