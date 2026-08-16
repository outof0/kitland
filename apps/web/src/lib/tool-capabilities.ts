import type { ToolCapabilities } from "@kitland/ui";
import { getToolBySlug, type ToolCapabilityId } from "@kitland/tools";

/**
 * Derive the web host's local file powers from a tool's registry contract.
 *
 * The registry is the single source of truth for which user-visible powers a
 * tool exposes on a platform. The web host must not re-authorize file
 * import/export the registry did not grant: if a tool's `web` platform entry
 * omits `file-import` / `file-export`, those controls stay hidden (see
 * docs/architecture/platform-capabilities.md).
 */
export function capabilitiesForWebTool(slug: string): ToolCapabilities {
  const tool = getToolBySlug(slug);
  const capabilities = tool?.platforms.web.capabilities ?? [];
  return {
    fileOpen: capabilities.includes("file-import" satisfies ToolCapabilityId),
    fileSave: capabilities.includes("file-export" satisfies ToolCapabilityId),
  };
}
