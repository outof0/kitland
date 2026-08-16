import {
  findHttpStatuses,
  generateClientFetchSnippet,
  generateHttpWireResponse,
  generateServerExpressSnippet,
  getHttpStatus,
  HTTP_STATUS_CODES,
  type HttpStatus,
  type HttpStatusCategory,
} from "@kitland/core";
import {
  Check,
  Code2,
  Copy,
  Globe2,
  Layers,
  Search,
  Server,
  Terminal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FieldLabel, SampleAction, StatusBar, ToolHeader } from "../components/tool-form";
import { useCopyFeedback } from "../hooks/useCopyFeedback";

type SnippetTab = "wire" | "fetch" | "express";

const CATEGORIES: readonly { id: HttpStatusCategory | "All"; label: string; short: string }[] = [
  { id: "All", label: "All", short: "All" },
  { id: "Informational", label: "1xx Informational", short: "1xx Info" },
  { id: "Success", label: "2xx Success", short: "2xx Success" },
  { id: "Redirection", label: "3xx Redirection", short: "3xx Redirect" },
  { id: "Client Error", label: "4xx Client Error", short: "4xx Client" },
  { id: "Server Error", label: "5xx Server Error", short: "5xx Server" },
];

const COMMON_CODES = [200, 201, 204, 301, 304, 400, 401, 403, 404, 422, 429, 500, 502, 503];

function getCategoryColor(category: HttpStatusCategory) {
  switch (category) {
    case "Informational":
      return {
        badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
        text: "text-blue-600 dark:text-blue-400",
        ring: "ring-blue-500/30 border-blue-500/50",
        card: "border-blue-500/25 bg-blue-500/5",
        dot: "bg-blue-500",
        activeItem: "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400",
      };
    case "Success":
      return {
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
        text: "text-emerald-600 dark:text-emerald-400",
        ring: "ring-emerald-500/30 border-emerald-500/50",
        card: "border-emerald-500/25 bg-emerald-500/5",
        dot: "bg-emerald-500",
        activeItem: "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
      };
    case "Redirection":
      return {
        badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
        text: "text-amber-600 dark:text-amber-400",
        ring: "ring-amber-500/30 border-amber-500/50",
        card: "border-amber-500/25 bg-amber-500/5",
        dot: "bg-amber-500",
        activeItem: "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400",
      };
    case "Client Error":
      return {
        badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
        text: "text-rose-600 dark:text-rose-400",
        ring: "ring-rose-500/30 border-rose-500/50",
        card: "border-rose-500/25 bg-rose-500/5",
        dot: "bg-rose-500",
        activeItem: "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400",
      };
    case "Server Error":
      return {
        badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25",
        text: "text-red-600 dark:text-red-400",
        ring: "ring-red-500/30 border-red-500/50",
        card: "border-red-500/25 bg-red-500/5",
        dot: "bg-red-500",
        activeItem: "bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400",
      };
  }
}

export function HttpStatusCodesTool() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<HttpStatusCategory | "All">("All");
  const [selectedCode, setSelectedCode] = useState<number>(404);
  const [activeSnippetTab, setActiveSnippetTab] = useState<SnippetTab>("wire");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isCopied, copy } = useCopyFeedback();

  const selectedStatus = useMemo(
    () => getHttpStatus(selectedCode) ?? HTTP_STATUS_CODES[0]!,
    [selectedCode],
  );

  const filteredStatuses = useMemo(() => {
    let list = HTTP_STATUS_CODES;
    if (selectedCategory !== "All") {
      list = list.filter((s) => s.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => {
        const haystack = [
          String(s.code),
          s.name,
          s.category,
          s.spec,
          s.description,
          s.detail,
          ...(s.commonHeaders ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return list;
  }, [searchQuery, selectedCategory]);

  const selectCode = useCallback((code: number) => {
    setSelectedCode(code);
  }, []);

  const handleSample = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedCode(404);
    setActiveSnippetTab("wire");
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const related = useMemo(() => {
    const series = Math.floor(selectedStatus.code / 100);
    return HTTP_STATUS_CODES.filter(
      (s) => s.code !== selectedStatus.code && Math.floor(s.code / 100) === series,
    ).slice(0, 6);
  }, [selectedStatus]);

  const colorStyles = getCategoryColor(selectedStatus.category);

  const activeSnippet = useMemo(() => {
    switch (activeSnippetTab) {
      case "wire":
        return generateHttpWireResponse(selectedStatus);
      case "fetch":
        return generateClientFetchSnippet(selectedStatus);
      case "express":
        return generateServerExpressSnippet(selectedStatus);
    }
  }, [activeSnippetTab, selectedStatus]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Globe2}
        title="HTTP Status Codes"
        subtitle="Explore and inspect official RFC & IANA HTTP response status codes with specifications."
        actions={<SampleAction onClick={handleSample} label="Sample (404)" />}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)] lg:h-[calc(100dvh-175px)] lg:max-h-[920px]">
        {/* Left Column: Search, Categories, and Code List */}
        <section className="flex h-full min-h-0 flex-col rounded-[14px] border border-outline bg-bg-elevated p-3.5 max-lg:min-h-[460px]">
          {/* Search box */}
          <div className="relative mb-3 flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-on-faint" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code (404), name, RFC, header…"
              aria-label="Search HTTP status codes"
              className="h-10 w-full rounded-[9px] border border-outline bg-surface pl-9 pr-14 font-ui text-[13px] text-on-surface outline-none placeholder:text-on-faint focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 flex size-5 items-center justify-center rounded-full bg-surface-high text-on-muted hover:text-on-surface transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 hidden rounded border border-outline bg-surface-low px-1.5 py-0.5 font-mono text-[10px] text-on-faint sm:inline-block">
                /
              </kbd>
            )}
          </div>

          {/* Category Tabs */}
          <div className="mb-2.5 flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              const count =
                cat.id === "All"
                  ? HTTP_STATUS_CODES.length
                  : HTTP_STATUS_CODES.filter((s) => s.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  aria-pressed={active}
                  className={`flex h-7 items-center gap-1.5 rounded-[7px] px-2 font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface text-on-muted hover:bg-surface-high hover:text-on-surface"
                  }`}
                >
                  <span>{cat.short}</span>
                  <span
                    className={`rounded-full px-1 text-[9.5px] ${
                      active ? "bg-black/20 text-white" : "bg-surface-low text-on-faint"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Common Code Chips */}
          <div className="mb-2.5 flex flex-wrap items-center gap-1">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-on-faint mr-1">
              Popular:
            </span>
            {COMMON_CODES.map((code) => {
              const isSelected = selectedStatus.code === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => selectCode(code)}
                  className={`rounded-[5px] px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary text-on-primary"
                      : "bg-surface text-on-muted hover:bg-surface-high hover:text-on-surface"
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-outline mb-2" />

          {/* Scrollable Status Codes List */}
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5">
            {filteredStatuses.length > 0 ? (
              filteredStatuses.map((status) => {
                const isSelected = selectedStatus.code === status.code;
                const catColor = getCategoryColor(status.category);
                return (
                  <button
                    key={status.code}
                    type="button"
                    onClick={() => selectCode(status.code)}
                    aria-selected={isSelected}
                    className={`group relative flex items-center gap-2.5 rounded-[10px] border p-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-surface shadow-sm ring-1 ring-primary/40"
                        : "border-transparent bg-surface/50 hover:bg-surface hover:border-outline"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-12 shrink-0 items-center justify-center rounded-[6px] font-mono text-[13px] font-bold border transition-colors ${catColor.badge}`}
                    >
                      {status.code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`truncate text-[13px] font-semibold ${
                            isSelected ? "text-on-surface" : "text-on-surface"
                          }`}
                        >
                          {status.name}
                        </span>
                        <span className="shrink-0 font-mono text-[9.5px] text-on-faint">
                          {status.spec.split(" ")[0]}
                        </span>
                      </div>
                      <p className="m-0 truncate text-[11px] text-on-muted">{status.description}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-on-faint">
                <Search className="size-6 opacity-40" />
                <span className="text-[12px]">No status codes match "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="mt-1 text-[11px] text-primary hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 text-right">
            <span className="font-mono text-[10.5px] text-on-faint">
              Showing {filteredStatuses.length} of {HTTP_STATUS_CODES.length} codes
            </span>
          </div>
        </section>

        {/* Right Column: In-depth Detail Inspector */}
        <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4 rounded-[14px] border border-outline bg-surface p-5 sm:p-6 overflow-y-auto">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-[7px] border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${colorStyles.badge}`}
              >
                {selectedStatus.category}
              </span>
              <span className="rounded-[7px] border border-outline bg-surface-low px-2.5 py-1 font-mono text-[11px] text-on-muted">
                {selectedStatus.spec}
              </span>
              {selectedStatus.cacheable === true && (
                <span className="rounded-[7px] border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Cacheable
                </span>
              )}
            </div>

            {/* Copy Button Toolbar */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  void copy("copy-status", `${selectedStatus.code} ${selectedStatus.name}`)
                }
                className="flex h-8 items-center gap-1.5 rounded-[7px] border border-outline bg-surface-low px-2.5 text-[12px] font-semibold text-on-surface hover:bg-surface-high transition-colors cursor-pointer"
                title="Copy code and phrase (e.g. 404 Not Found)"
              >
                {isCopied("copy-status") ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5 text-on-muted" />
                )}
                <span>Copy Status</span>
              </button>
              <button
                type="button"
                onClick={() => void copy("copy-snippet", activeSnippet)}
                className="flex h-8 items-center gap-1.5 rounded-[7px] border border-outline bg-surface-low px-2.5 text-[12px] font-semibold text-on-surface hover:bg-surface-high transition-colors cursor-pointer"
                title="Copy active code snippet"
              >
                {isCopied("copy-snippet") ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Layers className="size-3.5 text-on-muted" />
                )}
                <span>Copy Snippet</span>
              </button>
            </div>
          </div>

          {/* Main Hero Code & Title */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-3.5 flex-wrap">
              <span
                className={`font-mono text-[44px] sm:text-[52px] font-extrabold leading-none tracking-tight ${colorStyles.text}`}
              >
                {selectedStatus.code}
              </span>
              <h3 className="m-0 text-[24px] sm:text-[28px] font-bold font-display text-on-surface">
                {selectedStatus.name}
              </h3>
            </div>
            <p className="m-0 text-[14px] font-medium leading-relaxed text-on-surface">
              {selectedStatus.description}
            </p>
          </div>

          {/* Detailed explanation */}
          <div className="rounded-[12px] border border-outline bg-bg-elevated p-4">
            <FieldLabel>Detailed Specifications & Behavior</FieldLabel>
            <p className="mt-2 mb-0 text-[13px] leading-relaxed text-on-muted">
              {selectedStatus.detail}
            </p>
          </div>

          {/* Property Matrix Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-[10px] border border-outline bg-bg-elevated p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-faint">
                Cacheability
              </span>
              <span className="text-[13px] font-semibold text-on-surface">
                {selectedStatus.cacheable === true
                  ? "Yes (Heuristic / Standard)"
                  : selectedStatus.cacheable === "conditionally"
                    ? "Conditionally"
                    : "No (Non-cacheable)"}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-[10px] border border-outline bg-bg-elevated p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-faint">
                Response Body
              </span>
              <span className="text-[13px] font-semibold text-on-surface">
                {selectedStatus.hasResponseBody === true
                  ? "Allowed / Recommended"
                  : selectedStatus.hasResponseBody === "none"
                    ? "No body permitted"
                    : "Optional"}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-[10px] border border-outline bg-bg-elevated p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-faint">
                RFC Standard
              </span>
              <span className="text-[13px] font-semibold text-on-surface truncate">
                {selectedStatus.spec}
              </span>
            </div>
          </div>

          {/* Common Headers */}
          {selectedStatus.commonHeaders && selectedStatus.commonHeaders.length > 0 && (
            <div className="flex flex-col gap-2">
              <FieldLabel>Relevant HTTP Response Headers</FieldLabel>
              <div className="flex flex-wrap items-center gap-2">
                {selectedStatus.commonHeaders.map((header) => (
                  <button
                    key={header}
                    type="button"
                    onClick={() => void copy(`header-${header}`, header)}
                    className="flex items-center gap-1.5 rounded-[7px] border border-outline bg-bg-elevated px-2.5 py-1 font-mono text-[12px] text-on-surface hover:bg-surface-high hover:border-outline-strong transition-colors cursor-pointer"
                    title={`Click to copy "${header}" header`}
                  >
                    <span>{header}</span>
                    {isCopied(`header-${header}`) ? (
                      <Check className="size-3 text-success" />
                    ) : (
                      <Copy className="size-3 text-on-faint" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Tab Interactive Code Snippet */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Tabs */}
              <div className="flex items-center gap-1 rounded-[8px] bg-bg-elevated p-1 border border-outline">
                <button
                  type="button"
                  onClick={() => setActiveSnippetTab("wire")}
                  className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 font-mono text-[11.5px] font-semibold transition-all cursor-pointer ${
                    activeSnippetTab === "wire"
                      ? "bg-surface text-on-surface shadow-sm border border-outline"
                      : "text-on-muted hover:text-on-surface border border-transparent"
                  }`}
                >
                  <Layers className="size-3.5" />
                  <span>HTTP/1.1 Wire</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSnippetTab("fetch")}
                  className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 font-mono text-[11.5px] font-semibold transition-all cursor-pointer ${
                    activeSnippetTab === "fetch"
                      ? "bg-surface text-on-surface shadow-sm border border-outline"
                      : "text-on-muted hover:text-on-surface border border-transparent"
                  }`}
                >
                  <Code2 className="size-3.5" />
                  <span>Fetch Client</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSnippetTab("express")}
                  className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 font-mono text-[11.5px] font-semibold transition-all cursor-pointer ${
                    activeSnippetTab === "express"
                      ? "bg-surface text-on-surface shadow-sm border border-outline"
                      : "text-on-muted hover:text-on-surface border border-transparent"
                  }`}
                >
                  <Server className="size-3.5" />
                  <span>Express Server</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => void copy("copy-tab-snippet", activeSnippet)}
                className="flex items-center gap-1 font-mono text-[11px] text-primary hover:underline cursor-pointer"
              >
                {isCopied("copy-tab-snippet") ? (
                  <>
                    <Check className="size-3 text-success" />
                    <span className="text-success">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <pre className="m-0 overflow-x-auto rounded-[10px] border border-outline bg-surface-low p-3.5 font-mono text-[12px] leading-relaxed text-on-surface select-all">
              {activeSnippet}
            </pre>
          </div>

          {/* Related Codes in Same Series */}
          {related.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-outline">
              <FieldLabel>Other {selectedStatus.category} Status Codes</FieldLabel>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((rel) => (
                  <button
                    key={rel.code}
                    type="button"
                    onClick={() => selectCode(rel.code)}
                    className="flex items-center gap-2.5 rounded-[8px] border border-outline bg-bg-elevated p-2 text-left transition-colors hover:bg-surface-high hover:border-outline-strong cursor-pointer"
                  >
                    <span
                      className={`shrink-0 font-mono text-[12.5px] font-bold ${
                        getCategoryColor(rel.category).text
                      }`}
                    >
                      {rel.code}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-on-surface font-medium">
                      {rel.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <StatusBar
        label="HTTP status codes status"
        chip={{ icon: Globe2, text: `HTTP ${selectedStatus.code}` }}
        stats={[
          selectedStatus.name,
          selectedStatus.category,
          selectedStatus.spec,
          `${HTTP_STATUS_CODES.length} standard codes`,
        ]}
        lang="HTTP/1.1"
      />
    </div>
  );
}

