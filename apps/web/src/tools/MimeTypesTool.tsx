import { Button } from "@/components/ui/button";
import { lookupMimeTypes, MIME_TYPES_MAX_QUERY_CHARS, type MimeType } from "@kitland/core";
import { FileInput, FileText, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const SAMPLE = ".svg";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-4 rounded-lg border border-[var(--outline)] bg-[var(--canvas)] px-3 py-2">
      <span className="font-mono text-[11px] tracking-[0.1em] text-[var(--on-muted)]">{label}</span>
      <code className="break-all text-right text-xs text-[var(--on-surface)]">{value}</code>
    </div>
  );
}

function MatchCard({ entry }: { entry: MimeType }) {
  return (
    <article className="grid gap-4 rounded-xl border border-[var(--outline)] bg-[var(--canvas)] p-4">
      <div>
        <code className="block break-all text-lg font-semibold text-[var(--on-surface)]">
          {entry.mime}
        </code>
        <p className="mt-1 text-xs text-[var(--on-muted)]">
          {entry.description} · {entry.charset ? "text-based" : "binary"} ·{" "}
          {entry.compressible ? "compressible" : "not compressible"}
        </p>
      </div>
      {entry.extensions.length ? (
        <div>
          <p className="font-mono text-[11px] tracking-[0.1em] text-[var(--on-muted)]">
            EXTENSIONS
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {entry.extensions.map((extension) => (
              <code
                key={extension}
                className="rounded-full border border-[var(--outline)] px-3 py-1.5 text-xs"
              >
                .{extension}
              </code>
            ))}
          </div>
        </div>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <DetailRow label="TYPE" value={entry.type} />
        <DetailRow label="SUBTYPE" value={entry.subtype} />
        <DetailRow label="ENCODING" value={entry.charset ?? "Binary"} />
        <DetailRow label="SOURCE" value={entry.source} />
      </div>
    </article>
  );
}

export function MimeTypesTool() {
  const [input, setInput] = useState(SAMPLE);
  const [query, setQuery] = useState(SAMPLE);
  const result = useMemo(() => lookupMimeTypes(query), [query]);
  const matches = result.ok ? result.value.matches : [];
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <FileText />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">MIME Types</h2>
          <p className="tool-header__subtitle">Look up MIME types by extension</p>
        </div>
        <div className="tool-header__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setInput(SAMPLE);
              setQuery(SAMPLE);
            }}
          >
            <FileInput aria-hidden="true" />
            Sample
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setInput("");
              setQuery("");
            }}
          >
            <Trash2 aria-hidden="true" />
            Clear
          </Button>
          <Button type="submit" form="mime-types-form" size="sm" className="tool-btn">
            <Search aria-hidden="true" />
            Lookup
          </Button>
        </div>
      </div>
      <output
        className={!result.ok ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        role={!result.ok ? "alert" : undefined}
        aria-live="polite"
      >
        {result.ok ? "" : result.error.message}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(17rem,21.25rem)_1fr]">
        <form
          id="mime-types-form"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(input);
          }}
          className="rounded-xl bg-[var(--canvas)] p-4 sm:p-[18px]"
        >
          <label
            className="block font-mono text-[11px] tracking-[0.12em] text-[var(--on-muted)]"
            htmlFor="mime-type-query"
          >
            TYPE OR EXTENSION
          </label>
          <input
            id="mime-type-query"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={MIME_TYPES_MAX_QUERY_CHARS}
            placeholder=".svg or image/svg+xml"
            spellCheck={false}
            autoCapitalize="none"
            className="mt-2 h-11 w-full rounded-[10px] border border-[var(--outline)] bg-[var(--surface)] px-3 font-mono text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
            aria-describedby="mime-query-hint"
          />
          <p id="mime-query-hint" className="mt-2 text-xs text-[var(--on-muted)]">
            Accepts a file extension, filename, or media type.
          </p>
          <Button type="submit" className="mt-4 w-full">
            <Search aria-hidden="true" />
            Look Up
          </Button>
        </form>
        <section
          className="rounded-xl border border-[var(--outline)] bg-[var(--surface)] p-4 sm:p-5"
          aria-label="MIME lookup results"
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold">MIME Lookup</h3>
            <p className="mt-1 text-xs text-[var(--on-muted)]">
              {result.ok
                ? `${matches.length} ${matches.length === 1 ? "entry" : "entries"} · local registry`
                : "Enter a type or extension to search."}
            </p>
          </div>
          {result.ok && matches.length ? (
            <div className="grid gap-3">
              {matches.map((entry) => (
                <MatchCard key={entry.mime} entry={entry} />
              ))}
            </div>
          ) : result.ok ? (
            <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-[var(--outline)] px-6 text-center text-sm text-[var(--on-muted)]">
              No MIME type was found for <code className="mx-1">{result.value.query}</code>. Try a
              standard extension such as <code className="ml-1">.json</code>.
            </div>
          ) : (
            <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-[var(--outline)] px-6 text-center text-sm text-[var(--on-muted)]">
              Results will appear here.
            </div>
          )}
        </section>
      </section>
    </>
  );
}
