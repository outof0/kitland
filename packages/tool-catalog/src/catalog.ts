import { base64Tool } from "./tools/base64";
import { CANONICAL_TOOL_INVENTORY } from "./inventory";
import { plannedTools } from "./tools/planned";
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
  ...plannedTools.slice(0, 10),
  base64Tool,
  ...plannedTools.slice(10),
] as const satisfies readonly ToolDefinition[];
assertUniqueCatalogKeys(toolDefinitions);

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
