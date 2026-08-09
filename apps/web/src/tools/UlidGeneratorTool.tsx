import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { generateUlid } from "@kitland/core";
import { Check, Copy, Fingerprint, RefreshCw } from "lucide-react";
import { useState } from "react";
const randomBytes = (length: number) => crypto.getRandomValues(new Uint8Array(length));
export function UlidGeneratorTool() {
  const [timestamp, setTimestamp] = useState(() => Date.now()),
    [value, setValue] = useState(""),
    [error, setError] = useState<string | null>(null),
    [copied, setCopied] = useState(false);
  function generate() {
    const result = generateUlid(timestamp, randomBytes);
    if (!result.ok) return setError(result.error.message);
    setValue(result.value);
    setError(null);
    setCopied(false);
  }
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <Fingerprint />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">ULID Generator</h2>
          <p className="tool-header__subtitle">
            Generate sortable, uppercase ULIDs from a Unix millisecond timestamp locally.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button size="sm" className="tool-btn" onClick={() => setTimestamp(Date.now())}>
            Use now
          </Button>
        </div>
      </div>
      <output className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}>
        {error ?? "No identifier is stored or sent."}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(22rem,1.2fr)]">
        <section className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <label htmlFor="ulid-timestamp" className="grid gap-1 text-sm">
            Unix timestamp (ms)
            <input
              id="ulid-timestamp"
              type="number"
              value={timestamp}
              onChange={(event) => setTimestamp(Number(event.target.value))}
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm"
            />
          </label>
          <p className="m-0 text-xs text-[var(--on-muted)]">
            {new Date(timestamp).toLocaleString()}
          </p>
          <Button onClick={generate}>
            <RefreshCw /> Generate ULID
          </Button>
        </section>
        <section className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-[18px]">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-sm font-semibold">ULID</h3>
            <Button
              size="sm"
              disabled={!value}
              onClick={() => void copyText(value).then((result) => setCopied(result.ok))}
            >
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <output className="min-h-20 break-all rounded-xl bg-[var(--bg-elevated)] p-4 font-mono text-sm">
            {value || "Generate a ULID to see it here."}
          </output>
        </section>
      </section>
    </>
  );
}
