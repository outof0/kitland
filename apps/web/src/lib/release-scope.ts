import { listAvailableTools, listTools, type CatalogTool } from "@kitland/tools";

/**
 * Returns the complete public product catalog. The catalog is a roadmap as
 * well as a directory. Per-tool rollout certification must never shrink this
 * public surface or change which catalog-available tools are runnable.
 */
export function listWebTools(): readonly CatalogTool[] {
  return listTools();
}

export function listWebAvailableTools(): readonly CatalogTool[] {
  return listAvailableTools();
}

export function getWebToolBySlug(slug: string): CatalogTool | undefined {
  return listWebTools().find((tool) => tool.slug === slug);
}

export function isWebAvailableToolSlug(slug: string): boolean {
  return listWebAvailableTools().some((tool) => tool.slug === slug);
}
