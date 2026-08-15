import type { CatalogTool, ToolFamilyId } from "@kitland/tools";
import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toolIconFor } from "../tool-meta";

const FAMILY_LABEL: Record<ToolFamilyId, string> = {
  "json-markup": "Format & Validate",
  "encoding-text": "Encode / Decode",
  "hash-crypto": "Crypto & Security",
  "text-regex": "Text tools",
  generators: "Generate",
  "time-network": "Time & Network",
};

export type ToolSearchDialogProps = {
  readonly open: boolean;
  readonly tools: readonly CatalogTool[];
  readonly favorites: readonly string[];
  readonly onClose: () => void;
  readonly onSelect: (slug: string) => void;
};

export function rankToolSuggestions(
  tools: readonly CatalogTool[],
  query: string,
  favorites: readonly string[],
): CatalogTool[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    const favoriteSet = new Set(favorites);
    const pinned = tools.filter((tool) => favoriteSet.has(tool.slug));
    const rest = tools.filter((tool) => !favoriteSet.has(tool.slug));
    return [...pinned, ...rest].slice(0, 8);
  }

  return tools
    .map((tool) => {
      const name = tool.shortName.toLowerCase();
      const full = tool.name.toLowerCase();
      const slug = tool.slug.toLowerCase();
      let score = 0;
      if (name === normalized || slug === normalized) score = 100;
      else if (name.startsWith(normalized) || slug.startsWith(normalized)) score = 80;
      else if (full.startsWith(normalized)) score = 70;
      else if (name.includes(normalized) || slug.includes(normalized)) score = 50;
      else if (full.includes(normalized)) score = 40;
      else if (tool.description.toLowerCase().includes(normalized)) score = 20;
      return { tool, score };
    })
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.tool.shortName.localeCompare(right.tool.shortName),
    )
    .map((entry) => entry.tool)
    .slice(0, 12);
}

function HighlightedText({ text, query }: { readonly text: string; readonly query: string }) {
  const needle = query.trim();
  if (!needle) return text;
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[3px] bg-primary/20 text-inherit">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export function ToolSearchDialog({
  open,
  tools,
  favorites,
  onClose,
  onSelect,
}: ToolSearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = useMemo(
    () => rankToolSuggestions(tools, query, favorites),
    [tools, query, favorites],
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(frame);
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const active = suggestions[activeIndex];
    if (!active) return;
    const node = listRef.current?.querySelector(`[data-slug="${active.slug}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, suggestions]);

  if (!open) return null;

  const active = suggestions[activeIndex];
  const heading = query.trim() ? "Results" : favorites.length > 0 ? "Favorites & tools" : "Tools";

  return (
    <div className="fixed inset-0 z-[80] flex justify-center px-4 pt-[min(14vh,7rem)]">
      <div
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        role="presentation"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        className="relative z-10 flex max-h-[min(32rem,72vh)] w-full max-w-[560px] flex-col overflow-hidden rounded-xl border border-outline bg-bg-elevated shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)]"
      >
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-outline px-4">
          <Search className="size-4 shrink-0 text-on-faint" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-label="Search registered tools"
            aria-expanded="true"
            aria-controls="kitland-tool-search-list"
            aria-autocomplete="list"
            aria-activedescendant={active ? `kitland-tool-search-${active.slug}` : undefined}
            placeholder="Search tools"
            value={query}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, Math.max(suggestions.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter" && active) {
                event.preventDefault();
                onSelect(active.slug);
              } else if (event.key === "Escape") {
                event.preventDefault();
                onClose();
              }
            }}
            className="h-full w-full min-w-0 border-0 bg-transparent text-[15px] text-on-surface outline-none placeholder:text-on-faint"
          />
        </div>

        <div
          ref={listRef}
          id="kitland-tool-search-list"
          role="listbox"
          className="min-h-0 flex-1 overflow-y-auto px-2 py-2"
        >
          {suggestions.length === 0 ? (
            <p className="m-0 px-3 py-10 text-center text-[13px] text-on-muted">
              No results for “{query.trim()}”
            </p>
          ) : (
            <>
              <p className="m-0 px-2 pb-1.5 pt-1 text-[11px] font-semibold tracking-wide text-on-faint uppercase">
                {heading}
              </p>
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {suggestions.map((tool, index) => {
                  const selected = index === activeIndex;
                  return (
                    <li key={tool.slug}>
                      <button
                        type="button"
                        id={`kitland-tool-search-${tool.slug}`}
                        data-slug={tool.slug}
                        role="option"
                        aria-label={tool.shortName}
                        aria-selected={selected}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => onSelect(tool.slug)}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border-0 px-2.5 py-2 text-left ${
                          selected
                            ? "bg-primary-soft text-on-surface"
                            : "bg-transparent text-on-muted"
                        }`}
                      >
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${
                            selected
                              ? "border-primary/25 bg-bg-elevated text-primary"
                              : "border-outline bg-surface-low text-on-faint"
                          }`}
                          dangerouslySetInnerHTML={{ __html: toolIconFor(tool.slug) }}
                        />
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-[13.5px] font-semibold text-on-surface">
                            <HighlightedText text={tool.shortName} query={query} />
                          </strong>
                          <span className="block truncate text-[11.5px] text-on-faint">
                            {FAMILY_LABEL[tool.family]}
                          </span>
                        </span>
                        {selected ? (
                          <CornerDownLeft
                            className="size-3.5 shrink-0 text-on-faint"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-outline px-4 py-2 text-[11px] text-on-faint">
          <Hint keys={["↑", "↓"]} label="to navigate" />
          <Hint keys={["↵"]} label="to select" />
          <Hint keys={["esc"]} label="to close" />
        </div>
      </div>
    </div>
  );
}

function Hint({ keys, label }: { readonly keys: readonly string[]; readonly label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-outline bg-surface-low px-1 font-mono text-[10px] text-on-muted"
        >
          {key}
        </kbd>
      ))}
      <span>{label}</span>
    </span>
  );
}
