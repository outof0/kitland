import { Button } from "@/components/ui/button";
import { pem, validateRsaOptions } from "@kitland/core";
import { Copy, KeyRound, RefreshCw } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/clipboard";
export function RsaKeyPairTool() {
  const [bits, setBits] = useState(2048),
    [pub, setPub] = useState(""),
    [priv, setPriv] = useState(""),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const generate = async () => {
    const v = validateRsaOptions(bits);
    if (!v.ok) {
      setError(v.error.message);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const c = globalThis.crypto?.subtle;
      if (!c) throw new Error();
      const pair = await c.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: bits,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"],
      );
      setPub(pem("PUBLIC KEY", await c.exportKey("spki", pair.publicKey)));
      setPriv(pem("PRIVATE KEY", await c.exportKey("pkcs8", pair.privateKey)));
    } catch {
      setError("RSA key generation is unavailable in this browser.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <KeyRound />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">RSA Key Pair</h2>
          <p className="tool-header__subtitle">Generate an RSA-OAEP key pair locally.</p>
        </div>
        <div className="tool-header__actions">
          <Button
            size="sm"
            className="tool-btn tool-btn--primary"
            disabled={busy}
            onClick={() => void generate()}
          >
            <RefreshCw />
            {busy ? "Generating" : "Generate"}
          </Button>
        </div>
      </div>
      <output className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}>
        {error ?? ""}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[20rem_1fr]">
        <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <p className="m-0 font-mono text-[11px] tracking-[.15em] text-[var(--on-faint)]">
            ALGORITHM + SIZE
          </p>
          <label className="grid gap-1 text-xs text-[var(--on-muted)]">
            Algorithm
            <input
              value="RSA-OAEP / SHA-256"
              readOnly
              className="h-9 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-3 font-mono text-xs"
            />
          </label>
          <label className="grid gap-1 text-xs text-[var(--on-muted)]">
            Modulus bits
            <select
              value={bits}
              onChange={(e) => setBits(Number(e.target.value))}
              className="h-9 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-3"
            >
              <option value="2048">2048</option>
              <option value="3072">3072</option>
              <option value="4096">4096</option>
            </select>
          </label>
          <Button onClick={() => void generate()} disabled={busy}>
            Generate Key Pair
          </Button>
          <p className="m-0 text-[11px] text-[var(--on-faint)]">
            Private key remains in this page until you copy it. Store it securely.
          </p>
        </div>
        <section className="grid gap-3">
          <Pem title="Public key" value={pub} />
          <Pem title="Private key" value={priv} />
        </section>
      </section>
    </>
  );
}
function Pem({ title, value }: { title: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <section className="rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-4">
      <div className="flex justify-between">
        <h3 className="m-0 text-sm font-semibold">{title}</h3>
        <Button
          size="sm"
          disabled={!value}
          onClick={() => void copyText(value).then((r) => setDone(r.ok))}
        >
          <Copy />
          {done ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-[var(--bg-elevated)] p-3 text-xs">
        {value || "Generate a key pair to see it here."}
      </pre>
    </section>
  );
}
