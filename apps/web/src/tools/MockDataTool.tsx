import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { generateMockData, type MockDataOptions } from "@kitland/core";
import { Check, Copy, Database, RefreshCw } from "lucide-react";
import { useState } from "react";
const bytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const initial: MockDataOptions = {
  count: 10,
  includeId: true,
  includeName: true,
  includeEmail: true,
  includeRole: true,
};
export function MockDataTool() {
  const [options, setOptions] = useState(initial),
    [rows, setRows] = useState<readonly Record<string, string>[]>([]),
    [error, setError] = useState<string | null>(null),
    [copied, setCopied] = useState(false);
  function generate() {
    const r = generateMockData(options, bytes);
    if (!r.ok) return setError(r.error.message);
    setRows(r.value);
    setError(null);
    setCopied(false);
  }
  const output = JSON.stringify(rows, null, 2);
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <Database />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">Mock Data</h2>
          <p className="tool-header__subtitle">
            Generate bounded fixture records locally; no data is fetched or stored.
          </p>
        </div>
      </div>
      <output className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}>
        {error ?? "Choose a schema and generate."}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(18rem,.8fr)_minmax(22rem,1.2fr)]">
        <section className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <label htmlFor="mock-count" className="grid gap-1 text-sm">
            Rows
            <input
              id="mock-count"
              type="number"
              min="1"
              max="1000"
              value={options.count}
              onChange={(e) => setOptions({ ...options, count: Number(e.target.value) })}
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm"
            />
          </label>
          {(["includeId", "includeName", "includeEmail", "includeRole"] as const).map((key) => (
            <label key={key} className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={options[key]}
                onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
              />
              {key.replace("include", "Include ")}
            </label>
          ))}
          <Button onClick={generate}>
            <RefreshCw />
            Generate fixture
          </Button>
        </section>
        <section className="grid min-h-0 content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-[18px]">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-sm font-semibold">JSON preview</h3>
            <Button
              size="sm"
              disabled={!rows.length}
              onClick={() => void copyText(output).then((r) => setCopied(r.ok))}
            >
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="min-h-72 overflow-auto rounded-xl bg-[var(--bg-elevated)] p-3 text-xs">
            {rows.length ? output : "Generate fixture data to preview it here."}
          </pre>
        </section>
      </section>
    </>
  );
}
