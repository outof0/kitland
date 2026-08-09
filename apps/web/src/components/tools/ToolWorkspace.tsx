import { ToolSidebar } from "@/components/tools/ToolSidebar";
import { ToolTopBar } from "@/components/tools/ToolTopBar";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { usePersistentState } from "@/hooks/usePersistentState";
import { Link } from "@/lib/router";
import { STORAGE_KEYS } from "@/lib/storage";
import { getToolRenderer } from "@/tools/registry";
import { getToolBySlug } from "@kitland/tool-catalog";
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "@/styles/tool-workspace.css";

// Keep the hydration snapshot deterministic, then update the responsive
// workspace before the browser paints on the client.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type ToolWorkspaceProps = {
  slug: string;
};

/**
 * design.pen · App Root: Sidebar (240) + Main (fill).
 * Theme and favorites persist; navigation geometry remains session-local so a
 * stored preference can never visibly resize the workspace after hydration.
 */
export function ToolWorkspace({ slug }: ToolWorkspaceProps) {
  const tool = getToolBySlug(slug);
  const compactNavigation = useMediaQuery("(max-width: 1279px)");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigationTriggerRef = useRef<HTMLButtonElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // The shared workspace defaults to dark and remembers the user's choice.
  const [theme, setTheme] = usePersistentState(STORAGE_KEYS.theme, "dark");
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const prev = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = theme;
    return () => {
      if (prev === undefined) {
        delete document.documentElement.dataset.theme;
      } else {
        document.documentElement.dataset.theme = prev;
      }
    };
  }, [theme]);

  const closeDrawer = useCallback((restoreTriggerFocus = false) => {
    setDrawerOpen(false);
    if (restoreTriggerFocus) {
      window.requestAnimationFrame(() => navigationTriggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!compactNavigation) {
      setDrawerOpen(false);
    }
  }, [compactNavigation]);

  // Route changes should never leave a tablet/mobile navigation drawer open.
  useEffect(() => {
    setDrawerOpen(false);
  }, [slug]);

  useEffect(() => {
    if (!compactNavigation || !drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeDrawer, compactNavigation, drawerOpen]);

  // `inert` blocks interaction; this class also stops a touch gesture on the
  // backdrop from scrolling the document behind the modal drawer.
  useEffect(() => {
    if (!compactNavigation || !drawerOpen) return;
    document.documentElement.classList.add("tool-navigation-open");
    return () => document.documentElement.classList.remove("tool-navigation-open");
  }, [compactNavigation, drawerOpen]);

  const title = tool?.shortName ?? "Tools";
  const crumb = tool ? `${familyCrumb(tool.family)} / ${tool.shortName}` : "Tools";
  const backgroundInert = compactNavigation && drawerOpen;

  return (
    <div className="tool-app flex h-dvh overflow-hidden bg-bg font-ui text-on-surface max-[720px]:h-auto max-[720px]:min-h-dvh max-[720px]:overflow-visible">
      <a
        href="#tool-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-white"
        onClick={() => {
          window.requestAnimationFrame(() => {
            document.getElementById("tool-main")?.focus();
          });
        }}
        aria-hidden={backgroundInert ? true : undefined}
        inert={backgroundInert}
      >
        Skip to tool
      </a>

      <ToolSidebar
        activeSlug={slug}
        collapsed={compactNavigation ? false : sidebarCollapsed}
        onToggleCollapse={
          compactNavigation ? () => closeDrawer(true) : () => setSidebarCollapsed(!sidebarCollapsed)
        }
        theme={theme}
        favoriteSlugs={favorites}
        onToggleFavorite={toggleFavorite}
        isDrawer={compactNavigation}
        drawerOpen={drawerOpen}
        onCloseDrawer={closeDrawer}
      />

      {compactNavigation && drawerOpen ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="fixed inset-0 z-40 size-full rounded-none border-0 bg-black/45 p-0"
          onClick={() => closeDrawer(true)}
          aria-label="Close tools navigation"
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}

      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-bg max-[720px]:min-h-dvh max-[720px]:overflow-visible"
        aria-hidden={backgroundInert ? true : undefined}
        inert={backgroundInert}
      >
        <ToolTopBar
          title={title}
          crumb={crumb}
          theme={theme}
          onThemeChange={setTheme}
          favorited={tool ? isFavorite(tool.slug) : false}
          onToggleFavorite={() => {
            if (tool) toggleFavorite(tool.slug);
          }}
          favoriteDisabled={!tool}
          navigationOpen={compactNavigation && drawerOpen}
          onToggleNavigation={() => setDrawerOpen((open) => !open)}
          navigationTriggerRef={navigationTriggerRef}
        />

        <main
          id="tool-main"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain px-6 py-5 max-xl:p-5 max-[720px]:min-h-[calc(100dvh-56px)] max-[720px]:flex-none max-[720px]:gap-3 max-[720px]:overflow-visible max-[720px]:px-3 max-[720px]:pt-4 max-[720px]:pb-[calc(24px+env(safe-area-inset-bottom))]"
          tabIndex={-1}
        >
          {!tool ? (
            <NotFound slug={slug} />
          ) : tool.status !== "available" ? (
            <ComingSoon name={tool.name} />
          ) : (
            <ToolLoadBoundary key={slug} name={tool.name}>
              <Suspense fallback={<ToolLoading name={tool.name} />}>
                <ToolBySlug slug={slug} />
              </Suspense>
            </ToolLoadBoundary>
          )}
        </main>
      </div>
    </div>
  );
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function ToolBySlug({ slug }: { slug: string }) {
  const ToolRenderer = getToolRenderer(slug);
  if (!ToolRenderer) return <NotFound slug={slug} />;

  return <ToolRenderer />;
}

function familyCrumb(family: string): string {
  switch (family) {
    case "encoding-text":
      return "Encode";
    case "json-markup":
      return "Format";
    case "generators":
      return "Generate";
    case "hash-crypto":
      return "Crypto";
    case "text-regex":
      return "Text";
    case "time-network":
      return "Time";
    default:
      return "Tools";
  }
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div>
      <h2 className="m-0 font-display text-xl font-semibold text-on-surface">Tool not found</h2>
      <p className="mt-1 mb-0 text-sm leading-[1.45] text-on-muted">
        No tool registered for <code>/explore/{slug}</code>.
      </p>
      <Link to="/explore" className="text-primary underline underline-offset-3">
        Back to the catalog →
      </Link>
    </div>
  );
}

function ComingSoon({ name }: { name: string }) {
  return (
    <div>
      <h2 className="m-0 font-display text-xl font-semibold text-on-surface">{name}</h2>
      <p className="mt-1 mb-0 text-sm leading-[1.45] text-on-muted">
        This tool is listed in the catalog but not available yet.
      </p>
    </div>
  );
}

function ToolLoading({ name }: { name: string }) {
  return (
    <div aria-live="polite" aria-busy="true">
      <h2 className="m-0 font-display text-xl font-semibold text-on-surface">{name}</h2>
      <p className="mt-1 mb-0 text-sm leading-[1.45] text-on-muted">Loading tool…</p>
    </div>
  );
}

type ToolLoadBoundaryProps = {
  readonly children: ReactNode;
  readonly name: string;
};

class ToolLoadBoundary extends Component<ToolLoadBoundaryProps, { readonly failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div aria-live="assertive">
        <h2 className="m-0 font-display text-xl font-semibold text-on-surface">
          Could not load {this.props.name}
        </h2>
        <p className="mt-1 mb-3 text-sm leading-[1.45] text-on-muted">
          The tool code could not be loaded. Check your connection, then try again.
        </p>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Reload tool
        </Button>
      </div>
    );
  }
}
