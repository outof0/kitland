import { base64Tool } from "./tools/base64";
import { CANONICAL_TOOL_INVENTORY } from "./inventory";
import { plannedTools } from "./tools/planned";
import { waveOneTools } from "./tools/wave-1";
import { waveTwoTools } from "./tools/wave-2";
import { waveThreeTools } from "./tools/wave-3";
import { waveFourTools } from "./tools/wave-4";
import { evaluateCatalogReleaseReadiness } from "./release";
import type {
  ToolDefinition,
  ToolFamilyId,
  ToolPlatformContract,
  ToolPlatformId,
  ToolPlatformStatus,
} from "./types";

/**
 * Ordered catalog of tools. New tools: add definition file under `tools/`,
 * import here, and append to `TOOLS`.
 */
// Keep the visual/product order from `design/design.pen`: Base64 is artboard
// 11, despite being the first implementation added to the repository.
const toolDefinitions = [
  toolAt(waveOneTools, 0),
  toolAt(waveThreeTools, 0),
  toolAt(waveTwoTools, 0),
  toolAt(waveOneTools, 1),
  toolAt(waveOneTools, 2),
  toolAt(waveTwoTools, 1),
  toolAt(waveTwoTools, 2),
  toolAt(waveTwoTools, 3),
  toolAt(waveThreeTools, 1),
  toolAt(waveThreeTools, 2),
  base64Tool,
  toolAt(waveThreeTools, 4),
  toolAt(waveOneTools, 3),
  toolAt(waveOneTools, 4),
  toolAt(waveOneTools, 5),
  toolAt(waveOneTools, 6),
  toolAt(waveFourTools, 0),
  toolAt(plannedTools, 16),
  toolAt(waveFourTools, 1),
  toolAt(waveFourTools, 2),
  toolAt(waveFourTools, 4),
  toolAt(waveFourTools, 3),
  toolAt(waveFourTools, 5),
  toolAt(waveFourTools, 6),
  toolAt(waveFourTools, 7),
  toolAt(waveThreeTools, 5),
  toolAt(waveFourTools, 8),
  toolAt(waveFourTools, 9),
  toolAt(waveFourTools, 10),
  toolAt(waveFourTools, 11),
  toolAt(waveFourTools, 12),
  toolAt(waveFourTools, 13),
  toolAt(waveFourTools, 14),
  toolAt(waveFourTools, 15),
  toolAt(waveTwoTools, 4),
  toolAt(waveTwoTools, 5),
  toolAt(waveOneTools, 7),
  toolAt(waveOneTools, 8),
  toolAt(waveOneTools, 9),
  toolAt(waveTwoTools, 6),
  toolAt(waveOneTools, 10),
  toolAt(waveTwoTools, 7),
  toolAt(waveFourTools, 16),
  toolAt(waveFourTools, 17),
  toolAt(waveFourTools, 18),
  toolAt(waveFourTools, 19),
  toolAt(waveFourTools, 20),
  toolAt(waveTwoTools, 8),
  toolAt(waveTwoTools, 9),
  toolAt(waveFourTools, 21),
  ...plannedTools.slice(49, 61),
  toolAt(waveThreeTools, 3),
  ...plannedTools.slice(62),
] as const satisfies readonly ToolDefinition[];
assertUniqueCatalogKeys(toolDefinitions);

function toolAt<T>(tools: readonly T[], index: number): T {
  const tool = tools[index];
  if (tool === undefined) {
    throw new Error(`Catalog assembly references missing tool index ${index}.`);
  }
  return tool;
}

export const TOOLS = Object.freeze(toolDefinitions);

export type CatalogTool = (typeof TOOLS)[number];
export type ToolId = (typeof CANONICAL_TOOL_INVENTORY)[number]["id"];
export type ToolSlug = (typeof CANONICAL_TOOL_INVENTORY)[number]["slug"];
export type AvailableTool = Extract<CatalogTool, { readonly status: "available" }>;
export type AvailableToolSlug = AvailableTool["slug"];

const bySlug = new Map<string, CatalogTool>(TOOLS.map((tool) => [tool.slug, tool]));
const byId = new Map<string, CatalogTool>(TOOLS.map((tool) => [tool.id, tool]));

export function listTools(): readonly CatalogTool[] {
  return TOOLS;
}

export function listAvailableTools(): readonly AvailableTool[] {
  return TOOLS.filter((tool): tool is AvailableTool => tool.status === "available");
}

export function getToolBySlug(slug: string): CatalogTool | undefined {
  return bySlug.get(slug);
}

export function getToolById(id: string): CatalogTool | undefined {
  return byId.get(id);
}

export function listToolsByFamily(family: ToolFamilyId): readonly CatalogTool[] {
  return TOOLS.filter((t) => t.family === family);
}

export function listToolsByPlatform(
  platform: ToolPlatformId,
  status: ToolPlatformStatus = "available",
): readonly CatalogTool[] {
  return TOOLS.filter((tool) => tool.platforms[platform].status === status);
}

export function getToolPlatformContract(
  slug: string,
  platform: ToolPlatformId,
): ToolPlatformContract | undefined {
  return getToolBySlug(slug)?.platforms[platform];
}

export function supportsToolPlatform(slug: string, platform: ToolPlatformId): boolean {
  return getToolPlatformContract(slug, platform)?.status === "available";
}

export function isToolSlug(slug: string): slug is ToolSlug {
  return bySlug.has(slug);
}

export function isAvailableToolSlug(slug: string): slug is AvailableToolSlug {
  return getToolBySlug(slug)?.status === "available";
}

export function getCatalogReleaseReadiness() {
  return evaluateCatalogReleaseReadiness(TOOLS);
}

function assertUniqueCatalogKeys(tools: readonly ToolDefinition[]): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const tool of tools) {
    if (ids.has(tool.id)) throw new Error(`Duplicate tool id "${tool.id}".`);
    if (slugs.has(tool.slug)) throw new Error(`Duplicate tool slug "${tool.slug}".`);
    ids.add(tool.id);
    slugs.add(tool.slug);
  }
}
