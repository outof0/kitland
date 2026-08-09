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

/** First individually verified post-foundation tool. */
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
] as const satisfies readonly ToolDefinition[];
