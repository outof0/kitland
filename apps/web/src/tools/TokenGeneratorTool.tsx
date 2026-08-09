import { Button } from "@/components/ui/button";
import { generateToken, type TokenFormat } from "@kitland/core";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/clipboard";
export function TokenGeneratorTool() {
  const [length, setLength] = useState(32),
    [format, setFormat] = useState<TokenFormat>("base64url"),
    [token, setToken] = useState(""),
    [error, setError] = useState<string | null>(null),
    [copied, setCopied] = useState(false);
  const generate = () => {
    const r = generateToken(length, format, (n) => {
      const b = new Uint8Array(n);
      globalThis.crypto.getRandomValues(b);
      return b;
    });
    if (r.ok) {
      setToken(r.value);
      setError(null);
    } else setError(r.error.message);
  };
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <KeyRound />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">Token Generator</h2>
          <p className="tool-header__subtitle">Create cryptographically secure local tokens.</p>
        </div>
        <div className="tool-header__actions">
          <Button size="sm" className="tool-btn tool-btn--primary" onClick={generate}>
            <RefreshCw />
            Generate
          </Button>
        </div>
      </div>
      <output className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}>
        {error ?? ""}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <p className="m-0 font-mono text-[11px] tracking-[.15em] text-[var(--on-faint)]">
            FORMAT + LENGTH
          </p>
          <label className="grid gap-1 text-xs text-[var(--on-muted)]">
            Format
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as TokenFormat)}
              className="h-9 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-3 font-mono text-sm"
            >
              <option value="base64url">Base64URL</option>
              <option value="hex">Hex</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-[var(--on-muted)]">
            Length
            <input
              type="number"
              min="1"
              max="4096"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="h-9 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-3 font-mono text-sm"
            />
          </label>
          <Button onClick={generate}>Generate Token</Button>
          <p className="m-0 text-[11px] text-[var(--on-faint)]">
            Uses Web Crypto. Nothing is stored or sent.
          </p>
        </div>
        <section className="flex min-h-[22rem] flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-5">
          <div className="flex justify-between">
            <div>
              <h3 className="m-0 text-base font-semibold">Generated token</h3>
              <p className="m-0 text-xs text-[var(--on-muted)]">
                {token ? `${token.length} characters · ${format}` : "Ready"}
              </p>
            </div>
            <Button
              size="sm"
              disabled={!token}
              onClick={() => void copyText(token).then((r) => setCopied(r.ok))}
            >
              <Copy />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <code className="min-h-32 break-all rounded-xl bg-[var(--bg-elevated)] p-4 font-mono text-sm">
            {token || "Generate a token to see it here."}
          </code>
        </section>
      </section>
    </>
  );
}
