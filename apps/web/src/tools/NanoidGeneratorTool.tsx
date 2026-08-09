import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { generateNanoid, NANOID_DEFAULT_ALPHABET } from "@kitland/core";
import { Check, Copy, Fingerprint, RefreshCw } from "lucide-react";
import { useState } from "react";

const secureBytes = (length: number) => crypto.getRandomValues(new Uint8Array(length));
export function NanoidGeneratorTool() {
  const [length, setLength] = useState(21);
  const [alphabet, setAlphabet] = useState(NANOID_DEFAULT_ALPHABET);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  function generate() {
    const result = generateNanoid({ length, alphabet }, secureBytes);
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
          <h2 className="tool-header__title">NanoID Generator</h2>
          <p className="tool-header__subtitle">
            Generate compact, URL-safe IDs with browser-provided secure randomness.
          </p>
        </div>
      </div>
      <output className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}>
        {error ?? "Nothing is stored or sent."}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(22rem,1.2fr)]">
        <section className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <label htmlFor="nanoid-length" className="grid gap-1 text-sm">
            Length
            <input
              id="nanoid-length"
              type="number"
              min="1"
              max="256"
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm"
            />
          </label>
          <label htmlFor="nanoid-alphabet" className="grid gap-1 text-sm">
            Alphabet
            <input
              id="nanoid-alphabet"
              value={alphabet}
              onChange={(event) => setAlphabet(event.target.value)}
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm"
              spellCheck={false}
            />
          </label>
          <Button onClick={generate}>
            <RefreshCw /> Generate NanoID
          </Button>
        </section>
        <section className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-[18px]">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-sm font-semibold">NanoID</h3>
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
            {value || "Generate an ID to see it here."}
          </output>
          <p className="m-0 text-xs text-[var(--on-muted)]">
            {value ? value.length + " characters" : "Default: 21 URL-safe characters"}
          </p>
        </section>
      </section>
    </>
  );
}
