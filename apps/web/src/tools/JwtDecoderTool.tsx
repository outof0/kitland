import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { inspectJwt } from "@kitland/core";
import { BadgeInfo, FileInput, KeyRound, ShieldAlert } from "lucide-react";
import { useId, useState } from "react";

const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE1MTYyMzkwMjJ9.signature";
export function JwtDecoderTool() {
  const heading = useId(),
    tokenId = useId();
  const [token, setToken] = useState(SAMPLE);
  const result = inspectJwt(token);
  const error = result.ok ? null : result.error.message;
  const inspection = result.ok ? result.value : null;
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <KeyRound />
        </div>
        <div className="tool-header__texts">
          <h2 id={heading} className="tool-header__title">
            JWT Decoder
          </h2>
          <p className="tool-header__subtitle">Inspect JWT header and claims locally.</p>
        </div>
        <div className="tool-header__actions">
          <Button variant="ghost" size="sm" className="tool-btn" onClick={() => setToken(SAMPLE)}>
            <FileInput />
            Sample
          </Button>
        </div>
      </div>
      <p className="tool-field-note">
        <ShieldAlert className="mr-1 inline size-3.5" />
        Decoded data is not signature verification. Do not trust claims without verifying the JWT.
      </p>
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
          <p className="m-0 font-mono text-[11px] tracking-[.15em] text-[var(--on-faint)]">TOKEN</p>
          <label className="grid gap-1 text-xs text-[var(--on-muted)]" htmlFor={tokenId}>
            JWT
            <Textarea
              id={tokenId}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="min-h-64 font-mono text-xs"
            />
          </label>
          <p className="m-0 text-[11px] text-[var(--on-faint)]">
            Header and payload are Base64URL-decoded entirely in this browser.
          </p>
        </div>
        <section className="grid min-h-[22rem] gap-3 lg:grid-cols-2">
          <JsonCard title="Header" value={inspection?.header} />
          <JsonCard title="Payload" value={inspection?.payload} />
          <div className="lg:col-span-2 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-4">
            <p className="m-0 flex items-center gap-1.5 text-sm text-amber-300">
              <BadgeInfo className="size-4" />
              Signature verification unavailable
            </p>
            <p className="mb-0 text-xs text-[var(--on-muted)]">
              Signature: {inspection?.signature ? "present" : "empty"}. This tool only decodes;
              supply a trusted verification key in a verifier.
            </p>
          </div>
        </section>
      </section>
    </>
  );
}
function JsonCard({ title, value }: { title: string; value: Record<string, unknown> | undefined }) {
  return (
    <section className="rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-4">
      <h3 className="m-0 text-sm font-semibold">{title}</h3>
      <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-[var(--on-muted)]">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </section>
  );
}
