import {
  generateMimeApacheSnippet,
  generateMimeContentTypeHeader,
  generateMimeFetchSnippet,
  generateMimeNginxSnippet,
  lookupMimeTypes,
  MIME_TYPES,
  type MimeCategory,
} from "@kitland/core";
import { Check, Code2, Copy, FileCode2, Layers, Search, Server, Terminal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FieldLabel, SampleAction, StatusBar, ToolHeader } from "../components/tool-form";
import { useCopyFeedback } from "../hooks/useCopyFeedback";

type SnippetTab = "header" | "fetch" | "nginx" | "apache";

const POPULAR_EXTENSIONS = [
  ".json",
  ".svg",
  ".png",
  ".webp",
  ".pdf",
  ".mp4",
  ".woff2",
  ".csv",
] as const;

function getCategoryColor(category: MimeCategory) {
  switch (category) {
    case "application":
      return {
        badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
        text: "text-indigo-600 dark:text-indigo-400",
        ring: "ring-indigo-500/30 border-indigo-500/50",
      };
    case "text":
      return {
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
        text: "text-emerald-600 dark:text-emerald-400",
        ring: "ring-emerald-500/30 border-emerald-500/50",
      };
    case "image":
      return {
        badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
        text: "text-amber-600 dark:text-amber-400",
        ring: "ring-amber-500/30 border-amber-500/50",
      };
    case "audio":
      return {
        badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
        text: "text-purple-600 dark:text-purple-400",
        ring: "ring-purple-500/30 border-purple-500/50",
      };
    case "video":
      return {
        badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
        text: "text-rose-600 dark:text-rose-400",
        ring: "ring-rose-500/30 border-rose-500/50",
      };
    case "font":
      return {
        badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25",
        text: "text-cyan-600 dark:text-cyan-400",
        ring: "ring-cyan-500/30 border-cyan-500/50",
      };
    case "model":
      return {
        badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25",
        text: "text-orange-600 dark:text-orange-400",
        ring: "ring-orange-500/30 border-orange-500/50",
      };
    case "multipart":
      return {
        badge: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25",
        text: "text-pink-600 dark:text-pink-400",
        ring: "ring-pink-500/30 border-pink-500/50",
      };
  }
}

export function MimeTypesTool() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMime, setSelectedMime] = useState<string>("image/svg+xml");
  const [activeSnippetTab, setActiveSnippetTab] = useState<SnippetTab>("header");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isCopied, copy } = useCopyFeedback();

  const selectedEntry = useMemo(() => {
    return MIME_TYPES.find((m) => m.mime === selectedMime) ?? MIME_TYPES[0]!;
  }, [selectedMime]);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return MIME_TYPES;
    const result = lookupMimeTypes(searchQuery);
    if (result.ok) {
      return result.value.matches;
    }
    return [];
  }, [searchQuery]);

  const handleSelectMime = useCallback((mime: string) => {
    setSelectedMime(mime);
  }, []);

  const handleSample = useCallback(() => {
    setSearchQuery("");
    setSelectedMime("image/svg+xml");
    setActiveSnippetTab("header");
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  const handleQuickExtension = useCallback((ext: string) => {
    const bareExt = ext.replace(/^\./, "");
    const match = MIME_TYPES.find((m) => m.extensions.includes(bareExt));
    if (match) {
      setSelectedMime(match.mime);
    }
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

  const colorStyles = getCategoryColor(selectedEntry.category);

  const contentTypeHeader = useMemo(
    () => generateMimeContentTypeHeader(selectedEntry),
    [selectedEntry],
  );
  const fetchSnippet = useMemo(() => generateMimeFetchSnippet(selectedEntry), [selectedEntry]);
  const nginxSnippet = useMemo(() => generateMimeNginxSnippet(selectedEntry), [selectedEntry]);
  const apacheSnippet = useMemo(() => generateMimeApacheSnippet(selectedEntry), [selectedEntry]);

  const activeSnippet = useMemo(() => {
    switch (activeSnippetTab) {
      case "header":
        return contentTypeHeader;
      case "fetch":
        return fetchSnippet;
      case "nginx":
        return nginxSnippet;
      case "apache":
        return apacheSnippet;
    }
  }, [activeSnippetTab, contentTypeHeader, fetchSnippet, nginxSnippet, apacheSnippet]);

  const relatedSameType = useMemo(() => {
    return MIME_TYPES.filter(
      (m) => m.type === selectedEntry.type && m.mime !== selectedEntry.mime,
    ).slice(0, 6);
  }, [selectedEntry]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={FileCode2}
        title="MIME Types"
        subtitle="Search and inspect standard IANA and web MIME media types with configuration snippets."
        actions={<SampleAction onClick={handleSample} label="Sample (.svg)" />}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)] lg:h-[calc(100dvh-175px)] lg:max-h-[920px]">
        {/* Left Column: Search, Popular Extensions, and MIME List */}
        <section className="flex h-full min-h-0 flex-col rounded-[14px] border border-outline bg-bg-elevated p-3.5 max-lg:min-h-[460px]">
          {/* Search box */}
          <div className="relative mb-3 flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-on-faint" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extension (.svg, png), MIME type, name…"
              aria-label="Search MIME types or extensions"
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

          {/* Popular Extensions Quick-Select Bar */}
          <div className="mb-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-on-faint">
                Popular
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="font-mono text-[10.5px] text-primary hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {POPULAR_EXTENSIONS.map((ext) => {
                const bareExt = ext.replace(/^\./, "");
                const isSelected = selectedEntry.extensions.includes(bareExt);
                return (
                  <button
                    key={ext}
                    type="button"
                    onClick={() => handleQuickExtension(ext)}
                    aria-pressed={isSelected}
                    className={`flex h-7 flex-1 items-center justify-center rounded-[6px] font-mono text-[11px] font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-primary text-on-primary border-primary shadow-xs"
                        : "bg-surface text-on-muted hover:text-on-surface hover:bg-surface-high border-outline"
                    }`}
                  >
                    {ext}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-outline mb-2" />

          {/* Scrollable MIME List */}
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5">
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => {
                const isSelected = selectedEntry.mime === entry.mime;
                const catColor = getCategoryColor(entry.category);
                return (
                  <button
                    key={entry.mime}
                    type="button"
                    onClick={() => handleSelectMime(entry.mime)}
                    aria-selected={isSelected}
                    className={`group relative flex flex-col gap-1 rounded-[10px] border p-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-surface shadow-sm ring-1 ring-primary/40"
                        : "border-transparent bg-surface/50 hover:bg-surface hover:border-outline"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[12.5px] font-semibold text-on-surface">
                        {entry.mime}
                      </span>
                      <span
                        className={`shrink-0 rounded-[5px] border px-1.5 py-0.2 font-mono text-[9.5px] font-bold uppercase ${catColor.badge}`}
                      >
                        {entry.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-on-muted">
                        {entry.description}
                      </span>
                      {entry.extensions.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          {entry.extensions.slice(0, 2).map((ext) => (
                            <span
                              key={ext}
                              className="rounded border border-outline bg-surface-low px-1 font-mono text-[9.5px] text-on-faint"
                            >
                              .{ext}
                            </span>
                          ))}
                          {entry.extensions.length > 2 && (
                            <span className="font-mono text-[9px] text-on-faint">
                              +{entry.extensions.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-on-faint">
                <Search className="size-6 opacity-40" />
                <span className="text-[12px]">No MIME types match "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mt-1 text-[11px] text-primary hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 text-right">
            <span className="font-mono text-[10.5px] text-on-faint">
              Showing {filteredEntries.length} of {MIME_TYPES.length} media types
            </span>
          </div>
        </section>

        {/* Right Column: Deep MIME Inspector & Configuration Snippets */}
        <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4 rounded-[14px] border border-outline bg-surface p-5 sm:p-6 overflow-y-auto">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-[7px] border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${colorStyles.badge}`}
              >
                {selectedEntry.category}
              </span>
              <span className="rounded-[7px] border border-outline bg-surface-low px-2.5 py-1 font-mono text-[11px] text-on-muted">
                {selectedEntry.source} Authority
              </span>
              {selectedEntry.compressible ? (
                <span className="rounded-[7px] border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Compressible (Gzip / Brotli)
                </span>
              ) : (
                <span className="rounded-[7px] border border-outline bg-surface-low px-2 py-0.5 font-mono text-[10.5px] text-on-faint">
                  Binary / Pre-compressed
                </span>
              )}
            </div>

            {/* Copy Button Toolbar */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void copy("copy-mime", selectedEntry.mime)}
                className="flex h-8 items-center gap-1.5 rounded-[7px] border border-outline bg-surface-low px-2.5 text-[12px] font-semibold text-on-surface hover:bg-surface-high transition-colors cursor-pointer"
                title="Copy MIME type string"
              >
                {isCopied("copy-mime") ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5 text-on-muted" />
                )}
                <span>Copy MIME</span>
              </button>
              <button
                type="button"
                onClick={() => void copy("copy-header", contentTypeHeader)}
                className="flex h-8 items-center gap-1.5 rounded-[7px] border border-outline bg-surface-low px-2.5 text-[12px] font-semibold text-on-surface hover:bg-surface-high transition-colors cursor-pointer"
                title="Copy HTTP Content-Type header"
              >
                {isCopied("copy-header") ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Layers className="size-3.5 text-on-muted" />
                )}
                <span>Copy Header</span>
              </button>
            </div>
          </div>

          {/* Hero MIME Type */}
          <div className="flex flex-col gap-1.5">
            <h3 className="m-0 break-all font-mono text-[30px] sm:text-[36px] font-extrabold tracking-tight text-on-surface">
              {selectedEntry.mime}
            </h3>
            <p className="m-0 text-[13.5px] leading-relaxed text-on-muted">
              {selectedEntry.description}
            </p>
          </div>

          {/* File Extensions Badges */}
          <div className="rounded-[12px] border border-outline bg-bg-elevated p-4 flex flex-col gap-2">
            <FieldLabel>Associated File Extensions</FieldLabel>
            {selectedEntry.extensions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {selectedEntry.extensions.map((ext) => (
                  <button
                    key={ext}
                    type="button"
                    onClick={() => void copy(`ext-${ext}`, `.${ext}`)}
                    className="flex items-center gap-1.5 rounded-[8px] border border-outline bg-surface px-2.5 py-1 font-mono text-[12px] font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    title={`Click to copy ".${ext}"`}
                  >
                    <span>.{ext}</span>
                    {isCopied(`ext-${ext}`) ? (
                      <Check className="size-3 text-success" />
                    ) : (
                      <Copy className="size-3 text-on-faint" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[12px] text-on-faint">
                No specific file extension associated (stream or protocol payload only).
              </span>
            )}
          </div>

          {/* Property Matrix Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-[10px] border border-outline bg-bg-elevated p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-faint">
                Media Type
              </span>
              <span className="font-mono text-[13px] font-semibold text-on-surface">
                {selectedEntry.type}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-[10px] border border-outline bg-bg-elevated p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-faint">
                Subtype
              </span>
              <span className="font-mono text-[13px] font-semibold text-on-surface truncate">
                {selectedEntry.subtype}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-[10px] border border-outline bg-bg-elevated p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-faint">
                Default Charset
              </span>
              <span className="font-mono text-[13px] font-semibold text-on-surface">
                {selectedEntry.charset ?? "Binary / None"}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-[10px] border border-outline bg-bg-elevated p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-faint">
                Compression
              </span>
              <span className="text-[13px] font-semibold text-on-surface">
                {selectedEntry.compressible ? "Compressible" : "Uncompressed"}
              </span>
            </div>
          </div>

          {/* Multi-Tab Interactive Code Snippet Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 rounded-[8px] bg-bg-elevated p-1 border border-outline">
                <button
                  type="button"
                  onClick={() => setActiveSnippetTab("header")}
                  className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11.5px] font-semibold transition-all cursor-pointer ${
                    activeSnippetTab === "header"
                      ? "bg-surface text-on-surface shadow-sm border border-outline"
                      : "text-on-muted hover:text-on-surface"
                  }`}
                >
                  <FileCode2 className="size-3.5" />
                  <span>HTTP Header</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSnippetTab("fetch")}
                  className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11.5px] font-semibold transition-all cursor-pointer ${
                    activeSnippetTab === "fetch"
                      ? "bg-surface text-on-surface shadow-sm border border-outline"
                      : "text-on-muted hover:text-on-surface"
                  }`}
                >
                  <Code2 className="size-3.5" />
                  <span>Fetch Response</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSnippetTab("nginx")}
                  className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11.5px] font-semibold transition-all cursor-pointer ${
                    activeSnippetTab === "nginx"
                      ? "bg-surface text-on-surface shadow-sm border border-outline"
                      : "text-on-muted hover:text-on-surface"
                  }`}
                >
                  <Server className="size-3.5" />
                  <span>Nginx Config</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSnippetTab("apache")}
                  className={`flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[11.5px] font-semibold transition-all cursor-pointer ${
                    activeSnippetTab === "apache"
                      ? "bg-surface text-on-surface shadow-sm border border-outline"
                      : "text-on-muted hover:text-on-surface"
                  }`}
                >
                  <Terminal className="size-3.5" />
                  <span>Apache .htaccess</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => void copy("copy-active-snippet", activeSnippet)}
                className="flex items-center gap-1 font-mono text-[11px] text-primary hover:underline cursor-pointer"
              >
                {isCopied("copy-active-snippet") ? (
                  <>
                    <Check className="size-3 text-success" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>

            <pre className="m-0 overflow-x-auto rounded-[10px] border border-outline bg-surface-low p-3.5 font-mono text-[12px] leading-relaxed text-on-surface select-all">
              {activeSnippet}
            </pre>
          </div>

          {/* Related Media Types */}
          {relatedSameType.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-outline">
              <FieldLabel>Other {selectedEntry.type}/* MIME Types</FieldLabel>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {relatedSameType.map((rel) => (
                  <button
                    key={rel.mime}
                    type="button"
                    onClick={() => handleSelectMime(rel.mime)}
                    className="flex flex-col gap-0.5 rounded-[8px] border border-outline bg-bg-elevated p-2 text-left transition-colors hover:bg-surface-high hover:border-outline-strong cursor-pointer"
                  >
                    <span className="truncate font-mono text-[12px] font-semibold text-on-surface">
                      {rel.mime}
                    </span>
                    <span className="truncate text-[11px] text-on-muted">{rel.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <StatusBar
        label="MIME types status"
        chip={{ icon: FileCode2, text: selectedEntry.mime }}
        stats={[
          `${selectedEntry.category} media type`,
          selectedEntry.compressible ? "gzip/brotli" : "binary",
          `${MIME_TYPES.length} registered types`,
        ]}
        lang="MIME"
      />
    </div>
  );
}
