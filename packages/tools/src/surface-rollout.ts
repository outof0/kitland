import { CANONICAL_TOOL_INVENTORY, type CanonicalToolInventoryEntry } from "./inventory";
import { TOOL_PLATFORM_IDS, type ToolDefinition, type ToolPlatformId } from "./types";

/**
 * A rollout certifies a tool on one product surface at a time. It is separate
 * from both public discovery and the coordinated 64-tool completion milestone:
 * a web tool may be ready to ship while its extension adapters are still in
 * progress.
 */
export const SURFACE_ROLLOUT_POLICY = Object.freeze({
  defaultPlatform: "web" as const satisfies ToolPlatformId,
  requiredReleaseStage: "release-ready" as const,
});

export type CatalogSurfaceRolloutIssueCode =
  | "NO_SURFACE_ROLLOUT_TOOLS"
  | "DUPLICATE_SURFACE_ROLLOUT_TOOL_ID"
  | "DUPLICATE_SURFACE_ROLLOUT_TOOL_SLUG"
  | "SURFACE_ROLLOUT_TOOL_NOT_IN_CANONICAL_INVENTORY"
  | "SURFACE_ROLLOUT_TOOL_CANONICAL_IDENTITY_MISMATCH"
  | "SURFACE_ROLLOUT_TOOL_NOT_RELEASE_READY"
  | "SURFACE_ROLLOUT_PLATFORM_UNAVAILABLE";

export type CatalogSurfaceRolloutIssue = {
  readonly code: CatalogSurfaceRolloutIssueCode;
  readonly message: string;
  readonly toolSlug?: string;
};

export type CatalogSurfaceRolloutReadiness = {
  readonly ready: boolean;
  readonly platform: ToolPlatformId;
  /** Ordered canonical slugs certified for this surface. */
  readonly targetToolSlugs: readonly string[];
  readonly targetToolCount: number;
  /** Implemented candidates that can next be certified on this surface. */
  readonly candidateToolSlugs: readonly string[];
  readonly candidateToolCount: number;
  readonly issues: readonly CatalogSurfaceRolloutIssue[];
};

const NO_RELEASE_PLATFORMS = Object.freeze([]) as readonly ToolPlatformId[];

/** Whether a tool declares a certification for a product surface. */
export function declaresSurfaceRollout(tool: ToolDefinition, platform: ToolPlatformId): boolean {
  return (tool.releasePlatforms ?? NO_RELEASE_PLATFORMS).includes(platform);
}

/** Whether the declaration is a complete certification rather than malformed data. */
export function isToolCertifiedForSurface(tool: ToolDefinition, platform: ToolPlatformId): boolean {
  return (
    tool.releaseStage === SURFACE_ROLLOUT_POLICY.requiredReleaseStage &&
    declaresSurfaceRollout(tool, platform)
  );
}

/**
 * The declared rollout set for one surface. The evaluator deliberately keeps
 * malformed declarations in this result so CI can report the exact tool that
 * needs repair instead of silently omitting it.
 */
export function selectSurfaceRolloutTools(
  tools: readonly ToolDefinition[],
  platform: ToolPlatformId,
): readonly ToolDefinition[] {
  return tools.filter((tool) => declaresSurfaceRollout(tool, platform));
}

/**
 * Returns a deterministic promotion queue for a surface. This is discovery
 * automation only: a candidate still needs its focused host/UI/release tests
 * before a reviewer adds the platform to `releasePlatforms`.
 */
export function selectSurfaceRolloutCandidates(
  tools: readonly ToolDefinition[],
  platform: ToolPlatformId,
): readonly ToolDefinition[] {
  return tools.filter(
    (tool) =>
      tool.platforms[platform].status === "available" &&
      !declaresSurfaceRollout(tool, platform) &&
      (tool.releaseStage === "implemented" || tool.releaseStage === "release-ready"),
  );
}

/**
 * Evaluates the release contract for one host only. Planned or unsupported
 * contracts on other hosts are intentionally irrelevant here; they are
 * evaluated when those hosts are promoted.
 */
export function evaluateCatalogSurfaceRolloutReadiness(
  tools: readonly ToolDefinition[],
  platform: ToolPlatformId,
  canonicalInventory: readonly CanonicalToolInventoryEntry[] = CANONICAL_TOOL_INVENTORY,
): CatalogSurfaceRolloutReadiness {
  const targetTools = selectSurfaceRolloutTools(tools, platform);
  const candidateTools = selectSurfaceRolloutCandidates(tools, platform);
  const issues: CatalogSurfaceRolloutIssue[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const canonicalById = new Map(canonicalInventory.map((entry) => [entry.id, entry]));

  if (targetTools.length === 0) {
    issues.push({
      code: "NO_SURFACE_ROLLOUT_TOOLS",
      message: `Rollout is blocked because no tools are certified for ${platform}.`,
    });
  }

  for (const tool of targetTools) {
    if (ids.has(tool.id)) {
      issues.push({
        code: "DUPLICATE_SURFACE_ROLLOUT_TOOL_ID",
        message: `Rollout tool id "${tool.id}" is duplicated for ${platform}.`,
        toolSlug: tool.slug,
      });
    }
    if (slugs.has(tool.slug)) {
      issues.push({
        code: "DUPLICATE_SURFACE_ROLLOUT_TOOL_SLUG",
        message: `Rollout tool slug "${tool.slug}" is duplicated for ${platform}.`,
        toolSlug: tool.slug,
      });
    }
    ids.add(tool.id);
    slugs.add(tool.slug);

    const canonical = canonicalById.get(tool.id);
    if (!canonical) {
      issues.push({
        code: "SURFACE_ROLLOUT_TOOL_NOT_IN_CANONICAL_INVENTORY",
        message: `Rollout tool "${tool.id}" / "${tool.slug}" is absent from the canonical inventory.`,
        toolSlug: tool.slug,
      });
    } else if (canonical.slug !== tool.slug) {
      issues.push({
        code: "SURFACE_ROLLOUT_TOOL_CANONICAL_IDENTITY_MISMATCH",
        message: `Rollout tool id "${tool.id}" uses slug "${tool.slug}"; canonical slug is "${canonical.slug}".`,
        toolSlug: tool.slug,
      });
    }

    if (tool.releaseStage !== SURFACE_ROLLOUT_POLICY.requiredReleaseStage) {
      issues.push({
        code: "SURFACE_ROLLOUT_TOOL_NOT_RELEASE_READY",
        message: `Rollout tool "${tool.slug}" is ${tool.releaseStage}, not release-ready.`,
        toolSlug: tool.slug,
      });
    }

    const platformAvailable = tool.platforms[platform].status === "available";
    const webStatusAvailable = platform !== "web" || tool.status === "available";
    if (!platformAvailable || !webStatusAvailable) {
      issues.push({
        code: "SURFACE_ROLLOUT_PLATFORM_UNAVAILABLE",
        message: `Rollout tool "${tool.slug}" is not available on ${platform}.`,
        toolSlug: tool.slug,
      });
    }
  }

  const frozenIssues = Object.freeze(issues.map((issue) => Object.freeze(issue)));
  const targetToolSlugs = Object.freeze(targetTools.map((tool) => tool.slug));
  const candidateToolSlugs = Object.freeze(candidateTools.map((tool) => tool.slug));
  return Object.freeze({
    ready: frozenIssues.length === 0,
    platform,
    targetToolSlugs,
    targetToolCount: targetToolSlugs.length,
    candidateToolSlugs,
    candidateToolCount: candidateToolSlugs.length,
    issues: frozenIssues,
  });
}

/** Parse a user/CI surface selector without accepting an implicit unknown host. */
export function parseSurfaceRolloutPlatform(value: string | undefined): ToolPlatformId {
  if (value === undefined || value === "") return SURFACE_ROLLOUT_POLICY.defaultPlatform;
  if (TOOL_PLATFORM_IDS.includes(value as ToolPlatformId)) return value as ToolPlatformId;
  throw new Error(
    `Invalid KITLAND_RELEASE_PLATFORM "${value}". Use one of: ${TOOL_PLATFORM_IDS.join(", ")}.`,
  );
}
