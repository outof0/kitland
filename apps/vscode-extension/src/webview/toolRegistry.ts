import { SHARED_CATALOG_TOOL_SLUGS } from "@kitland/ui/catalog";
import type { ToolCapabilities } from "@kitland/ui";
import type { ComponentType } from "react";
import type { CatalogToolEntry } from "../protocol";

/**
 * Props that all tool components in the registry accept.
 * Specialty tools may ignore some props.
 */
export type ToolComponentProps = {
  readonly slug: string;
  readonly toolId: string;
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export type ToolRegistration = {
  readonly slug: string;
  readonly load: () => Promise<{ default: ComponentType<ToolComponentProps> }>;
};

// Lazy-loaded specialty tool wrappers. Each file re-exports the @kitland/ui
// component. Host-only differences are capability flags (no file-open) and
// the absence of web share-link — never a second visual system.
const specialtyLoaders: Record<
  string,
  () => Promise<{ default: ComponentType<ToolComponentProps> }>
> = {
  ...Object.fromEntries(
    SHARED_CATALOG_TOOL_SLUGS.map((slug) => [slug, () => import("./tools/SharedCatalogWrapper")]),
  ),
  base64: () => import("./tools/Base64Wrapper"),
  "html-entities": () => import("./tools/EncodingWrapper"),
  "url-encode": () => import("./tools/EncodingWrapper"),
  "hex-text": () => import("./tools/EncodingWrapper"),
  "unicode-converter": () => import("./tools/EncodingWrapper"),
  "binary-text": () => import("./tools/EncodingWrapper"),
  "rot13-caesar": () => import("./tools/EncodingWrapper"),
  "morse-code": () => import("./tools/EncodingWrapper"),
};

/**
 * Resolve a tool registration for a given catalog entry.
 * Every available VS Code slug must have a shared @kitland/ui renderer.
 */
export function resolveToolRegistration(entry: CatalogToolEntry): ToolRegistration | null {
  const load = specialtyLoaders[entry.slug];
  if (!load) return null;
  return { slug: entry.slug, load };
}
