import { CANONICAL_TOOL_INVENTORY } from "./inventory";
import { encodingTools } from "./tools/encoding";
import { jsonMarkupTools } from "./tools/json-markup";
import { cryptoSecurityTools } from "./tools/crypto-security";
import { generatorTools } from "./tools/generators";
import { textRegexTools } from "./tools/text-regex";
import { datetimeUtilityTools } from "./tools/datetime-utility";
import { evaluateCatalogReleaseReadiness } from "./release";
import { evaluateCatalogPhasedReleaseReadiness, selectPhasedReleaseTools } from "./phased-release";
import {
  evaluateCatalogSurfaceRolloutReadiness,
  selectSurfaceRolloutCandidates,
  selectSurfaceRolloutTools,
} from "./surface-rollout";
import type {
  ToolDefinition,
  ToolFamilyId,
  ToolPlatformContract,
  ToolPlatformId,
  ToolPlatformStatus,
} from "./types";

const ALL_DOMAIN_TOOLS: readonly ToolDefinition[] = Object.freeze([
  ...encodingTools,
  ...jsonMarkupTools,
  ...cryptoSecurityTools,
  ...generatorTools,
  ...textRegexTools,
  ...datetimeUtilityTools,
]);

const domainToolsById = new Map<string, ToolDefinition>(
  ALL_DOMAIN_TOOLS.map((tool) => [tool.id, tool]),
);

/**
 * Ordered catalog of tools matching the canonical product inventory.
 * Each tool explicitly declares its three platform contracts; availability
 * is never inferred from another host (KIT-0020 path B completed via explicit
 * per-tool declarations).
 */
const toolDefinitions = CANONICAL_TOOL_INVENTORY.map((entry) => {
  const tool = domainToolsById.get(entry.id);
  if (!tool) {
    throw new Error(`Missing tool definition for inventory id "${entry.id}".`);
  }
  return tool;
}) as unknown as readonly ToolDefinition[];

assertUniqueCatalogKeys(toolDefinitions);

export const TOOLS = Object.freeze(toolDefinitions);

export type CatalogTool = (typeof TOOLS)[number];
export type ToolId = (typeof CANONICAL_TOOL_INVENTORY)[number]["id"];
export type ToolSlug = (typeof CANONICAL_TOOL_INVENTORY)[number]["slug"];
export type AvailableTool = ToolDefinition & { readonly status: "available" };
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

/** Tools certified for rollout on one product surface. */
export function listSurfaceRolloutTools(platform: ToolPlatformId): readonly CatalogTool[] {
  return selectSurfaceRolloutTools(TOOLS, platform) as readonly CatalogTool[];
}

/**
 * Implemented tools that are structurally eligible for the next certification
 * wave on one surface. This is a queue, not a release decision.
 */
export function listSurfaceRolloutCandidates(platform: ToolPlatformId): readonly CatalogTool[] {
  return selectSurfaceRolloutCandidates(TOOLS, platform) as readonly CatalogTool[];
}

/** Machine-readable rollout gate for one product surface. */
export function getCatalogSurfaceRolloutReadiness(platform: ToolPlatformId) {
  return evaluateCatalogSurfaceRolloutReadiness(TOOLS, platform);
}

/**
 * @deprecated Use listSurfaceRolloutTools("web"). Release certification does
 * not decide catalog discovery or route availability.
 */
export function listReleaseReadyTools(): readonly CatalogTool[] {
  return selectPhasedReleaseTools(TOOLS) as readonly CatalogTool[];
}

/** @deprecated Use getCatalogSurfaceRolloutReadiness("web"). */
export function getCatalogPhasedReleaseReadiness() {
  return evaluateCatalogPhasedReleaseReadiness(TOOLS);
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
