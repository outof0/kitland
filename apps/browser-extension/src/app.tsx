import "./styles.css";
import { createRoot } from "react-dom/client";
import { Component, Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import { WorkspaceShell } from "@kitland/ui";
import { CodeEditorProvider } from "./components/CodeEditorProvider";
import { getToolBySlug } from "@kitland/tools";
import { getToolRegistration, getToolRenderer } from "./registry";

const THEME_KEY = "kitland.theme";
const FAVORITES_KEY = "kitland.favorites";

function loadTheme(): "dark" | "light" {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function loadFavorites(): string[] {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function parseSlugFromHash(): string {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const tool = params.get("tool");
  return tool && getToolRegistration(tool) ? tool : "beautify-minify";
}

function App() {
  const [theme, setTheme] = useState<"dark" | "light">(loadTheme);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [activeSlug, setActiveSlug] = useState<string>(parseSlugFromHash);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage may be unavailable
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const selectTool = useCallback((slug: string) => {
    setActiveSlug(slug);
    window.location.hash = `tool=${encodeURIComponent(slug)}`;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveSlug(parseSlugFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const tool = getToolBySlug(activeSlug);

  return (
    <CodeEditorProvider>
      <WorkspaceShell
        activeSlug={activeSlug}
        onSelectTool={selectTool}
        theme={theme}
        onToggleTheme={toggleTheme}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        platform="browser-extension"
        securityBadge=""
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!tool ? (
            <NotFound slug={activeSlug} />
          ) : (
            <ToolLoadBoundary key={activeSlug} name={tool.name}>
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
                <ToolBySlug slug={activeSlug} />
              </Suspense>
            </ToolLoadBoundary>
          )}
        </div>
      </WorkspaceShell>
    </CodeEditorProvider>
  );
}

function ToolBySlug({ slug }: { readonly slug: string }) {
  const ToolRenderer = getToolRenderer(slug);
  if (!ToolRenderer) return <NotFound slug={slug} />;
  return <ToolRenderer />;
}

function NotFound({ slug }: { readonly slug: string }) {
  return (
    <div>
      <h2 className="m-0 font-display text-xl font-semibold text-on-surface">Tool not found</h2>
      <p className="mt-1 mb-0 text-sm leading-[1.45] text-on-muted">
        No tool registered for <code>{slug}</code>.
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
          The tool code could not be loaded. Close this tab and open the workbench again.
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

export function mountApp(): void {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  }
}
