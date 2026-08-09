import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { generateObjectId } from "@kitland/core";
import { Check, Copy, Fingerprint, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
const bytes = (length: number) => crypto.getRandomValues(new Uint8Array(length));
export function ObjectIdGeneratorTool() {
  const counter = useRef(crypto.getRandomValues(new Uint32Array(1))[0]! & 0xffffff),
    [value, setValue] = useState(""),
    [copied, setCopied] = useState(false),
    [error, setError] = useState<string | null>(null);
  function generate() {
    const result = generateObjectId(Math.floor(Date.now() / 1000), counter.current, bytes);
    counter.current = (counter.current + 1) & 0xffffff;
    if (!result.ok) return setError(result.error.message);
    setValue(result.value.value);
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
          <h2 className="tool-header__title">ObjectID Generator</h2>
          <p className="tool-header__subtitle">
            Generate MongoDB-compatible ObjectIDs locally with secure browser entropy.
          </p>
        </div>
      </div>
      <output className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}>
        {error ?? "No ID is stored or sent."}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(22rem,1.2fr)]">
        <section className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <p className="m-0 text-sm">Uses the current Unix timestamp plus a per-session counter.</p>
          <Button onClick={generate}>
            <RefreshCw />
            Generate ObjectID
          </Button>
        </section>
        <section className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-[18px]">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-sm font-semibold">ObjectID</h3>
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
            {value || "Generate an ObjectID to see it here."}
          </output>
        </section>
      </section>
    </>
  );
}
