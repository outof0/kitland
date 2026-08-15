import { LOCAL_ONLY_CAPABILITIES, WorkspaceShell } from "@kitland/ui";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import type { CatalogToolEntry } from "../protocol";
import { parseHostMessage } from "../protocol";
import { resolveToolRegistration, type ToolComponentProps } from "./toolRegistry";
import { CodeEditorProvider } from "./CodeEditorProvider";

type VsCodeApi = { postMessage(message: Record<string, unknown>): void };
declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

/** Detect VS Code theme kind from the body class or data attribute. */
function detectVscodeTheme(): "dark" | "light" {
  const body = document.body;
  if (body.classList.contains("vscode-light")) return "light";
  if (body.classList.contains("vscode-dark") || body.classList.contains("vscode-high-contrast"))
    return "dark";
  const bg = getComputedStyle(document.documentElement)
    .getPropertyValue("--vscode-editor-background")
    .trim();
  if (bg && bg.startsWith("#")) {
    const hex = bg.replace("#", "");
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? "light" : "dark";
    }
  }
  return "dark";
}

export function App() {
  const [tools, setTools] = useState<CatalogToolEntry[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(detectVscodeTheme);
  const [ToolComponent, setToolComponent] = useState<ComponentType<ToolComponentProps> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [initialInput, setInitialInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeToolIdRef = useRef("");
  const activeSlugRef = useRef("");
  const loadGenerationRef = useRef(0);
  const toolComponentRef = useRef<ComponentType<ToolComponentProps> | null>(null);

  const loadTool = useCallback(async (entry: CatalogToolEntry) => {
    const generation = ++loadGenerationRef.current;
    setLoading(true);
    const registration = resolveToolRegistration(entry);
    if (!registration) {
      if (generation === loadGenerationRef.current) {
        setToolComponent(null);
        setLoading(false);
      }
      return;
    }
    try {
      const module = await registration.load();
      if (generation === loadGenerationRef.current) {
        toolComponentRef.current = module.default;
        setToolComponent(() => module.default);
        setLoading(false);
      }
    } catch {
      if (generation === loadGenerationRef.current) {
        setToolComponent(null);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent<unknown>) => {
      const message = parseHostMessage(event.data);
      if (!message) return;

      if (message.type === "toolsList") {
        const catalog = message.tools as CatalogToolEntry[];
        setTools(catalog);
        if (message.collapseSidebar !== undefined) {
          setSidebarCollapsed(message.collapseSidebar);
        }
        const entry = catalog.find((t) => t.id === message.activeToolId);
        if (entry) {
          const isSameTool =
            activeToolIdRef.current === message.activeToolId &&
            activeSlugRef.current === entry.slug;
          activeToolIdRef.current = message.activeToolId;
          activeSlugRef.current = entry.slug;
          setActiveSlug(entry.slug);
          if (message.initialInput !== undefined) {
            setInitialInput(message.initialInput);
          }
          if (!isSameTool || !toolComponentRef.current) {
            void loadTool(entry);
          }
        }
        return;
      }

      if (message.type === "themeChanged") {
        setTheme(message.kind);
      }
    };

    window.addEventListener("message", handler);
    vscode.postMessage({ type: "listTools" });
    return () => window.removeEventListener("message", handler);
  }, [loadTool]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleSelectTool = useCallback(
    (slug: string) => {
      const entry = tools.find((t) => t.slug === slug);
      if (!entry) return;
      if (
        activeToolIdRef.current === entry.id &&
        activeSlugRef.current === slug &&
        toolComponentRef.current
      ) {
        return;
      }
      setActiveSlug(slug);
      activeSlugRef.current = slug;
      setInitialInput("");
      activeToolIdRef.current = entry.id;
      vscode.postMessage({ type: "selectTool", toolId: entry.id });
      void loadTool(entry);
    },
    [tools, loadTool],
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <CodeEditorProvider>
      <WorkspaceShell
        activeSlug={activeSlug}
        onSelectTool={handleSelectTool}
        theme={theme}
        onToggleTheme={toggleTheme}
        platform="vscode-extension"
        securityBadge=""
        initialSidebarCollapsed={sidebarCollapsed}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {loading && (
            <div
              className="flex min-h-[220px] items-center justify-center gap-2.5 text-xs text-on-muted"
              role="status"
            >
              <span className="loading-pulse" aria-hidden="true" />
              Loading tool…
            </div>
          )}
          {!loading && ToolComponent && activeSlug && (
            <ToolComponent
              key={activeSlug}
              slug={activeSlug}
              toolId={activeToolIdRef.current}
              initialInput={initialInput}
              capabilities={LOCAL_ONLY_CAPABILITIES}
            />
          )}
          {!loading && !ToolComponent && activeSlug && (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-on-muted">
              Tool &ldquo;{activeSlug}&rdquo; is not available in this environment.
            </div>
          )}
        </div>
      </WorkspaceShell>
    </CodeEditorProvider>
  );
}
