import {
  listTools,
  type ToolDefinition,
  type ToolFamilyId,
  type ToolStatus,
} from "@kitland/tool-catalog";

/**
 * The catalog owns the inventory. Navigation only owns presentation: section
 * order, labels, and a sensible fallback icon. This prevents a tool being
 * published (or renamed) without appearing in the workspace navigation.
 */
type NavSectionPresentation = {
  id: string;
  label: string;
  icon: string;
};

const NAV_SECTIONS: Record<ToolFamilyId, NavSectionPresentation> = {
  "json-markup": {
    id: "format-validate",
    label: "Format & Validate",
    icon: "braces",
  },
  "encoding-text": {
    id: "encode-decode",
    label: "Encode / Decode",
    icon: "binary",
  },
  "hash-crypto": {
    id: "crypto-security",
    label: "Crypto & Security",
    icon: "shield",
  },
  "text-regex": {
    id: "text-tools",
    label: "Text tools",
    icon: "text-cursor-input",
  },
  generators: {
    id: "generate",
    label: "Generate",
    icon: "dices",
  },
  "time-network": {
    id: "time-network",
    label: "Time & Network",
    icon: "globe",
  },
};

const FAMILY_ORDER: readonly ToolFamilyId[] = [
  "json-markup",
  "encoding-text",
  "hash-crypto",
  "text-regex",
  "generators",
  "time-network",
];

/** A few icons improve scanability; all new tools fall back to their family. */
const ICON_BY_SLUG: Readonly<Record<string, string>> = {
  base64: "binary",
};

export type ToolNavItem = {
  label: string;
  icon: string;
  slug: string;
  status: ToolStatus;
  /** Search metadata comes from the catalog, rather than a second list. */
  searchText: string;
};

export type ToolNavSection = {
  id: string;
  label: string;
  kind: "group";
  items: readonly ToolNavItem[];
};

function toNavItem(tool: ToolDefinition): ToolNavItem {
  const presentation = NAV_SECTIONS[tool.family];
  return {
    label: tool.shortName,
    icon: ICON_BY_SLUG[tool.slug] ?? presentation.icon,
    slug: tool.slug,
    status: tool.status,
    searchText: [tool.name, tool.shortName, tool.description, ...tool.keywords]
      .join(" ")
      .toLowerCase(),
  };
}

/**
 * Derived at module load from the immutable catalog. Keep this export for
 * simple consumers, but do not hand-maintain a parallel tool inventory here.
 */
export const TOOL_NAV: readonly ToolNavSection[] = FAMILY_ORDER.map((family) => {
  const presentation = NAV_SECTIONS[family];
  return {
    id: presentation.id,
    label: presentation.label,
    kind: "group" as const,
    items: listTools()
      .filter((tool) => tool.family === family)
      .map(toNavItem),
  };
}).filter((section) => section.items.length > 0);

/** Section id that owns a catalog slug (for default expansion). */
export function sectionIdForSlug(slug: string): string | undefined {
  return TOOL_NAV.find((section) => section.items.some((item) => item.slug === slug))?.id;
}

/** Flatten the catalog-backed navigation entries. */
export function listNavItems(): readonly ToolNavItem[] {
  return TOOL_NAV.flatMap((section) => section.items);
}

/** Resolve a navigation item from a stored favorite slug. */
export function findNavItemBySlug(slug: string): ToolNavItem | undefined {
  return listNavItems().find((item) => item.slug === slug);
}

/**
 * Favourites are shortcuts to interactive tools only. A stale localStorage
 * value or a coming-soon catalog entry cannot produce a dead pinned link.
 */
export function resolveFavoriteItems(slugs: readonly string[]): ToolNavItem[] {
  const items: ToolNavItem[] = [];
  for (const slug of slugs) {
    const item = findNavItemBySlug(slug);
    if (item?.status === "available") items.push(item);
  }
  return items;
}
