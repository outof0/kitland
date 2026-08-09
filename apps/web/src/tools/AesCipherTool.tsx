import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { decryptAesGcm, encryptAesGcm, type AesGcmHost, type ToolResult } from "@kitland/core";
import { Copy, FileInput, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { useId, useState } from "react";
import { copyText } from "@/lib/clipboard";

const KEY = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const NONCE = "101112131415161718191a1b";
const host: AesGcmHost = {
  async encrypt(key, nonce, text) {
    const c = globalThis.crypto?.subtle;
    if (!c) throw new Error();
    const k = await c.importKey("raw", copy(key), { name: "AES-GCM" }, false, ["encrypt"]);
    return new Uint8Array(await c.encrypt({ name: "AES-GCM", iv: copy(nonce) }, k, copy(text)));
  },
  async decrypt(key, nonce, sealed) {
    const c = globalThis.crypto?.subtle;
    if (!c) throw new Error();
    const k = await c.importKey("raw", copy(key), { name: "AES-GCM" }, false, ["decrypt"]);
    return new Uint8Array(await c.decrypt({ name: "AES-GCM", iv: copy(nonce) }, k, copy(sealed)));
  },
};
function copy(input: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(input.length);
  out.set(input);
  return out;
}
export function AesCipherTool() {
  const title = useId(),
    keyId = useId(),
    nonceId = useId(),
    textId = useId();
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt"),
    [key, setKey] = useState(KEY),
    [nonce, setNonce] = useState(NONCE),
    [input, setInput] = useState("Attack at dawn."),
    [result, setResult] = useState<ToolResult<string> | null>(null),
    [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false);
  const run = async () => {
    setBusy(true);
    setCopied(false);
    const next =
      mode === "encrypt"
        ? await encryptAesGcm(key, nonce, input, host)
        : await decryptAesGcm(key, input, host);
    setResult(next);
    setBusy(false);
  };
  const output = result?.ok ? result.value : "";
  const error = result && !result.ok ? result.error.message : null;
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <LockKeyhole />
        </div>
        <div className="tool-header__texts">
          <h2 id={title} className="tool-header__title">
            AES Cipher
          </h2>
          <p className="tool-header__subtitle">
            Encrypt &amp; decrypt with authenticated AES-256-GCM.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setMode("encrypt");
              setKey(KEY);
              setNonce(NONCE);
              setInput("Attack at dawn.");
              setResult(null);
            }}
          >
            <FileInput />
            Sample
          </Button>
          <Button
            size="sm"
            className="tool-btn tool-btn--primary"
            disabled={busy}
            onClick={() => void run()}
          >
            {mode === "encrypt" ? <LockKeyhole /> : <UnlockKeyhole />}
            {busy ? "Working" : mode === "encrypt" ? "Encrypt" : "Decrypt"}
          </Button>
        </div>
      </div>
      <div className="tool-options">
        <Button
          variant="ghost"
          size="sm"
          className={
            mode === "encrypt" ? "tool-mode__seg tool-mode__seg--active" : "tool-mode__seg"
          }
          onClick={() => setMode("encrypt")}
        >
          Encrypt
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={
            mode === "decrypt" ? "tool-mode__seg tool-mode__seg--active" : "tool-mode__seg"
          }
          onClick={() => setMode("decrypt")}
        >
          Decrypt
        </Button>
      </div>
      <output
        className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        role={error ? "alert" : undefined}
      >
        {error ?? ""}
      </output>
      <section
        className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[minmax(17rem,21.25rem)_minmax(0,1fr)]"
        aria-labelledby={title}
      >
        <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <p className="m-0 font-mono text-[11px] tracking-[.15em] text-[var(--on-faint)]">
            MODE + KEY + NONCE
          </p>
          <label className="grid gap-1 text-xs text-[var(--on-muted)]" htmlFor={keyId}>
            Key — 32-byte hex
            <input
              id={keyId}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="h-8 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-2 font-mono text-xs text-[var(--on-surface)]"
            />
          </label>
          {mode === "encrypt" && (
            <label className="grid gap-1 text-xs text-[var(--on-muted)]" htmlFor={nonceId}>
              Nonce — 12-byte hex
              <input
                id={nonceId}
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                className="h-8 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-2 font-mono text-xs text-[var(--on-surface)]"
              />
            </label>
          )}
          <label className="grid gap-1 text-xs text-[var(--on-muted)]" htmlFor={textId}>
            {mode === "encrypt" ? "Message" : "Ciphertext packet"}
            <Textarea
              id={textId}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-32 font-mono text-sm"
            />
          </label>
          <Button onClick={() => void run()} disabled={busy} className="h-9">
            {mode === "encrypt" ? "Encrypt" : "Decrypt"}
          </Button>
          <p className="m-0 text-[11px] text-[var(--on-faint)]">
            Packet includes nonce. Never share the key.
          </p>
        </div>
        <section className="flex min-h-[22rem] flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-5">
          <div className="flex justify-between gap-3">
            <div>
              <h3 className="m-0 text-base font-semibold">
                {mode === "encrypt" ? "Ciphertext" : "Plaintext"}
              </h3>
              <p className="m-0 text-xs text-[var(--on-muted)]">AES-256-GCM · authenticated</p>
            </div>
            <Button
              size="sm"
              disabled={!output}
              onClick={() => void copyText(output).then((x) => setCopied(x.ok))}
            >
              <Copy />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="min-h-36 rounded-xl bg-[var(--bg-elevated)] p-4">
            <code className="block break-all font-mono text-sm text-[var(--on-surface)]">
              {output || "Run the operation to see the result."}
            </code>
          </div>
          <p className="mt-auto m-0 text-xs text-[var(--on-faint)]">
            v1 packet · nonce included · local only
          </p>
        </section>
      </section>
    </>
  );
}
