import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copyText } from "@/lib/clipboard";
import { formatFetchRequest, parseCurlCommand } from "@kitland/core";
import { Braces, Check, ClipboardCopy, FileInput, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

const SAMPLE = `curl -X POST 'https://api.example.com/v1/users' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token' \\
  -d '{"name":"Ada Lovelace"}'`;

export function CurlConverterTool() {
  const [source, setSource] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);
  const result = useMemo(() => parseCurlCommand(source), [source]);
  const output = result.ok ? formatFetchRequest(result.value) : "";

  async function copyOutput() {
    if (!output || !(await copyText(output)).ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_600);
  }

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <Braces />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">cURL Converter</h2>
          <p className="tool-header__subtitle">
            Convert a cURL request into copy-ready Fetch code locally.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button variant="ghost" size="sm" className="tool-btn" onClick={() => setSource(SAMPLE)}>
            <FileInput />
            Sample
          </Button>
          <Button variant="ghost" size="sm" className="tool-btn" onClick={() => setSource("")}>
            <RotateCcw /> Clear
          </Button>
        </div>
      </div>
      <output className={result.ok ? "tool-feedback" : "tool-feedback tool-feedback--error"}>
        {result.ok
          ? "No request is sent; this only parses the command in your browser."
          : result.error.message}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-2">
        <label
          htmlFor="curl-command"
          className="grid min-h-0 gap-2 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px] text-sm font-medium"
        >
          cURL command
          <Textarea
            aria-label="cURL command"
            id="curl-command"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="curl https://api.example.com"
            className="min-h-72 flex-1 resize-y font-mono text-xs"
            spellCheck={false}
          />
        </label>
        <section className="grid min-h-0 content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-[18px]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="m-0 text-sm font-semibold">Fetch</h3>
            <Button size="sm" disabled={!result.ok} onClick={() => void copyOutput()}>
              {copied ? <Check /> : <ClipboardCopy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="min-h-72 overflow-auto rounded-xl bg-[var(--bg-elevated)] p-3 text-xs leading-5 whitespace-pre-wrap">
            {output || "Fix the command to generate Fetch code."}
          </pre>
          {result.ok ? (
            <p className="m-0 text-xs text-[var(--on-muted)]">
              {result.value.method} · {result.value.headers.length} header
              {result.value.headers.length === 1 ? "" : "s"}
              {result.value.body === null ? "" : " · request body"}
            </p>
          ) : null}
        </section>
      </section>
    </>
  );
}
