import { Logo } from "@/components/Logo";
import { navIcon } from "@/components/tools/navIcons";
import { Button } from "@/components/ui/button";
import { resolveFavoriteItems, sectionIdForSlug, TOOL_NAV, type ToolNavItem } from "@/data/toolNav";
import { Link } from "@/lib/router";
import { ChevronDown, ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ToolSidebarProps = {
  activeSlug: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  theme: "light" | "dark";
  favoriteSlugs: readonly string[];
  onToggleFavorite: (slug: string) => void;
  /** Tablet and mobile use an off-canvas drawer instead of the desktop rail. */
  isDrawer?: boolean;
  drawerOpen?: boolean;
  onCloseDrawer?: (restoreTriggerFocus?: boolean) => void;
};

/**
 * Catalog navigation that remains usable when the catalog grows. The catalog
 * owns rows; this component owns navigation state and drawer keyboard behavior.
 * Global discovery lives in the header, matching the workspace design frame.
 */
export function ToolSidebar({
  activeSlug,
  collapsed = false,
  onToggleCollapse,
  theme,
  favoriteSlugs,
  onToggleFavorite,
  isDrawer = false,
  drawerOpen = false,
  onCloseDrawer,
}: ToolSidebarProps) {
  const defaultOpen = sectionIdForSlug(activeSlug) ?? TOOL_NAV[0]?.id ?? "";
  const drawerRef = useRef<HTMLElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const section of TOOL_NAV) map[section.id] = section.id === defaultOpen;
    return map;
  });

  const favoriteItems = useMemo(() => resolveFavoriteItems(favoriteSlugs), [favoriteSlugs]);
  const sidebarClass = [
    "flex h-dvh w-60 shrink-0 flex-col overflow-hidden bg-bg-elevated shadow-[inset_-1px_0_0_var(--outline)]",
    isDrawer
      ? "max-xl:fixed max-xl:inset-y-0 max-xl:left-0 max-xl:z-50 max-xl:w-[min(320px,calc(100vw-48px))] max-xl:max-w-full max-xl:shadow-[8px_0_24px_rgb(0_0_0_/_35%)] max-xl:transition-transform max-xl:duration-[180ms] max-xl:ease-out motion-reduce:max-xl:transition-none " +
        (drawerOpen ? "max-xl:translate-x-0" : "max-xl:-translate-x-full")
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Expand the section of the active tool when navigating and keep that row
  // in the independently scrollable navigation viewport.
  useEffect(() => {
    const id = sectionIdForSlug(activeSlug);
    if (!id) return;
    setOpenSections((previous) => (previous[id] ? previous : { ...previous, [id]: true }));

    const frame = window.requestAnimationFrame(() => {
      navRef.current
        ?.querySelector<HTMLAnchorElement>('[aria-current="page"]')
        ?.scrollIntoView({ block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeSlug]);

  useEffect(() => {
    if (!isDrawer || !drawerOpen) return;

    const frame = window.requestAnimationFrame(() => {
      drawerCloseRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [drawerOpen, isDrawer]);

  const toggleSection = (id: string) => {
    setOpenSections((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const closeDrawerAfterNavigation = useCallback(() => {
    if (!isDrawer || !onCloseDrawer) return;
    // Preserve the link's native navigation. Restoring focus to an element
    // that is about to unmount would be noisy for keyboard users.
    window.requestAnimationFrame(() => onCloseDrawer(false));
  }, [isDrawer, onCloseDrawer]);

  const trapDrawerFocus = useCallback(
    (event: KeyboardEvent) => {
      if (!isDrawer || !drawerOpen || event.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;

      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (!first || !last) return;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !drawer.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [drawerOpen, isDrawer],
  );

  useEffect(() => {
    if (!isDrawer || !drawerOpen) return;
    window.addEventListener("keydown", trapDrawerFocus);
    return () => window.removeEventListener("keydown", trapDrawerFocus);
  }, [drawerOpen, isDrawer, trapDrawerFocus]);

  if (collapsed) {
    return (
      <aside
        id="tool-navigation"
        className="flex h-dvh w-16 shrink-0 flex-col overflow-hidden bg-bg-elevated shadow-[inset_-1px_0_0_var(--outline)]"
        data-testid="tool-sidebar-collapsed"
        aria-label="Tools navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-center bg-bg px-2 py-3">
          <Link
            to="/"
            className="block size-8 overflow-hidden rounded-lg"
            aria-label="Kitland home"
            title="Kitland home"
          >
            <Logo
              variant={theme === "dark" ? "reverse" : "primary"}
              className="block h-8 w-[102px] max-w-none"
            />
          </Link>
        </div>

        <nav
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-3"
          aria-label="Tool catalog"
        >
          {TOOL_NAV.map((section) => (
            <div
              key={section.id}
              className="flex flex-col gap-2 border-t border-outline pt-3 first:border-t-0 first:pt-0"
              aria-label={section.label}
            >
              {section.items.map((item) => (
                <CompactNavRow key={item.slug} item={item} activeSlug={activeSlug} />
              ))}
            </div>
          ))}
        </nav>

        <div className="flex shrink-0 justify-center p-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 border-0 bg-surface-low text-on-muted hover:text-on-surface"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      ref={drawerRef}
      id="tool-navigation"
      className={sidebarClass}
      data-testid="tool-sidebar"
      data-open={isDrawer ? String(drawerOpen) : undefined}
      aria-label="Tools navigation"
      aria-hidden={isDrawer && !drawerOpen ? true : undefined}
      aria-modal={isDrawer && drawerOpen ? true : undefined}
      role={isDrawer ? "dialog" : undefined}
      inert={isDrawer && !drawerOpen}
    >
      <div className="flex h-16 shrink-0 items-center gap-2 bg-bg-elevated px-4 py-3">
        <Link to="/" className="min-w-0 flex-1" aria-label="Kitland home">
          <Logo
            variant={theme === "dark" ? "reverse" : "primary"}
            className="h-10 w-auto max-w-[128px]"
          />
        </Link>
        {isDrawer ? (
          <Button
            ref={drawerCloseRef}
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-10 shrink-0 border-outline bg-surface-low text-on-muted hover:text-on-surface max-xl:inline-flex"
            onClick={() => onCloseDrawer?.(true)}
            aria-label="Close tools navigation"
            title="Close tools navigation"
          >
            <X size={18} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 border-0 bg-surface-low text-on-muted hover:text-on-surface"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <nav
          ref={navRef}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-4 pt-3 pb-4"
          aria-label="Tool catalog"
        >
          {favoriteItems.length > 0 ? (
            <section
              className="flex flex-col gap-1 border-b border-outline pb-3"
              aria-labelledby="pinned-tools"
            >
              <h2
                id="pinned-tools"
                className="m-0 px-2 text-[11px] leading-[1.2] font-semibold text-on-faint"
              >
                Pinned tools
              </h2>
              <div className="flex flex-col gap-0.5">
                {favoriteItems.map((item) => (
                  <NavRow
                    key={item.slug}
                    item={item}
                    activeSlug={activeSlug}
                    showStar
                    isFavorite
                    onToggleFavorite={onToggleFavorite}
                    onNavigate={closeDrawerAfterNavigation}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {TOOL_NAV.map((section) => {
            const open = openSections[section.id] ?? false;
            const contentId = `tool-nav-section-${section.id}`;

            return (
              <section
                key={section.id}
                className="flex flex-col gap-1"
                aria-labelledby={`${contentId}-label`}
              >
                <Button
                  id={`${contentId}-label`}
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="flex min-h-8 w-full items-center gap-2 rounded-md border-0 bg-transparent px-2 text-left text-[11px] font-semibold text-on-faint hover:text-on-muted"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={open}
                  aria-controls={contentId}
                >
                  {open ? (
                    <ChevronDown className="size-4" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="size-4" aria-hidden="true" />
                  )}
                  <span className="min-w-0 truncate">{section.label}</span>
                  <span
                    className="ml-auto min-w-[18px] rounded-full bg-surface-low px-[5px] py-0.5 text-center font-mono text-[10px] leading-none tabular-nums text-on-faint"
                    aria-label={`${section.items.length} tools`}
                  >
                    {section.items.length}
                  </span>
                </Button>
                <div id={contentId} className="flex flex-col gap-0.5" hidden={!open}>
                  {section.items.map((item) => (
                    <NavRow
                      key={item.slug}
                      item={item}
                      activeSlug={activeSlug}
                      showStar={item.status === "available"}
                      isFavorite={favoriteSlugs.includes(item.slug)}
                      onToggleFavorite={onToggleFavorite}
                      onNavigate={closeDrawerAfterNavigation}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 flex-col border-t border-outline px-4 pt-3 pb-4">
        <div className="flex w-full items-center gap-2 rounded-lg border border-outline bg-surface-low p-2">
          <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
          <div>
            <p className="m-0 text-xs leading-[1.25] font-semibold text-on-surface">
              Runs in your browser
            </p>
            <p className="mt-px mb-0 text-[11px] leading-[1.25] text-on-faint">
              Your text is processed locally
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function CompactNavRow({ item, activeSlug }: { item: ToolNavItem; activeSlug: string }) {
  const Icon = navIcon(item.icon);
  const active = item.slug === activeSlug;
  const className = [
    "flex size-10 shrink-0 items-center justify-center rounded-[9px] text-on-muted [&>svg]:size-[18px]",
    active ? "bg-primary-soft text-primary-strong" : "",
    item.status === "available"
      ? "cursor-pointer hover:bg-surface-low hover:text-on-surface"
      : "opacity-[0.48]",
  ]
    .filter(Boolean)
    .join(" ");

  if (item.status !== "available") {
    return (
      <span className={className} title={`${item.label} — coming soon`}>
        <Icon aria-hidden="true" />
        <span className="sr-only">{item.label}, coming soon</span>
      </span>
    );
  }

  return (
    <Link
      to={`/explore/${item.slug}`}
      className={className}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      title={item.label}
    >
      <Icon aria-hidden="true" />
    </Link>
  );
}

function NavRow({
  item,
  activeSlug,
  showStar = false,
  isFavorite = false,
  onToggleFavorite,
  onNavigate,
}: {
  item: ToolNavItem;
  activeSlug: string;
  showStar?: boolean;
  isFavorite?: boolean;
  onToggleFavorite: (slug: string) => void;
  onNavigate?: () => void;
}) {
  const Icon = navIcon(item.icon);
  const active = item.slug === activeSlug;
  const available = item.status === "available";

  const className = [
    "flex min-h-9 w-full items-center gap-1 rounded-md py-0 pr-1.5 pl-2 text-[13px] font-normal text-on-surface max-xl:min-h-10 max-xl:text-sm",
    available ? "hover:bg-surface-low" : "text-on-muted",
    active ? "bg-primary-soft" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const starButton =
    showStar && available ? (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={
          isFavorite
            ? "size-6 shrink-0 rounded-md border-0 bg-transparent p-0 text-primary hover:bg-primary/10"
            : "size-6 shrink-0 rounded-md border-0 bg-transparent p-0 text-on-faint hover:bg-primary/10 hover:text-primary"
        }
        aria-label={isFavorite ? `Unpin ${item.label}` : `Pin ${item.label}`}
        aria-pressed={isFavorite}
        title={isFavorite ? `Unpin ${item.label}` : `Pin ${item.label}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggleFavorite(item.slug);
        }}
      >
        <Star className="size-3" fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
      </Button>
    ) : null;

  if (available) {
    return (
      <div className={className}>
        <Link
          to={`/explore/${item.slug}`}
          className="flex h-full min-w-0 flex-1 items-center gap-2 text-inherit no-underline"
          aria-current={active ? "page" : undefined}
          onClick={onNavigate}
        >
          <Icon
            className={`size-4 shrink-0 ${active ? "text-primary-strong" : "text-on-muted"}`}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
        </Link>
        {starButton}
      </div>
    );
  }

  return (
    <div className={className} aria-label={`${item.label}, coming soon`}>
      <Icon className="size-4 shrink-0 text-on-muted" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
      <span className="shrink-0 rounded border border-outline px-[5px] py-[3px] text-[9px] leading-none font-bold tracking-[0.03em] text-on-faint uppercase">
        Soon
      </span>
    </div>
  );
}
