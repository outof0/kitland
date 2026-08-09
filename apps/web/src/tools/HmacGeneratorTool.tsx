import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useHmac } from "@/hooks/useHmac";
import { copyText } from "@/lib/clipboard";
import { HMAC_MAX_MESSAGE_CHARS, HMAC_MAX_SECRET_CHARS } from "@kitland/core";
import {
  CircleCheck,
  Copy,
  Eraser,
  FileInput,
  KeyRound,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const SAMPLE_SECRET = "s3cr3t-k3y";
const SAMPLE_MESSAGE = "hello world";

/** HMAC-SHA-256 screen. Secrets live only in component memory and are never persisted. */
export function HmacGeneratorTool() {
  const headingId = useId();
  const secretId = useId();
  const messageId = useId();
  const outputId = useId();
  const timer = useRef<number | undefined>(undefined);
  const { result, isSigning, sign, clear } = useHmac();
  const [secret, setSecret] = useState(SAMPLE_SECRET);
  const [message, setMessage] = useState(SAMPLE_MESSAGE);
  const [copied, setCopied] = useState(false);
  const digest = result?.ok ? result.value : null;
  const error = result && !result.ok ? result.error.message : null;
  const tooLarge = secret.length > HMAC_MAX_SECRET_CHARS || message.length > HMAC_MAX_MESSAGE_CHARS;
  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    },
    [],
  );
  const resetCopy = useCallback(() => setCopied(false), []);
  const onSign = useCallback(() => {
    resetCopy();
    void sign(secret, message);
  }, [message, resetCopy, secret, sign]);
  const onSample = useCallback(() => {
    clear();
    setSecret(SAMPLE_SECRET);
    setMessage(SAMPLE_MESSAGE);
    resetCopy();
  }, [clear, resetCopy]);
  const onClear = useCallback(() => {
    clear();
    setSecret("");
    setMessage("");
    resetCopy();
  }, [clear, resetCopy]);
  const onCopy = useCallback(async () => {
    if (!digest) return;
    if (!(await copyText(digest.digest)).ok) return;
    setCopied(true);
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 900);
  }, [digest]);
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <KeyRound />
        </div>
        <div className="tool-header__texts">
          <h2 id={headingId} className="tool-header__title">
            HMAC Generator
          </h2>
          <p className="tool-header__subtitle">Generate HMAC-SHA-256 signatures locally.</p>
        </div>
        <div className="tool-header__actions">
          <Button type="button" variant="ghost" size="sm" className="tool-btn" onClick={onSample}>
            <FileInput aria-hidden="true" />
            Sample
          </Button>
          <Button type="button" variant="ghost" size="sm" className="tool-btn" onClick={onClear}>
            <Eraser aria-hidden="true" />
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            className="tool-btn tool-btn--primary"
            onClick={onSign}
            disabled={isSigning || tooLarge}
          >
            {isSigning ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            {isSigning ? "Signing" : "Sign"}
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
        className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[minmax(17rem,18.75rem)_minmax(0,1fr)]"
        aria-labelledby={headingId}
      >
        <form
          className="flex flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]"
          onSubmit={(event) => {
            event.preventDefault();
            onSign();
          }}
        >
          <p className="m-0 font-mono text-[11px] tracking-[0.15em] text-[var(--on-faint)]">
            KEY + MESSAGE
          </p>
          <label className="grid gap-1.5 text-xs text-[var(--on-muted)]">
            Algorithm
            <input
              value="HMAC-SHA-256"
              readOnly
              className="h-8 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-3 font-mono text-sm text-[var(--on-surface)]"
            />
          </label>
          <label className="grid gap-1.5 text-xs text-[var(--on-muted)]" htmlFor={secretId}>
            Secret
            <textarea
              id={secretId}
              value={secret}
              onChange={(event) => {
                setSecret(event.target.value);
                resetCopy();
              }}
              maxLength={HMAC_MAX_SECRET_CHARS + 1}
              className="min-h-20 rounded-lg border border-[var(--outline)] bg-[var(--surface)] p-2 font-mono text-sm text-[var(--on-surface)]"
            />
          </label>
          <label className="grid gap-1.5 text-xs text-[var(--on-muted)]" htmlFor={messageId}>
            Message
            <Textarea
              id={messageId}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                resetCopy();
              }}
              maxLength={HMAC_MAX_MESSAGE_CHARS + 1}
              className="min-h-28 font-mono text-sm"
            />
          </label>
          <Button type="submit" className="h-[38px] w-full gap-2" disabled={isSigning || tooLarge}>
            {isSigning ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound aria-hidden="true" />
            )}
            {isSigning ? "Signing" : "Compute HMAC"}
          </Button>
          <p className="m-0 text-[11px] leading-[1.4] text-[var(--on-faint)]">
            Keyed hash; only key holders can verify. Secret is not saved.
          </p>
        </form>
        <section
          className="flex min-h-[22rem] flex-col gap-[14px] rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-5"
          aria-labelledby={outputId}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 id={outputId} className="m-0 text-base font-semibold text-[var(--on-surface)]">
                HMAC SHA-256
              </h3>
              <p className="m-0 mt-0.5 text-xs text-[var(--on-muted)]">
                {digest ? "hex-encoded · 64 chars" : "Compute a signature to see it here."}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 min-w-[78px] gap-1.5"
              disabled={!digest}
              onClick={() => void onCopy()}
            >
              {copied ? <CircleCheck aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="min-h-36 rounded-xl bg-[var(--bg-elevated)] p-[18px]">
            {digest ? (
              <code className="block break-all font-mono text-base leading-[1.6] font-semibold text-[var(--on-surface)]">
                {digest.digest}
              </code>
            ) : (
              <p className="m-0 text-sm leading-6 text-[var(--on-muted)]">
                No signature yet. Enter a secret and message.
              </p>
            )}
          </div>
          <p className="mt-auto m-0 font-mono text-xs text-[var(--on-faint)]">
            Keyed digest · verifiable with the same key · local only
          </p>
        </section>
      </section>
    </>
  );
}
