import { navIcon } from "@/components/tools/navIcons";
import { Button } from "@/components/ui/button";
import { listNavItems, type ToolNavItem } from "@/data/toolNav";
import { Link } from "@/lib/router";
import { Menu, Moon, Search, Star, Sun, X } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";

type ToolTopBarProps = {
  title: string;
  crumb: string;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  favorited: boolean;
  onToggleFavorite: () => void;
  favoriteDisabled?: boolean;
  navigationOpen: boolean;
  onToggleNavigation: () => void;
  navigationTriggerRef: RefObject<HTMLButtonElement | null>;
};

const SEARCHABLE_TOOLS = listNavItems();
const themeSegmentClass =
  "flex h-7 w-[84px] items-center justify-center gap-1.5 rounded-md border border-outline bg-surface-low text-xs font-semibold text-on-muted max-xl:w-[72px] max-[720px]:w-8 max-[720px]:px-0";
const searchResultClass =
  "grid min-h-[38px] grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 px-2 text-[13px] text-on-surface [&>svg]:size-4 [&>svg]:text-on-muted [&>span:nth-child(2)]:truncate [&>span:last-child]:text-[10px] [&>span:last-child]:font-semibold [&>span:last-child]:text-on-faint";

function filterTools(query: string): readonly ToolNavItem[] {
  const normalized = query.trim().toLocaleLowerCase();
  return normalized.length === 0
    ? []
    : SEARCHABLE_TOOLS.filter((tool) => tool.searchText.includes(normalized));
}

/** design.pen · Base64 → Header (h=60), including the 300px global tool search. */
export function ToolTopBar({
  title,
  crumb,
  theme,
  onThemeChange,
  favorited,
  onToggleFavorite,
  favoriteDisabled = false,
  navigationOpen,
  onToggleNavigation,
  navigationTriggerRef,
}: ToolTopBarProps) {
  const navigationLabel = navigationOpen ? "Close tools navigation" : "Open tools navigation";
  const favoriteLabel = favorited ? "Remove from favorites" : "Add to favorites";

  return (
    <header
      className="relative z-20 flex h-[60px] shrink-0 items-center gap-3 border-b border-outline bg-surface px-6 max-xl:h-14 max-xl:px-5 max-[720px]:gap-2 max-[720px]:px-3"
      data-testid="tool-topbar"
    >
      <Button
        ref={navigationTriggerRef}
        type="button"
        variant="outline"
        size="icon"
        className="hidden size-10 shrink-0 border-outline bg-surface-low text-on-muted hover:text-on-surface max-xl:inline-flex"
        onClick={onToggleNavigation}
        aria-label={navigationLabel}
        aria-controls="tool-navigation"
        aria-expanded={navigationOpen}
        title={navigationLabel}
      >
        <Menu aria-hidden="true" />
      </Button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1
          className="m-0 truncate font-display text-[14.5px] leading-[1.2] font-semibold text-on-surface"
          data-testid="tool-title"
        >
          {title}
        </h1>
        <p className="m-0 truncate text-[11.5px] leading-[1.2] text-on-faint max-[720px]:hidden">
          {crumb}
        </p>
      </div>

      <ToolSearch />

      <div className="flex shrink-0 items-center gap-2 max-[720px]:gap-1.5">
        <fieldset className="m-0 flex min-w-0 items-center gap-0.5 rounded-[9px] border border-outline bg-surface-low p-[3px]">
          <legend className="sr-only">Theme</legend>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`${themeSegmentClass} ${
              theme === "dark" ? "border-outline-strong bg-primary-soft text-primary" : ""
            }`}
            aria-pressed={theme === "dark"}
            aria-label="Use dark theme"
            title="Use dark theme"
            onClick={() => onThemeChange("dark")}
          >
            <Moon className="size-3.5" aria-hidden="true" />
            <span className="max-[720px]:hidden">Dark</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`${themeSegmentClass} ${
              theme === "light" ? "border-outline-strong bg-primary-soft text-primary" : ""
            }`}
            aria-pressed={theme === "light"}
            aria-label="Use light theme"
            title="Use light theme"
            onClick={() => onThemeChange("light")}
          >
            <Sun className="size-3.5" aria-hidden="true" />
            <span className="max-[720px]:hidden">Light</span>
          </Button>
        </fieldset>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className={`size-[38px] shrink-0 border-outline bg-surface-low text-on-muted hover:text-on-surface max-[720px]:size-9 ${
            favorited ? "border-outline-strong bg-primary-soft text-primary" : ""
          }`}
          aria-label={favoriteLabel}
          aria-pressed={favorited}
          title={favoriteLabel}
          onClick={onToggleFavorite}
          disabled={favoriteDisabled}
        >
          <Star aria-hidden="true" fill={favorited ? "currentColor" : "none"} />
        </Button>
      </div>
    </header>
  );
}

/**
 * One catalog-backed search model is exposed in the workspace header. The
 * desktop field follows the design frame; mobile reveals the same control in
 * a header-attached panel instead of moving discovery into the drawer.
 */
function ToolSearch() {
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchRef = useRef<HTMLElement>(null);
  const mobileSearchRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopResultsId = useId();
  const mobileResultsId = useId();
  const mobilePanelId = useId();
  const results = useMemo(() => filterTools(query), [query]);
  const hasQuery = query.trim().length > 0;

  const clearSearch = () => setQuery("");
  const closeMobileSearch = () => {
    clearSearch();
    setMobileOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        if (window.matchMedia("(max-width: 720px)").matches) {
          setMobileOpen(true);
          window.requestAnimationFrame(() => mobileInputRef.current?.focus());
          return;
        }
        desktopInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const frame = window.requestAnimationFrame(() => mobileInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [mobileOpen]);

  useEffect(() => {
    if (!hasQuery && !mobileOpen) return;

    const dismissWhenOutside = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        desktopSearchRef.current?.contains(target) ||
        mobileSearchRef.current?.contains(target) ||
        mobileTriggerRef.current?.contains(target)
      ) {
        return;
      }
      clearSearch();
      setMobileOpen(false);
    };

    document.addEventListener("pointerdown", dismissWhenOutside);
    return () => {
      document.removeEventListener("pointerdown", dismissWhenOutside);
    };
  }, [hasQuery, mobileOpen]);

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    clearSearch();
    (event.currentTarget as HTMLInputElement).blur();
    setMobileOpen(false);
  };

  return (
    <>
      <search
        ref={desktopSearchRef}
        className="relative w-[300px] shrink-0 max-xl:w-60 max-[720px]:hidden"
        data-testid="tool-search-desktop"
      >
        <SearchField
          id="tool-search"
          inputRef={desktopInputRef}
          query={query}
          setQuery={setQuery}
          clearSearch={clearSearch}
          onKeyDown={onSearchKeyDown}
          results={results}
          hasQuery={hasQuery}
          resultsId={desktopResultsId}
          onNavigate={clearSearch}
          showShortcut
        />
      </search>

      <Button
        ref={mobileTriggerRef}
        type="button"
        variant="outline"
        size="icon"
        className="hidden size-[38px] shrink-0 border-outline bg-surface-low text-on-muted hover:text-on-surface max-[720px]:inline-flex"
        onClick={() => (mobileOpen ? closeMobileSearch() : setMobileOpen(true))}
        aria-label={mobileOpen ? "Close tool search" : "Search tools"}
        aria-controls={mobilePanelId}
        aria-expanded={mobileOpen}
        title={mobileOpen ? "Close tool search" : "Search tools"}
      >
        {mobileOpen ? <X aria-hidden="true" /> : <Search aria-hidden="true" />}
      </Button>

      {mobileOpen ? (
        <search
          ref={mobileSearchRef}
          id={mobilePanelId}
          className="absolute top-[calc(100%+8px)] right-3 left-3 z-[70] hidden rounded-[11px] border border-outline bg-bg-elevated p-2 shadow-[0_16px_36px_rgb(0_0_0_/_28%)] max-[720px]:block"
          data-testid="tool-search-mobile"
        >
          <SearchField
            id="tool-search-mobile"
            inputRef={mobileInputRef}
            query={query}
            setQuery={setQuery}
            clearSearch={clearSearch}
            onKeyDown={onSearchKeyDown}
            results={results}
            hasQuery={hasQuery}
            resultsId={mobileResultsId}
            onNavigate={closeMobileSearch}
            mobile
          />
        </search>
      ) : null}
    </>
  );
}

function SearchField({
  id,
  inputRef,
  query,
  setQuery,
  clearSearch,
  onKeyDown,
  results,
  hasQuery,
  resultsId,
  onNavigate,
  showShortcut = false,
  mobile = false,
}: {
  id: string;
  inputRef: RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  results: readonly ToolNavItem[];
  hasQuery: boolean;
  resultsId: string;
  onNavigate: () => void;
  showShortcut?: boolean;
  mobile?: boolean;
}) {
  return (
    <div className="relative flex h-10 w-full items-center gap-2 rounded-[10px] border border-outline bg-surface-low py-0 pr-2 pl-3 text-on-faint has-[input:focus-visible]:border-primary has-[input:focus-visible]:shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_16%,transparent)]">
      <label className="sr-only" htmlFor={id}>
        Search tools
      </label>
      <Search className="size-[15px] shrink-0" aria-hidden="true" />
      <input
        ref={inputRef}
        id={id}
        className="h-full min-w-0 flex-1 border-0 bg-transparent text-[13px] font-medium text-on-surface outline-none placeholder:text-on-faint focus-visible:shadow-none"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search tools…"
        autoComplete="off"
        spellCheck={false}
        aria-controls={hasQuery ? resultsId : undefined}
      />
      {hasQuery ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-6 shrink-0 p-0 text-on-muted"
          onClick={clearSearch}
          aria-label="Clear tool search"
          title="Clear tool search"
        >
          <X size={14} aria-hidden="true" />
        </Button>
      ) : showShortcut ? (
        <kbd
          className="inline-flex h-[22px] min-w-[34px] shrink-0 items-center justify-center rounded-[5px] border border-outline-strong bg-surface px-[5px] font-mono text-[10px] leading-none font-semibold text-on-faint"
          aria-hidden="true"
        >
          ⌘K
        </kbd>
      ) : null}

      {hasQuery ? (
        <div
          id={resultsId}
          className={`absolute top-[calc(100%+8px)] left-0 z-[60] w-[min(360px,calc(100vw-48px))] overflow-hidden rounded-[10px] border border-outline bg-bg-elevated shadow-[0_16px_36px_rgb(0_0_0_/_24%)] ${
            mobile ? "right-0 left-0 w-auto" : ""
          }`}
          data-testid="tool-search-results"
        >
          <output
            className="block min-h-[30px] border-b border-outline px-3 pt-[9px] pb-[7px] text-[11px] leading-[1.2] tabular-nums text-on-faint"
            aria-live="polite"
          >
            {results.length} {results.length === 1 ? "tool" : "tools"} found
          </output>
          {results.length > 0 ? (
            <nav
              className="flex max-h-[min(320px,calc(100dvh-156px))] flex-col overflow-y-auto p-[5px]"
              aria-label="Tool search results"
            >
              {results.map((tool) => {
                const Icon = navIcon(tool.icon);
                if (tool.status !== "available") {
                  return (
                    <div key={tool.slug} className={`${searchResultClass} text-on-muted`}>
                      <Icon aria-hidden="true" />
                      <span>{tool.label}</span>
                      <span>Soon</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={tool.slug}
                    to={`/explore/${tool.slug}`}
                    className={`${searchResultClass} rounded-[7px] hover:bg-surface-low`}
                    onClick={onNavigate}
                  >
                    <Icon aria-hidden="true" />
                    <span>{tool.label}</span>
                    <span>Open</span>
                  </Link>
                );
              })}
            </nav>
          ) : (
            <p className="m-0 p-3 text-xs leading-[1.4] text-on-faint">
              No tools match “{query.trim()}”.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
