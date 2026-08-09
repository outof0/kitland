import { Button } from "@/components/ui/button";
import {
  BCRYPT_MAX_INPUT_BYTES,
  BCRYPT_MAX_COST,
  BCRYPT_MIN_COST,
  validateBcryptRequest,
} from "@kitland/core";
import { compare, hash } from "bcryptjs";
import { CircleCheck, Copy, FileInput, LockKeyhole, ShieldCheck } from "lucide-react";
import { useId, useState } from "react";
import { copyText } from "@/lib/clipboard";

const SAMPLE = "correct horse battery staple";
export function BcryptHashTool() {
  const heading = useId(),
    passwordId = useId(),
    hashId = useId();
  const [password, setPassword] = useState(SAMPLE),
    [cost, setCost] = useState(10),
    [stored, setStored] = useState(""),
    [output, setOutput] = useState(""),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [verified, setVerified] = useState<boolean | null>(null),
    [copied, setCopied] = useState(false);
  const generate = async () => {
    const v = validateBcryptRequest(password, cost);
    if (!v.ok) {
      setError(v.error.message);
      return;
    }
    setBusy(true);
    setError(null);
    setVerified(null);
    try {
      const next = await hash(password, cost);
      setStored(next);
      setOutput(next);
    } catch {
      setError("bcrypt could not run in this browser.");
    } finally {
      setBusy(false);
    }
  };
  const verify = async () => {
    if (!stored) {
      setError("Enter a bcrypt hash to verify.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setVerified(await compare(password, stored));
    } catch {
      setError("The supplied bcrypt hash is invalid.");
    } finally {
      setBusy(false);
    }
  };
  const onCopy = async () => {
    if (!output) return;
    const r = await copyText(output);
    setCopied(r.ok);
    if (!r.ok) setError(r.message);
  };
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <LockKeyhole />
        </div>
        <div className="tool-header__texts">
          <h2 id={heading} className="tool-header__title">
            Bcrypt Hash
          </h2>
          <p className="tool-header__subtitle">Create and verify bcrypt password hashes locally.</p>
        </div>
        <div className="tool-header__actions">
          <Button
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setPassword(SAMPLE);
              setCost(10);
              setStored("");
              setOutput("");
              setVerified(null);
              setError(null);
            }}
          >
            <FileInput />
            Sample
          </Button>
          <Button
            size="sm"
            className="tool-btn tool-btn--primary"
            disabled={busy}
            onClick={() => void generate()}
          >
            <ShieldCheck />
            {busy ? "Working" : "Hash"}
          </Button>
        </div>
      </div>
      <output
        className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        role={error ? "alert" : undefined}
      >
        {error ?? ""}
      </output>
      <section
        className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)]"
        aria-labelledby={heading}
      >
        <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <p className="m-0 font-mono text-[11px] tracking-[.15em] text-[var(--on-faint)]">
            PASSWORD + COST
          </p>
          <label className="grid gap-1 text-xs text-[var(--on-muted)]" htmlFor={passwordId}>
            Password
            <input
              id={passwordId}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-3 font-mono text-sm text-[var(--on-surface)]"
            />
          </label>
          <label className="grid gap-1 text-xs text-[var(--on-muted)]">
            Cost{" "}
            <input
              type="number"
              min={BCRYPT_MIN_COST}
              max={BCRYPT_MAX_COST}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="h-9 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-3 font-mono text-sm text-[var(--on-surface)]"
            />
          </label>
          <Button onClick={() => void generate()} disabled={busy} className="h-9">
            Hash Password
          </Button>
          <p className="m-0 text-[11px] text-[var(--on-faint)]">
            Maximum {BCRYPT_MAX_INPUT_BYTES} UTF-8 bytes. Cost 10 is the default local balance.
          </p>
        </div>
        <section className="flex min-h-[22rem] flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-5">
          <div className="flex justify-between gap-3">
            <div>
              <h3 className="m-0 text-base font-semibold">bcrypt result</h3>
              <p className="m-0 text-xs text-[var(--on-muted)]">Salt included · one-way</p>
            </div>
            <Button size="sm" disabled={!output} onClick={() => void onCopy()}>
              <Copy />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <textarea
            id={hashId}
            aria-label="Bcrypt hash"
            value={stored}
            onChange={(e) => {
              setStored(e.target.value);
              setOutput(e.target.value);
              setVerified(null);
            }}
            placeholder="Generated hash appears here; paste a hash to verify."
            className="min-h-28 w-full rounded-xl bg-[var(--bg-elevated)] p-4 font-mono text-xs text-[var(--on-surface)]"
          />
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => void verify()} disabled={busy || !stored}>
              Verify password
            </Button>
            {verified !== null && (
              <span className={verified ? "text-sm text-emerald-400" : "text-sm text-rose-400"}>
                {verified ? (
                  <>
                    <CircleCheck className="inline size-4" /> Match
                  </>
                ) : (
                  "Does not match"
                )}
              </span>
            )}
          </div>
        </section>
      </section>
    </>
  );
}
