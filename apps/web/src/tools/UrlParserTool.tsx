import { Textarea } from "@/components/ui/textarea";
import { parseUrl } from "@kitland/core";
import { FileInput, Link2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
const SAMPLE = "https://kitland.dev/explore?tool=base64&local=true#about";
export function UrlParserTool() {
  const [input, setInput] = useState(SAMPLE),
    result = parseUrl(input),
    value = result.ok ? result.value : null;
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <Link2 />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">URL Parser</h2>
          <p className="tool-header__subtitle">Inspect URL parts and query parameters locally.</p>
        </div>
        <div className="tool-header__actions">
          <Button variant="ghost" size="sm" className="tool-btn" onClick={() => setInput(SAMPLE)}>
            <FileInput />
            Sample
          </Button>
        </div>
      </div>
      <output className={!result.ok ? "tool-feedback tool-feedback--error" : "tool-feedback"}>
        {result.ok ? "" : result.error.message}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(18rem,24rem)_1fr]">
        <Textarea
          aria-label="URL"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-80 font-mono text-sm"
        />
        <section className="grid content-start gap-3 sm:grid-cols-2">
          {value
            ? Object.entries({
                Origin: value.origin,
                Protocol: value.protocol,
                Host: value.host,
                Path: value.pathname,
                Query: value.search || "—",
                Fragment: value.hash || "—",
              }).map(([label, text]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--outline)] bg-[var(--surface)] p-4"
                >
                  <p className="m-0 text-xs text-[var(--on-muted)]">{label}</p>
                  <code className="mt-2 block break-all text-sm">{text}</code>
                </div>
              ))
            : null}
          <div className="sm:col-span-2 rounded-xl border border-[var(--outline)] bg-[var(--surface)] p-4">
            <h3 className="m-0 text-sm font-semibold">Query parameters</h3>
            <pre className="mt-2 overflow-auto text-xs">
              {value ? JSON.stringify(value.params, null, 2) : "—"}
            </pre>
          </div>
        </section>
      </section>
    </>
  );
}
