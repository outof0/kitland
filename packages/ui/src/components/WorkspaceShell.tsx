import { listToolsByPlatform, type RegistryTool, type ToolFamilyId } from "@kitland/tools";
import {
  Moon,
  Search,
  Star,
  Sun,
  ChevronRight,
  Braces,
  Binary,
  Shield,
  Type,
  Dices,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { KitlandLogo } from "./KitlandLogo";
import { ToolSearchDialog } from "./ToolSearchDialog";
import { toolIconFor } from "../tool-meta";

export type WorkspaceShellProps = {
  readonly activeSlug: string;
  readonly onSelectTool: (slug: string) => void;
  readonly theme: "light" | "dark";
  readonly onToggleTheme: () => void;
  readonly favorites?: readonly string[];
  readonly onToggleFavorite?: (slug: string) => void;
  readonly securityBadge?: string;
  readonly children: ReactNode;
  readonly platform?: "web" | "browser-extension" | "vscode-extension";
  /**
   * Narrows which platform-available tools the shell lists. The web host uses
   * this to hide registry entries without a navigable route; every entry in the
   * list must be safe to pass to onSelectTool.
   */
  readonly filterTools?: (tools: readonly RegistryTool[]) => readonly RegistryTool[];
  readonly initialSidebarCollapsed?: boolean;
};

type CategoryDef = {
  readonly id: string;
  readonly label: string;
  readonly family: ToolFamilyId;
  readonly icon: React.ComponentType<{ className?: string }>;
};

const CATEGORIES: readonly CategoryDef[] = [
  {
    id: "format-validate",
    label: "Format & Validate",
    family: "json-markup",
    icon: Braces,
  },
  {
    id: "encode-decode",
    label: "Encode / Decode",
    family: "encoding-text",
    icon: Binary,
  },
  {
    id: "crypto-security",
    label: "Crypto & Security",
    family: "hash-crypto",
    icon: Shield,
  },
  {
    id: "text-tools",
    label: "Text tools",
    family: "text-regex",
    icon: Type,
  },
  {
    id: "generate",
    label: "Generate",
    family: "generators",
    icon: Dices,
  },
  {
    id: "time-network",
    label: "Time & Network",
    family: "time-network",
    icon: Globe,
  },
];

export function WorkspaceShell({
  activeSlug,
  onSelectTool,
  theme,
  onToggleTheme,
  favorites = [],
  onToggleFavorite,
  securityBadge = "LOCAL · NO PERMISSIONS",
  children,
  platform = "browser-extension",
  filterTools,
  initialSidebarCollapsed = false,
}: WorkspaceShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const navigationTriggerRef = useRef<HTMLButtonElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(!initialSidebarCollapsed);
  const isCompactMedia = useCompactNavigation();

  const allTools = useMemo(() => {
    const platformTools = listToolsByPlatform(platform);
    return filterTools ? filterTools(platformTools) : platformTools;
  }, [platform, filterTools]);

  const activeTool = useMemo(() => {
    return allTools.find((t) => t.slug === activeSlug);
  }, [allTools, activeSlug]);

  const activeCategory = useMemo(() => {
    if (!activeTool) return CATEGORIES[0];
    return CATEGORIES.find((c) => c.family === activeTool.family) ?? CATEGORIES[0];
  }, [activeTool]);

  const isFavorited = favorites.includes(activeSlug);

  // Categories expansion state
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const cat of CATEGORIES) {
      initial[cat.id] = cat.family === activeTool?.family || cat.id === "format-validate";
    }
    return initial;
  });

  // Keep category open when active tool changes
  useEffect(() => {
    if (activeCategory) {
      setOpenCategories((prev) => ({
        ...prev,
        [activeCategory.id]: true,
      }));
    }
  }, [activeCategory]);

  const toggleCategory = useCallback((id: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        if (isCompactMedia) {
          setDrawerOpen((open) => !open);
        } else {
          setDesktopSidebarOpen((open) => !open);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCompactMedia]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    searchTriggerRef.current?.focus();
  }, []);

  const closeDrawer = useCallback((restoreFocus = false) => {
    setDrawerOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => navigationTriggerRef.current?.focus());
    }
  }, []);

  const handleSelectTool = useCallback(
    (slug: string) => {
      onSelectTool(slug);
      if (isCompactMedia) setDrawerOpen(false);
    },
    [onSelectTool, isCompactMedia],
  );

  useEffect(() => {
    if (!isCompactMedia) setDrawerOpen(false);
  }, [isCompactMedia]);

  useEffect(() => {
    closeDrawer();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [activeSlug, closeDrawer]);

  useEffect(() => {
    if (!isCompactMedia || !drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer, isCompactMedia, drawerOpen]);

  useEffect(() => {
    if (!isCompactMedia || !drawerOpen) return;
    document.documentElement.classList.add("tool-navigation-open");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.classList.remove("tool-navigation-open");
      document.body.style.overflow = previousOverflow;
    };
  }, [isCompactMedia, drawerOpen]);

  const selectFromSearch = useCallback(
    (slug: string) => {
      handleSelectTool(slug);
      setSearchOpen(false);
    },
    [handleSelectTool],
  );

  const toolsByCategory = useMemo(() => {
    const map = new Map<ToolFamilyId, RegistryTool[]>();
    for (const tool of allTools) {
      const list = map.get(tool.family) ?? [];
      list.push(tool);
      map.set(tool.family, list);
    }
    return map;
  }, [allTools]);

  const favoriteTools = useMemo(() => {
    if (favorites.length === 0) return [];
    return allTools.filter((t) => favorites.includes(t.slug));
  }, [allTools, favorites]);

  const afterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adopt = () => {
      const host = afterRef.current;
      if (!host) return;
      const incoming = [
        ...document.querySelectorAll<HTMLElement>("[data-kitland-after-tool]"),
      ].find((node) => !host.contains(node));
      if (!incoming) return;
      host.replaceChildren();
      host.appendChild(incoming);
    };
    adopt();
    document.addEventListener("astro:page-load", adopt);
    return () => document.removeEventListener("astro:page-load", adopt);
  }, []);

  return (
    <div className="flex min-h-dvh w-full bg-bg text-on-surface">
      <a
        href="#tool-host"
        className="skip-link fixed top-2 left-2 z-50 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground -translate-y-40 focus:translate-y-0 transition-transform"
      >
        Skip to active tool
      </a>

      {/* Mobile drawer backdrop */}
      {isCompactMedia && drawerOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/45 border-0 p-0"
          onClick={() => closeDrawer(true)}
          aria-label="Close tools navigation"
          tabIndex={-1}
        />
      ) : null}

      <aside
        className={`z-20 flex h-dvh shrink-0 flex-col border-r border-outline bg-bg-elevated select-none transition-all duration-150 ${
          isCompactMedia
            ? `fixed inset-y-0 left-0 w-[280px] max-w-[84vw] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)] ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`
            : desktopSidebarOpen
              ? "sticky top-0 w-[240px] max-sm:w-[200px]"
              : "hidden"
        }`}
        aria-label="Developer tool registry"
        aria-hidden={
          isCompactMedia ? (!drawerOpen ? true : undefined) : !desktopSidebarOpen ? true : undefined
        }
        inert={
          isCompactMedia ? (!drawerOpen ? true : undefined) : !desktopSidebarOpen ? true : undefined
        }
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-3 gap-2">
          <button
            type="button"
            className="flex min-w-0 items-center border-0 bg-transparent p-0 text-on-surface cursor-pointer"
            onClick={() => handleSelectTool(allTools[0]?.slug ?? "beautify-minify")}
            aria-label="Kitland developer tools"
          >
            <KitlandLogo className="h-8 w-auto" />
            <h1 className="sr-only">Tools</h1>
          </button>
          {isCompactMedia ? (
            <button
              type="button"
              onClick={() => closeDrawer(true)}
              className="flex size-8 items-center justify-center rounded-md border border-outline bg-surface-low text-on-muted hover:bg-surface hover:text-on-surface cursor-pointer shrink-0"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <nav
          id="tool-registry-nav"
          className="registry-nav min-h-0 flex-1 overflow-y-auto px-2.5 pb-2"
          aria-label="Registered tools"
          tabIndex={-1}
        >
          {/* Favorites Section if present */}
          {favoriteTools.length > 0 && (
            <div className="category-group mb-2">
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-amber-400">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <span>Favorites</span>
                <span className="ml-auto font-mono text-[9px] text-on-faint">
                  {favoriteTools.length}
                </span>
              </div>
              <ul className="flex flex-col gap-0.5 m-0 p-1 list-none">
                {favoriteTools.map((tool) => (
                  <ToolSidebarItem
                    key={`fav-${tool.slug}`}
                    tool={tool}
                    isActive={tool.slug === activeSlug}
                    isFavorite
                    onSelect={() => handleSelectTool(tool.slug)}
                    {...(onToggleFavorite
                      ? { onToggleFavorite: () => onToggleFavorite(tool.slug) }
                      : {})}
                  />
                ))}
              </ul>
              <div className="h-px bg-outline my-2 mx-1" />
            </div>
          )}

          {/* Categories */}
          <div className="flex flex-col gap-1">
            {CATEGORIES.map((category) => {
              const tools = toolsByCategory.get(category.family) ?? [];
              if (tools.length === 0) return null;
              const isOpen = Boolean(openCategories[category.id]);
              const IconComponent = category.icon;

              return (
                <div key={category.id} className="category-group">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="category-header flex items-center justify-between w-full px-2 py-1.5 border-0 rounded-md bg-transparent text-on-muted hover:text-on-surface hover:bg-surface-low text-[11.5px] font-semibold cursor-pointer text-left transition-all duration-100"
                    aria-expanded={isOpen}
                    aria-controls={`category-${category.id}`}
                  >
                    <div className="category-header-left flex items-center gap-1.5 min-w-0">
                      <IconComponent className="size-3.5 text-on-faint shrink-0" />
                      <span className="category-title truncate">{category.label}</span>
                    </div>
                    <div className="category-header-right flex items-center gap-1.5 shrink-0">
                      <span className="category-count font-mono text-[9px] font-semibold text-on-faint bg-surface-low px-1.5 py-0.5 rounded-full">
                        {tools.length}
                      </span>
                      <ChevronRight
                        className={`chevron-icon size-3 text-on-faint transition-transform duration-150 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <ul
                      id={`category-${category.id}`}
                      className="category-items flex flex-col gap-0.5 mt-0.5 mb-1 pl-1.5 list-none"
                    >
                      {tools.map((tool) => (
                        <ToolSidebarItem
                          key={tool.slug}
                          tool={tool}
                          isActive={tool.slug === activeSlug}
                          isFavorite={favorites.includes(tool.slug)}
                          onSelect={() => handleSelectTool(tool.slug)}
                          {...(onToggleFavorite
                            ? {
                                onToggleFavorite: () => onToggleFavorite(tool.slug),
                              }
                            : {})}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-outline bg-surface px-3 select-none sm:px-6 lg:h-[60px] lg:gap-3"
          aria-hidden={isCompactMedia && drawerOpen ? true : undefined}
          inert={isCompactMedia && drawerOpen ? true : undefined}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {isCompactMedia && (
              <button
                ref={navigationTriggerRef}
                type="button"
                onClick={() => setDrawerOpen((open) => !open)}
                className="flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-outline bg-surface-low text-on-muted hover:bg-surface hover:text-on-surface hover:border-outline-strong cursor-pointer sm:size-10 lg:hidden"
                aria-label={drawerOpen ? "Close tools navigation" : "Open tools navigation"}
                aria-expanded={drawerOpen}
                aria-controls="tool-registry-nav"
                title={drawerOpen ? "Close navigation" : "Open navigation"}
              >
                <Menu className="size-4.5 sm:size-5" />
              </button>
            )}
            <div className="min-w-0">
              <p
                className="m-0 truncate text-sm font-semibold text-on-surface sm:text-[14.5px]"
                data-testid="tool-title"
              >
                {activeTool?.name ?? "Tools"}
              </p>
              <p
                id="active-tool-crumb"
                className="m-0 truncate text-[11px] text-on-faint sm:text-[11.5px]"
                aria-live="polite"
              >
                {activeCategory?.label ?? "Tools"} / {activeTool?.shortName ?? "Tools"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
            <button
              ref={searchTriggerRef}
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-outline bg-surface-low text-on-muted transition-all duration-120 hover:border-outline-strong hover:bg-surface-high hover:text-on-surface cursor-pointer sm:hidden"
              aria-label="Search tools"
              title="Search tools (⌘K)"
            >
              <Search className="size-4 text-on-faint" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="relative hidden h-10 w-48 shrink cursor-pointer items-center gap-2 rounded-[9px] border border-outline bg-surface-low px-3 text-left text-on-muted transition-all duration-120 hover:border-outline-strong hover:bg-bg-elevated sm:flex md:w-56 lg:w-72 lg:max-w-[300px]"
            >
              <Search className="size-[15px] shrink-0 text-on-faint" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[13px] text-on-faint">
                Search {allTools.length} tools…
              </span>
              <kbd className="pointer-events-none hidden h-[22px] min-w-[34px] items-center justify-center rounded-[5px] border border-outline-strong bg-surface px-1 font-mono text-[10px] font-semibold text-on-faint lg:inline-flex">
                ⌘K
              </kbd>
            </button>

            <div
              className="flex items-center gap-0.5 rounded-[9px] border border-outline bg-surface-low p-[2.5px]"
              role="group"
              aria-label="Theme"
            >
              <button
                type="button"
                onClick={() => {
                  if (theme !== "dark") onToggleTheme();
                }}
                className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-semibold cursor-pointer sm:px-2.5 ${
                  theme === "dark"
                    ? "border border-primary/25 bg-primary-soft text-primary-strong"
                    : "border border-transparent bg-transparent text-on-muted hover:text-on-surface"
                }`}
                aria-label="Dark"
                aria-pressed={theme === "dark"}
              >
                <Moon className="size-3.5" />
                <span className="hidden sm:inline">Dark</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (theme !== "light") onToggleTheme();
                }}
                className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-semibold cursor-pointer sm:px-2.5 ${
                  theme === "light"
                    ? "border border-primary/25 bg-primary-soft text-primary-strong"
                    : "border border-transparent bg-transparent text-on-muted hover:text-on-surface"
                }`}
                aria-label="Light"
                aria-pressed={theme === "light"}
              >
                <Sun className="size-3.5" />
                <span className="hidden sm:inline">Light</span>
              </button>
            </div>

            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(activeSlug)}
                className="flex size-9 items-center justify-center rounded-[9px] border border-outline bg-surface-low text-on-muted hover:border-outline-strong hover:bg-surface-high hover:text-on-surface transition-all duration-100 cursor-pointer sm:size-[38px]"
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                title={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorited ? (
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                ) : (
                  <Star className="size-4" />
                )}
              </button>
            )}

            {securityBadge && (
              <span
                className="hidden select-none items-center gap-1.5 rounded-md border border-outline bg-surface-low px-2 py-1 font-mono text-[9.5px] font-bold tracking-wider text-success md:inline-flex"
                title="No extension or website permissions requested"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full bg-success ring-2 ring-success-soft"
                  aria-hidden="true"
                />
                {securityBadge}
              </span>
            )}
          </div>
        </header>

        <main id="tool-host" tabIndex={-1} className="tool-host flex min-w-0 flex-1 flex-col bg-bg">
          <div className="flex min-h-[calc(100dvh-56px)] min-w-0 flex-1 flex-col gap-3.5 p-3 sm:min-h-[calc(100dvh-60px)] sm:gap-4 sm:px-6 sm:py-5">
            {children}
          </div>
          <div ref={afterRef} className="min-w-0 px-3 sm:px-6" />
        </main>
      </div>

      <ToolSearchDialog
        open={searchOpen}
        tools={allTools}
        favorites={favorites}
        onClose={closeSearch}
        onSelect={selectFromSearch}
      />
    </div>
  );
}

function ToolSidebarItem({
  tool,
  isActive,
  isFavorite = false,
  onSelect,
  onToggleFavorite,
}: {
  readonly tool: RegistryTool;
  readonly isActive: boolean;
  readonly isFavorite?: boolean;
  readonly onSelect: () => void;
  readonly onToggleFavorite?: () => void;
}) {
  const iconSvg = toolIconFor(tool.slug);
  const favoriteLabel = isFavorite
    ? `Remove ${tool.shortName} from favorites`
    : `Add ${tool.shortName} to favorites`;

  return (
    <li className="tool-item group/item">
      <div
        className={`flex w-full min-h-[34px] items-center gap-0.5 rounded-md border pr-0.5 ${
          isActive
            ? "border-primary/25 bg-primary-soft text-primary-strong"
            : "border-transparent text-on-muted hover:bg-surface-low hover:text-on-surface"
        }`}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-current={isActive ? "page" : undefined}
          className="flex min-h-[34px] min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent px-2 py-1 text-left text-inherit"
        >
          <span
            className={`tool-icon-wrapper size-4 flex items-center justify-center shrink-0 ${
              isActive ? "text-primary" : "text-on-faint"
            }`}
            dangerouslySetInnerHTML={{ __html: iconSvg }}
          />
          <strong className="truncate text-[11.5px] font-medium flex-1">{tool.shortName}</strong>
        </button>
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent ${
              isFavorite
                ? "text-amber-400 hover:bg-surface-high"
                : "text-on-faint opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 hover:bg-surface-high hover:text-amber-400"
            }`}
            aria-label={favoriteLabel}
            aria-pressed={isFavorite}
            title={favoriteLabel}
          >
            <Star className={`size-3.5 ${isFavorite ? "fill-amber-400" : ""}`} />
          </button>
        ) : isActive ? (
          <span
            className="tool-list-indicator mr-1.5 size-1.5 rounded-full bg-success ring-2 ring-success-soft shrink-0"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </li>
  );
}

function useCompactNavigation(): boolean {
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isCompact;
}
