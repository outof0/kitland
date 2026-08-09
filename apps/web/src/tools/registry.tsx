import {
  isAvailableToolSlug,
  listAvailableTools,
  type AvailableToolSlug,
} from "@kitland/tool-catalog";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type ToolRendererModule = { readonly default: ComponentType };
type ToolRendererLoader = () => Promise<ToolRendererModule>;
export type ToolRenderer = LazyExoticComponent<ComponentType>;

/**
 * Every available catalog slug must have a dynamic entry. The exhaustive
 * record makes omissions a type error while preserving one renderer chunk per
 * tool instead of pulling the full suite into ToolWorkspace's client island.
 */
const TOOL_RENDERER_LOADERS = Object.freeze({
  base64: async () => ({ default: (await import("./Base64Tool")).Base64Tool }),
} satisfies Record<AvailableToolSlug, ToolRendererLoader>);

const rendererCache = new Map<AvailableToolSlug, ToolRenderer>();

assertRendererRegistryComplete();

export function getToolRenderer(slug: string): ToolRenderer | undefined {
  if (!isRegisteredToolSlug(slug)) return undefined;

  const cached = rendererCache.get(slug);
  if (cached) return cached;

  const renderer = lazy(TOOL_RENDERER_LOADERS[slug]);
  rendererCache.set(slug, renderer);
  return renderer;
}

export function hasToolRenderer(slug: string): boolean {
  return isRegisteredToolSlug(slug);
}

export function isRegisteredToolSlug(slug: string): slug is AvailableToolSlug {
  return isAvailableToolSlug(slug) && Object.hasOwn(TOOL_RENDERER_LOADERS, slug);
}

function assertRendererRegistryComplete(): void {
  const availableSlugs = listAvailableTools().map((tool) => tool.slug);
  const registeredSlugs = Object.keys(TOOL_RENDERER_LOADERS);
  const complete =
    availableSlugs.length === registeredSlugs.length &&
    availableSlugs.every((slug) => registeredSlugs.includes(slug));

  if (!complete) {
    throw new Error(
      `Tool renderer registry does not match available catalog tools: expected [${availableSlugs.join(
        ", ",
      )}], received [${registeredSlugs.join(", ")}].`,
    );
  }
}
