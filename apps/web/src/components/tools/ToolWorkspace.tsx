import { WorkspaceShell } from "@kitland/ui";
import { type RegistryTool } from "@kitland/tools";
import { listWebAvailableTools, getWebToolBySlug } from "@/lib/release-scope";
import { STORAGE_KEYS } from "@/lib/storage";
import { TOOL_MODE_NAVIGATION_EVENT } from "@/lib/tool-mode-navigation";
import { getToolRenderer } from "@/tools/registry.tsx";
import { useFavorites } from "@/hooks/useFavorites";
import { usePersistentState } from "@/hooks/usePersistentState";
import { CodeEditorProvider } from "@/components/tools/CodeEditorProvider";
import { navigate } from "astro:transitions/client";
import { Component, Suspense, useEffect, useCallback, useState, type ReactNode } from "react";

type ToolWorkspaceProps = {
  slug: string;
};

function slugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/explore\/([^/]+)\/?$/);
  return match?.[1] ?? null;
}

/**
 * Web host wrap of the shared @kitland/ui WorkspaceShell. Each tool still has
 * a static /explore/:slug document for SEO, but in-app switches go through
 * Astro's ClientRouter and keep this island mounted so the shell does not
 * flash. Theme and favorites use the same versioned storage keys as the
 * browser extension.
 */
export function ToolWorkspace({ slug: initialSlug }: ToolWorkspaceProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [rendererSlug, setRendererSlug] = useState(initialSlug);
  const tool = getWebToolBySlug(slug);
  const [theme, setTheme] = usePersistentState(STORAGE_KEYS.theme, "dark");
  const { favorites, toggleFavorite } = useFavorites();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const syncSlug = () => {
      const next = slugFromPath(window.location.pathname);
      if (next) {
        setSlug(next);
        setRendererSlug(next);
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    };
    const syncModeNavigation = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      const nextTool = getWebToolBySlug(next);
      if (!nextTool) return;

      setSlug(next);
      window.history.replaceState(null, "", `/explore/${next}`);
      document.title = `${nextTool.name} — Tools out. Work on. | Kitland`;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    document.addEventListener("astro:page-load", syncSlug);
    window.addEventListener("popstate", syncSlug);
    window.addEventListener(TOOL_MODE_NAVIGATION_EVENT, syncModeNavigation);
    return () => {
      document.removeEventListener("astro:page-load", syncSlug);
      window.removeEventListener("popstate", syncSlug);
      window.removeEventListener(TOOL_MODE_NAVIGATION_EVENT, syncModeNavigation);
    };
  }, []);

  const onSelectTool = useCallback(
    (nextSlug: string) => {
      if (nextSlug === slug) return;
      setSlug(nextSlug);
      setRendererSlug(nextSlug);
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      void navigate(`/explore/${nextSlug}`);
    },
    [slug],
  );

  const onToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, [setTheme]);

  const filterTools = useCallback(
    (tools: readonly RegistryTool[]) =>
      tools.filter((candidate) => listWebAvailableTools().some((t) => t.slug === candidate.slug)),
    [],
  );

  return (
    <WorkspaceShell
      activeSlug={slug}
      onSelectTool={onSelectTool}
      theme={theme}
      onToggleTheme={onToggleTheme}
      favorites={favorites}
      onToggleFavorite={toggleFavorite}
      platform="web"
      securityBadge=""
      filterTools={filterTools}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {!tool ? (
          <NotFound slug={slug} />
        ) : tool.status !== "available" ? (
          <ComingSoon name={tool.name} />
        ) : (
          <ToolLoadBoundary key={rendererSlug} name={tool.name}>
            <Suspense
              fallback={
                <div aria-live="polite" aria-busy="true">
                  <h2 className="m-0 font-display text-xl font-semibold text-on-surface">
                    {tool.name}
                  </h2>
                  <p className="mt-1 mb-0 flex items-center gap-2.5 text-sm leading-[1.45] text-on-muted">
                    <span className="loading-pulse" aria-hidden="true" />
                    Loading {tool.shortName}…
                  </p>
                </div>
              }
            >
              <CodeEditorProvider>
                <ToolBySlug slug={rendererSlug} />
              </CodeEditorProvider>
            </Suspense>
          </ToolLoadBoundary>
        )}
      </div>
    </WorkspaceShell>
  );
}

function ToolBySlug({ slug }: { slug: string }) {
  const ToolRenderer = getToolRenderer(slug);
  if (!ToolRenderer) return <NotFound slug={slug} />;

  return (
    <div className="contents" data-tool-renderer={slug}>
      <ToolRenderer />
    </div>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div>
      <h2 className="m-0 font-display text-xl font-semibold text-on-surface">Tool not found</h2>
      <p className="mt-1 mb-0 text-sm leading-[1.45] text-on-muted">
        No tool registered for <code>/explore/{slug}</code>.
      </p>
    </div>
  );
}

function ComingSoon({ name }: { name: string }) {
  return (
    <div>
      <h2 className="m-0 font-display text-xl font-semibold text-on-surface">{name}</h2>
      <p className="mt-1 mb-0 text-sm leading-[1.45] text-on-muted">
        This tool is listed in the registry but not available yet.
      </p>
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

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("TOOL_LOAD_ERROR:", error, errorInfo);
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
        <button
          type="button"
          className="h-9 rounded-lg border border-outline bg-surface px-3 text-xs font-semibold text-on-surface hover:bg-surface-low transition-colors cursor-pointer"
          onClick={() => window.location.reload()}
        >
          Reload tool
        </button>
      </div>
    );
  }
}
