import { TOOL_PLATFORM_IDS, type ToolDefinition, type ToolPlatformId } from "./types";
import { CANONICAL_TOOL_INVENTORY, type CanonicalToolInventoryEntry } from "./inventory";

export const REGISTRY_RELEASE_POLICY = Object.freeze({
  /** Product direction: the first public production release is the full suite. */
  targetToolCount: 64,
  requiredWebPlatform: "web" as const satisfies ToolPlatformId,
  requiredReleaseStage: "release-ready" as const,
});

export type RegistryReleaseIssueCode =
  | "TOOL_COUNT_MISMATCH"
  | "CANONICAL_INVENTORY_MISSING"
  | "CANONICAL_INVENTORY_COUNT_MISMATCH"
  | "DUPLICATE_CANONICAL_TOOL_ID"
  | "DUPLICATE_CANONICAL_TOOL_SLUG"
  | "REGISTRY_INVENTORY_MISMATCH"
  | "DUPLICATE_TOOL_ID"
  | "DUPLICATE_TOOL_SLUG"
  | "TOOL_NOT_RELEASE_READY"
  | "WEB_PLATFORM_UNAVAILABLE"
  | "PLATFORM_CONTRACT_UNRESOLVED";

export type RegistryReleaseIssue = {
  readonly code: RegistryReleaseIssueCode;
  readonly message: string;
  readonly toolSlug?: string;
};

export type RegistryReleaseReadiness = {
  readonly ready: boolean;
  readonly targetToolCount: number;
  readonly currentToolCount: number;
  readonly canonicalInventoryCount: number | null;
  readonly releaseReadyToolCount: number;
  readonly issues: readonly RegistryReleaseIssue[];
};

/**
 * Machine-readable complete-suite gate. Preview builds and tests may run while
 * this is false; a production release may not.
 */
export function evaluateRegistryReleaseReadiness(
  tools: readonly ToolDefinition[],
  canonicalInventory: readonly CanonicalToolInventoryEntry[] | null = CANONICAL_TOOL_INVENTORY,
): RegistryReleaseReadiness {
  const issues: RegistryReleaseIssue[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  if (tools.length !== REGISTRY_RELEASE_POLICY.targetToolCount) {
    const toolNoun = tools.length === 1 ? "tool" : "tools";
    issues.push({
      code: "TOOL_COUNT_MISMATCH",
      message: `Registry has ${tools.length} ${toolNoun}; exactly ${REGISTRY_RELEASE_POLICY.targetToolCount} are required for the complete-suite release.`,
    });
  }

  validateCanonicalInventory(tools, canonicalInventory, issues);

  for (const tool of tools) {
    if (ids.has(tool.id)) {
      issues.push({
        code: "DUPLICATE_TOOL_ID",
        message: `Tool id "${tool.id}" is duplicated.`,
        toolSlug: tool.slug,
      });
    }
    if (slugs.has(tool.slug)) {
      issues.push({
        code: "DUPLICATE_TOOL_SLUG",
        message: `Tool slug "${tool.slug}" is duplicated.`,
        toolSlug: tool.slug,
      });
    }
    ids.add(tool.id);
    slugs.add(tool.slug);

    if (tool.releaseStage !== REGISTRY_RELEASE_POLICY.requiredReleaseStage) {
      issues.push({
        code: "TOOL_NOT_RELEASE_READY",
        message: `Tool "${tool.slug}" is ${tool.releaseStage}, not release-ready.`,
        toolSlug: tool.slug,
      });
    }

    if (
      tool.status !== "available" ||
      tool.platforms[REGISTRY_RELEASE_POLICY.requiredWebPlatform].status !== "available"
    ) {
      issues.push({
        code: "WEB_PLATFORM_UNAVAILABLE",
        message: `Tool "${tool.slug}" is not available on the required web platform.`,
        toolSlug: tool.slug,
      });
    }

    for (const platform of TOOL_PLATFORM_IDS) {
      if (tool.platforms[platform].status === "planned") {
        issues.push({
          code: "PLATFORM_CONTRACT_UNRESOLVED",
          message: `Tool "${tool.slug}" still has a planned ${platform} contract.`,
          toolSlug: tool.slug,
        });
      }
    }
  }

  const frozenIssues = Object.freeze(issues.map((issue) => Object.freeze(issue)));
  return Object.freeze({
    ready: frozenIssues.length === 0,
    targetToolCount: REGISTRY_RELEASE_POLICY.targetToolCount,
    currentToolCount: tools.length,
    canonicalInventoryCount: canonicalInventory?.length ?? null,
    releaseReadyToolCount: tools.filter(
      (tool) => tool.releaseStage === REGISTRY_RELEASE_POLICY.requiredReleaseStage,
    ).length,
    issues: frozenIssues,
  });
}

function validateCanonicalInventory(
  tools: readonly ToolDefinition[],
  canonicalInventory: readonly CanonicalToolInventoryEntry[] | null,
  issues: RegistryReleaseIssue[],
): void {
  if (canonicalInventory === null) {
    issues.push({
      code: "CANONICAL_INVENTORY_MISSING",
      message:
        "The canonical 64-tool inventory has not been committed; placeholder or inferred tool lists cannot unlock a production release.",
    });
    return;
  }

  if (canonicalInventory.length !== REGISTRY_RELEASE_POLICY.targetToolCount) {
    issues.push({
      code: "CANONICAL_INVENTORY_COUNT_MISMATCH",
      message: `Canonical inventory has ${canonicalInventory.length} entries; exactly ${REGISTRY_RELEASE_POLICY.targetToolCount} are required.`,
    });
  }

  const canonicalIds = new Set<string>();
  const canonicalSlugs = new Set<string>();
  const canonicalById = new Map<string, CanonicalToolInventoryEntry>();

  for (const entry of canonicalInventory) {
    if (canonicalIds.has(entry.id)) {
      issues.push({
        code: "DUPLICATE_CANONICAL_TOOL_ID",
        message: `Canonical inventory tool id "${entry.id}" is duplicated.`,
        toolSlug: entry.slug,
      });
    }
    if (canonicalSlugs.has(entry.slug)) {
      issues.push({
        code: "DUPLICATE_CANONICAL_TOOL_SLUG",
        message: `Canonical inventory tool slug "${entry.slug}" is duplicated.`,
        toolSlug: entry.slug,
      });
    }
    canonicalIds.add(entry.id);
    canonicalSlugs.add(entry.slug);
    canonicalById.set(entry.id, entry);
  }

  const registryIds = new Set(tools.map((tool) => tool.id));
  for (const tool of tools) {
    const canonical = canonicalById.get(tool.id);
    if (canonical?.slug !== tool.slug) {
      issues.push({
        code: "REGISTRY_INVENTORY_MISMATCH",
        message: canonical
          ? `Registry tool id "${tool.id}" uses slug "${tool.slug}"; canonical slug is "${canonical.slug}".`
          : `Registry tool "${tool.id}" / "${tool.slug}" is absent from the canonical inventory.`,
        toolSlug: tool.slug,
      });
    }
  }

  for (const entry of canonicalInventory) {
    if (!registryIds.has(entry.id)) {
      issues.push({
        code: "REGISTRY_INVENTORY_MISMATCH",
        message: `Canonical tool "${entry.id}" / "${entry.slug}" is missing from the registry.`,
        toolSlug: entry.slug,
      });
    }
  }
}
