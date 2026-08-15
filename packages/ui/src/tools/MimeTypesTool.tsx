import { lookupMimeTypes, MIME_TYPES, type MimeCategory, type MimeType } from "@kitland/core";
import { Check, Copy, FileCode2, Layers, Search, Server, Terminal } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { FieldLabel, SampleAction, StatusBar, ToolHeader } from "../components/tool-form";

const CATEGORIES: readonly { id: MimeCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "application", label: "Application" },
  { id: "text", label: "Text" },
  { id: "image", label: "Image" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Video" },
  { id: "font", label: "Font" },
  { id: "model", label: "3D Model" },
  { id: "multipart", label: "Multipart" },
];

const COMMON_SAMPLES = [
  ".json",
  ".svg",
  ".wasm",
  ".mp4",
  ".pdf",
  ".png",
  ".webp",
  ".woff2",
  ".csv",
  ".zip",
];

function getCategoryColor(category: MimeCategory) {
  switch (category) {
    case "application":
      return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
    case "text":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "image":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "audio":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    case "video":
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    case "font":
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
    case "model":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "multipart":
      return "bg-pink-500/15 text-pink-400 border-pink-500/30";
  }
}

function generateContentTypeHeader(entry: MimeType): string {
  if (entry.charset) {
    return `Content-Type: ${entry.mime}; charset=${entry.charset.toLowerCase()}`;
  }
  return `Content-Type: ${entry.mime}`;
}

function generateNginxSnippet(entry: MimeType): string {
  if (entry.extensions.length === 0) {
    return `# Nginx types configuration\ntypes {\n    ${entry.mime};\n}`;
  }
  return `# Nginx mime.types mapping\ntypes {\n    ${entry.mime} ${entry.extensions.join(" ")};\n}`;
}

function generateApacheSnippet(entry: MimeType): string {
  if (entry.extensions.length === 0) {
    return `# Apache .htaccess / httpd.conf\n# No default extension mapping for ${entry.mime}`;
  }
  const exts = entry.extensions.map((e) => `.${e}`).join(" ");
  return `# Apache .htaccess / httpd.conf\nAddType ${entry.mime} ${exts}`;
}

export function MimeTypesTool() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MimeCategory | "all">("all");
  const [selectedMime, setSelectedMime] = useState<string>("image/svg+xml");

  const { isCopied, copy } = useCopyFeedback();

  const selectedEntry = useMemo(() => {
    return MIME_TYPES.find((m) => m.mime === selectedMime) ?? MIME_TYPES[0]!;
  }, [selectedMime]);

  const filteredEntries = useMemo(() => {
    let list = MIME_TYPES;
    if (selectedCategory !== "all") {
      list = list.filter((m) => m.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const result = lookupMimeTypes(searchQuery);
      if (result.ok) {
        if (selectedCategory !== "all") {
          list = result.value.matches.filter((m) => m.category === selectedCategory);
        } else {
          list = result.value.matches;
        }
      } else {
        list = [];
      }
    }
    return list;
  }, [searchQuery, selectedCategory]);

  const handleSelectMime = useCallback((mime: string) => {
    setSelectedMime(mime);
  }, []);

  const handleSample = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedMime("image/svg+xml");
  }, []);

  const handleQuickSample = useCallback((ext: string) => {
    setSearchQuery(ext);
    setSelectedCategory("all");
    const result = lookupMimeTypes(ext);
    if (result.ok && result.value.matches.length > 0) {
      setSelectedMime(result.value.matches[0]!.mime);
    }
  }, []);

  const contentTypeHeader = useMemo(
    () => generateContentTypeHeader(selectedEntry),
    [selectedEntry],
  );
  const nginxSnippet = useMemo(() => generateNginxSnippet(selectedEntry), [selectedEntry]);
  const apacheSnippet = useMemo(() => generateApacheSnippet(selectedEntry), [selectedEntry]);

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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
        {/* Left Column: Search, Category Filters, and MIME List */}
        <section className="flex min-h-[480px] flex-col rounded-[14px] border border-outline bg-bg-elevated p-4 max-lg:max-h-[380px]">
          {/* Search box */}
          <div className="relative mb-3 flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-on-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extension (.svg, png), MIME type, name…"
              aria-label="Search MIME types or extensions"
              className="h-10 w-full rounded-[9px] border border-outline bg-surface pl-9 pr-3 font-ui text-[13px] text-on-surface outline-none placeholder:text-on-faint focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="mb-3 flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              const count =
                cat.id === "all"
                  ? MIME_TYPES.length
                  : MIME_TYPES.filter((m) => m.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  aria-pressed={active}
                  className={`flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface text-on-muted hover:bg-surface-high hover:text-on-surface"
                  }`}
                >
                  <span>{cat.label}</span>
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

          {/* Quick Common Extension Chips */}
          <div className="mb-2 flex flex-wrap items-center gap-1">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-on-faint mr-1">
              Popular:
            </span>
            {COMMON_SAMPLES.map((ext) => (
              <button
                key={ext}
                type="button"
                onClick={() => handleQuickSample(ext)}
                className="rounded-[5px] bg-surface px-1.5 py-0.5 font-mono text-[11px] font-semibold text-on-muted hover:bg-surface-high hover:text-on-surface transition-colors cursor-pointer"
              >
                {ext}
              </button>
            ))}
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
                    className={`flex flex-col gap-1 rounded-[10px] border p-2.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-surface shadow-sm ring-1 ring-primary/40"
                        : "border-transparent bg-surface/60 hover:bg-surface hover:border-outline"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[13px] font-semibold text-on-surface">
                        {entry.mime}
                      </span>
                      <span
                        className={`shrink-0 rounded-[5px] border px-1.5 py-0.2 font-mono text-[9.5px] font-bold uppercase ${catColor}`}
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
                          {entry.extensions.slice(0, 3).map((ext) => (
                            <span
                              key={ext}
                              className="rounded border border-outline bg-surface-low px-1 font-mono text-[9.5px] text-on-faint"
                            >
                              .{ext}
                            </span>
                          ))}
                          {entry.extensions.length > 3 && (
                            <span className="font-mono text-[9px] text-on-faint">
                              +{entry.extensions.length - 3}
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
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="mt-1 text-[11px] text-primary hover:underline"
                >
                  Clear filters
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
        <section className="flex min-h-[480px] min-w-0 flex-1 flex-col gap-4 rounded-[14px] border border-outline bg-surface p-5 overflow-y-auto">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-[7px] border px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider ${getCategoryColor(
                  selectedEntry.category,
                )}`}
              >
                {selectedEntry.category}
              </span>
              <span className="rounded-[7px] border border-outline bg-surface-low px-2.5 py-1 font-mono text-[11px] text-on-muted">
                {selectedEntry.source} Authority
              </span>
              {selectedEntry.compressible ? (
                <span className="rounded-[7px] border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-emerald-400">
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
                <Layers className="size-3.5 text-on-muted" />
                <span>Copy Header</span>
              </button>
            </div>
          </div>

          {/* Hero MIME Type */}
          <div className="flex flex-col gap-2">
            <h3 className="m-0 break-all font-mono text-[32px] font-extrabold text-on-surface">
              {selectedEntry.mime}
            </h3>
            <p className="m-0 text-[14px] font-medium leading-relaxed text-on-muted">
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
                    className="flex items-center gap-1.5 rounded-[8px] border border-outline bg-surface px-3 py-1.5 font-mono text-[13px] font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    title={`Click to copy ".${ext}"`}
                  >
                    <span>.{ext}</span>
                    <Copy className="size-3 text-on-faint" />
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[12px] text-on-faint">
                No specific file extension associated (stream or payload only).
              </span>
            )}
          </div>

          {/* Property Matrix Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
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
                {selectedEntry.charset ?? "Binary / Not text"}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-[10px] border border-outline bg-bg-elevated p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-faint">
                Gzip / Brotli
              </span>
              <span className="text-[13px] font-semibold text-on-surface">
                {selectedEntry.compressible ? "Compressible" : "Uncompressed"}
              </span>
            </div>
          </div>

          {/* HTTP Content-Type Header Snippet */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <FieldLabel>HTTP Response Header</FieldLabel>
              <button
                type="button"
                onClick={() => void copy("copy-content-type", contentTypeHeader)}
                className="flex items-center gap-1 font-mono text-[11px] text-primary hover:underline cursor-pointer"
              >
                <Copy className="size-3" />
                <span>Copy</span>
              </button>
            </div>
            <pre className="m-0 overflow-x-auto rounded-[10px] border border-outline bg-marketing-canvas p-3 font-mono text-[12px] text-on-surface select-all">
              {contentTypeHeader}
            </pre>
          </div>

          {/* Server Config Snippets */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Nginx */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-on-muted">
                  <Server className="size-3.5" />
                  <span>Nginx Configuration</span>
                </span>
                <button
                  type="button"
                  onClick={() => void copy("copy-nginx", nginxSnippet)}
                  className="font-mono text-[11px] text-primary hover:underline cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <pre className="m-0 overflow-x-auto rounded-[10px] border border-outline bg-marketing-canvas p-3 font-mono text-[11.5px] text-on-surface select-all">
                {nginxSnippet}
              </pre>
            </div>

            {/* Apache */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-on-muted">
                  <Terminal className="size-3.5" />
                  <span>Apache .htaccess</span>
                </span>
                <button
                  type="button"
                  onClick={() => void copy("copy-apache", apacheSnippet)}
                  className="font-mono text-[11px] text-primary hover:underline cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <pre className="m-0 overflow-x-auto rounded-[10px] border border-outline bg-marketing-canvas p-3 font-mono text-[11.5px] text-on-surface select-all">
                {apacheSnippet}
              </pre>
            </div>
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
                    className="flex flex-col gap-0.5 rounded-[8px] border border-outline bg-bg-elevated p-2 text-left transition-colors hover:bg-surface-high cursor-pointer"
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
