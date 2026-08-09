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

/** Individually verified post-foundation tools. */
export const waveFourTools = [
  defineTool({
    id: "rot13-caesar",
    slug: "rot13-caesar",
    name: "ROT13 Caesar",
    shortName: "ROT13 Caesar",
    family: "encoding-text",
    pattern: "transform",
    status: "available",
    releaseStage: "implemented",
    description: "Apply ROT13 and Caesar text shifts locally.",
    keywords: ["rot13", "caesar", "cipher"],
    designFrame: "ROT13 Caesar (QiDpT)",
    platforms: webTransformPlatforms,
  }),
  defineTool({
    id: "sha-hash",
    slug: "sha-hash",
    name: "Hash (SHA)",
    shortName: "SHA Hash",
    family: "hash-crypto",
    pattern: "transform",
    status: "available",
    releaseStage: "implemented",
    description: "Compute SHA-256 digests locally for supplied UTF-8 text.",
    keywords: ["sha", "hash", "sha256", "digest"],
    designFrame: "Hash (SHA) (U1lUQ0)",
    platforms: webTransformPlatforms,
  }),
  defineTool({
    id: "hmac-generator",
    slug: "hmac-generator",
    name: "HMAC Generator",
    shortName: "HMAC",
    family: "hash-crypto",
    pattern: "transform",
    status: "available",
    releaseStage: "implemented",
    description: "Create HMAC-SHA-256 signatures locally from a secret and message.",
    keywords: ["hmac", "sha256", "signature", "keyed hash"],
    designFrame: "HMAC Generator (p0yzv)",
    platforms: webTransformPlatforms,
  }),
] as const satisfies readonly ToolDefinition[];
