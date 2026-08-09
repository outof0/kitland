import {
  getToolBySlug,
  listToolsByPlatform,
  supportsToolPlatform,
  type CatalogTool,
  type ToolSlug,
} from "@kitland/tool-catalog";

export type ToolMountContext = {
  root: HTMLElement;
};

export type ToolModule = {
  mountTool(context: ToolMountContext): () => void;
};

export type ToolRegistration = {
  tool: CatalogTool;
  load: () => Promise<ToolModule>;
};

/**
 * Explicit renderer exposure is separate from catalog availability. Adding a
 * tool here creates a route-local dynamic chunk; it cannot silently expose a
 * web-only catalog entry in the extension.
 */
const registrations = [
  register("base64", () => import("./tools/base64/adapter")),
] as const satisfies readonly ToolRegistration[];

export const TOOL_REGISTRATIONS: readonly ToolRegistration[] = registrations;
assertRendererRegistryComplete();

const bySlug = new Map<string, ToolRegistration>(
  TOOL_REGISTRATIONS.map((registration) => [registration.tool.slug, registration]),
);

export function getToolRegistration(slug: string): ToolRegistration | undefined {
  return bySlug.get(slug);
}

function register(slug: ToolSlug, load: () => Promise<ToolModule>): ToolRegistration {
  const tool = getToolBySlug(slug);
  if (!tool) throw new Error(`Browser extension renderer has no catalog entry for "${slug}".`);
  if (!supportsToolPlatform(slug, "browser-extension")) {
    throw new Error(`Browser extension renderer exposes non-available catalog tool "${slug}".`);
  }
  return Object.freeze({ tool, load });
}

function assertRendererRegistryComplete(): void {
  const expected = listToolsByPlatform("browser-extension").map((tool) => tool.slug);
  const registered = TOOL_REGISTRATIONS.map(({ tool }) => tool.slug);
  const unique = new Set(registered);
  const complete =
    unique.size === registered.length &&
    expected.length === registered.length &&
    expected.every((slug) => unique.has(slug));

  if (!complete) {
    throw new Error(
      `Browser extension registry mismatch: expected [${expected.join(", ")}], received [${registered.join(", ")}].`,
    );
  }
}
