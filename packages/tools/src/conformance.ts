import { CANONICAL_TOOL_INVENTORY } from "./inventory";
import type { ToolDefinition, ToolPlatformId } from "./types";
import { DEFAULT_TOOL_BUDGET, getToolBudget } from "./tool-budgets";

export type ConformanceIssue = {
  readonly code: string;
  readonly message: string;
  readonly toolSlug?: string;
};

export type ConformanceReport = {
  readonly ready: boolean;
  readonly inventoryCount: number;
  readonly registryCount: number;
  readonly issues: readonly ConformanceIssue[];
  readonly generatedAt: string;
};

/** True only when the id is in the committed product inventory. */
export function isInventoryToolId(id: string): boolean {
  return CANONICAL_TOOL_INVENTORY.some((entry) => entry.id === id);
}

/**
 * Suite conformance: inventory identity, registry completeness, available-host
 * adapter requirements, and per-tool budget coverage.
 */
export function evaluateToolConformance(
  tools: readonly ToolDefinition[],
  adapters: {
    readonly webRendererSlugs: readonly string[];
    readonly browserExtensionSlugs?: readonly string[];
    readonly vscodeExtensionSlugs?: readonly string[];
  },
  now: () => string = () => new Date(0).toISOString(),
): ConformanceReport {
  const issues: ConformanceIssue[] = [];
  const byId = new Map(tools.map((tool) => [tool.id, tool]));
  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

  if (tools.length !== CANONICAL_TOOL_INVENTORY.length) {
    issues.push({
      code: "REGISTRY_SIZE_MISMATCH",
      message: `Registry has ${tools.length} tools; inventory has ${CANONICAL_TOOL_INVENTORY.length}.`,
    });
  }

  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const tool of tools) {
    if (ids.has(tool.id)) {
      issues.push({
        code: "DUPLICATE_TOOL_ID",
        message: `Duplicate tool id ${tool.id}.`,
        toolSlug: tool.slug,
      });
    }
    ids.add(tool.id);
    if (slugs.has(tool.slug)) {
      issues.push({
        code: "DUPLICATE_TOOL_SLUG",
        message: `Duplicate tool slug ${tool.slug}.`,
        toolSlug: tool.slug,
      });
    }
    slugs.add(tool.slug);
  }

  for (const entry of CANONICAL_TOOL_INVENTORY) {
    const tool = byId.get(entry.id);
    if (!tool) {
      issues.push({
        code: "INVENTORY_MISSING_FROM_REGISTRY",
        message: `Inventory id ${entry.id} has no registry definition.`,
        toolSlug: entry.slug,
      });
      continue;
    }
    if (tool.slug !== entry.slug) {
      issues.push({
        code: "INVENTORY_SLUG_MISMATCH",
        message: `Inventory slug ${entry.slug} does not match registry slug ${tool.slug}.`,
        toolSlug: tool.slug,
      });
    }
  }

  for (const tool of tools) {
    if (!isInventoryToolId(tool.id)) {
      issues.push({
        code: "REGISTRY_OUTSIDE_INVENTORY",
        message: `Registry tool ${tool.id} is not in the committed inventory.`,
        toolSlug: tool.slug,
      });
    }

    requireAdapter(tool, "web", adapters.webRendererSlugs, issues);
    requireAdapter(tool, "browser-extension", adapters.browserExtensionSlugs ?? [], issues);
    requireAdapter(tool, "vscode-extension", adapters.vscodeExtensionSlugs ?? [], issues);

    const budget = getToolBudget(tool.slug);
    if (!budget || budget.webChunkKb <= 0) {
      issues.push({
        code: "MISSING_TOOL_BUDGET",
        message: `Tool ${tool.slug} has no positive web chunk budget (default ${DEFAULT_TOOL_BUDGET.webChunkKb} KB).`,
        toolSlug: tool.slug,
      });
    }
  }

  // Orphan adapters are soft signals only when they map to known slugs.
  for (const slug of adapters.webRendererSlugs) {
    if (!bySlug.has(slug)) {
      issues.push({
        code: "ORPHAN_WEB_RENDERER",
        message: `Web renderer registered for unknown slug ${slug}.`,
        toolSlug: slug,
      });
    }
  }

  return {
    ready: issues.length === 0,
    inventoryCount: CANONICAL_TOOL_INVENTORY.length,
    registryCount: tools.length,
    issues,
    generatedAt: now(),
  };
}

function requireAdapter(
  tool: ToolDefinition,
  platform: ToolPlatformId,
  registeredSlugs: readonly string[],
  issues: ConformanceIssue[],
): void {
  if (tool.platforms[platform].status !== "available") return;
  if (!registeredSlugs.includes(tool.slug)) {
    issues.push({
      code: "MISSING_PLATFORM_ADAPTER",
      message: `Tool ${tool.slug} is available on ${platform} but has no adapter/renderer.`,
      toolSlug: tool.slug,
    });
  }
}
