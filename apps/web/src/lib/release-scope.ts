import { listAvailableTools, listTools, type RegistryTool } from "@kitland/tools";

/**
 * Returns the complete public product registry. The registry is a roadmap as
 * well as a directory. Per-tool rollout certification must never shrink this
 * public surface or change which registry-available tools are runnable.
 */
export function listWebTools(): readonly RegistryTool[] {
  return listTools();
}

export function listWebAvailableTools(): readonly RegistryTool[] {
  return listAvailableTools();
}

export function getWebToolBySlug(slug: string): RegistryTool | undefined {
  return listWebTools().find((tool) => tool.slug === slug);
}

export function isWebAvailableToolSlug(slug: string): boolean {
  return listWebAvailableTools().some((tool) => tool.slug === slug);
}
