import { Button } from "@/components/ui/button";
import { useShaHash } from "@/hooks/useShaHash";
import { copyText } from "@/lib/clipboard";
import { SHA_HASH_MAX_INPUT_CHARS, type ShaHashEncoding } from "@kitland/core";
import {
  CircleAlert,
  CircleCheck,
  Copy,
  Eraser,
  FileInput,
  Hash,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE = "hello world";
const COPY_CONFIRMATION_MS = 900;
const ENCODINGS: readonly { value: ShaHashEncoding; label: string }[] = [
  { value: "hex", label: "Hex" },
  { value: "base64", label: "Base64" },
  { value: "base64url", label: "Base64URL" },
];

/** SHA-256 digest screen, intentionally restricted to the reviewed SHA-256 contract. */
export function ShaHashTool() {
  const headingId = useId();
  const inputId = useId();
  const outputId = useId();
  const feedbackId = useId();
  const copyTimer = useRef<number | undefined>(undefined);
  const { result, sourceLength, isHashing, hash, clear } = useShaHash();
  const [input, setInput] = useState(SAMPLE);
  const [encoding, setEncoding] = useState<ShaHashEncoding>("hex");
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const resetFeedback = useCallback(() => {
    setCopied(false);
    setFeedback(null);
  }, []);

  const onHash = useCallback(async () => {
    resetFeedback();
    await hash(input, encoding);
  }, [encoding, hash, input, resetFeedback]);

  const onSample = useCallback(() => {
    clear();
    setInput(SAMPLE);
    setEncoding("hex");
    resetFeedback();
  }, [clear, resetFeedback]);

  const onClear = useCallback(() => {
    clear();
    setInput("");
    resetFeedback();
  }, [clear, resetFeedback]);

  const digest = result?.ok ? result.value : null;
  const resultError = result && !result.ok ? result.error.message : null;
  const inputError =
    input.length > SHA_HASH_MAX_INPUT_CHARS
      ? `Input exceeds ${SHA_HASH_MAX_INPUT_CHARS.toLocaleString()} characters.`
      : null;
  const error = feedback ?? inputError ?? resultError;

  const onCopy = useCallback(async () => {
    if (!digest) return;
    const copyResult = await copyText(digest.digest);
    if (!copyResult.ok) {
      setFeedback(copyResult.message);
      return;
    }
    setCopied(true);
    setFeedback(null);
    if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => {
      setCopied(false);
      copyTimer.current = undefined;
    }, COPY_CONFIRMATION_MS);
  }, [digest]);

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <Hash />
        </div>
        <div className="tool-header__texts">
          <h2 id={headingId} className="tool-header__title">
            Hash (SHA)
          </h2>
          <p className="tool-header__subtitle">Generate SHA-256 hashes locally.</p>
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
            onClick={() => void onHash()}
            disabled={isHashing || Boolean(inputError)}
          >
            {isHashing ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            {isHashing ? "Hashing" : "Hash"}
          </Button>
        </div>
      </div>

      <output
        id={feedbackId}
        className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        role={error ? "alert" : undefined}
        aria-live={error ? "assertive" : "polite"}
      >
        {error ?? ""}
      </output>
      <output className="sr-only" aria-live="polite">
        {copied ? "Digest copied to clipboard." : ""}
      </output>

      <section
        className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[minmax(17rem,18.75rem)_minmax(0,1fr)]"
        aria-labelledby={headingId}
      >
        <form
          className="flex flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]"
          onSubmit={(event) => {
            event.preventDefault();
            void onHash();
          }}
        >
          <p className="m-0 font-mono text-[11px] tracking-[0.15em] text-[var(--on-faint)]">
            ALGORITHM + INPUT
          </p>
          <label
            className="grid gap-1.5 text-xs text-[var(--on-muted)]"
            htmlFor={`${inputId}-algorithm`}
          >
            Algorithm
            <input
              id={`${inputId}-algorithm`}
              className="h-8 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-3 font-mono text-sm text-[var(--on-surface)]"
              value="SHA-256"
              readOnly
              aria-readonly="true"
            />
          </label>
          <label className="grid gap-1.5 text-xs text-[var(--on-muted)]" htmlFor={inputId}>
            Input
            <Textarea
              id={inputId}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                resetFeedback();
              }}
              maxLength={SHA_HASH_MAX_INPUT_CHARS + 1}
              className="min-h-36 resize-y font-mono text-sm"
              aria-describedby={error ? feedbackId : undefined}
            />
          </label>
          <label
            className="grid gap-1.5 text-xs text-[var(--on-muted)]"
            htmlFor={`${inputId}-encoding`}
          >
            Encoding
            <select
              id={`${inputId}-encoding`}
              value={encoding}
              onChange={(event) => {
                setEncoding(event.target.value as ShaHashEncoding);
                resetFeedback();
              }}
              className="h-8 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-3 font-mono text-sm text-[var(--on-surface)]"
            >
              {ENCODINGS.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="submit"
            className="mt-1 h-[38px] w-full gap-2"
            disabled={isHashing || Boolean(inputError)}
          >
            {isHashing ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Hash aria-hidden="true" />
            )}
            {isHashing ? "Hashing" : "Hash It"}
          </Button>
          <p className="m-0 text-[11px] leading-[1.4] text-[var(--on-faint)]">
            One-way SHA-256 digest. Your input stays in this browser.
          </p>
        </form>

        <section
          className="flex min-h-[22rem] flex-col gap-[14px] rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-5"
          aria-labelledby={outputId}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 id={outputId} className="m-0 text-base font-semibold text-[var(--on-surface)]">
                SHA-256 Digest
              </h3>
              <p className="m-0 mt-0.5 text-xs text-[var(--on-muted)]">
                {digest
                  ? `${digest.encoding}-encoded · ${digest.digest.length} chars`
                  : "Hash input to see the digest."}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 min-w-[78px] gap-1.5"
              onClick={() => void onCopy()}
              disabled={!digest}
              aria-label={copied ? "Digest copied" : "Copy SHA-256 digest"}
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
                No digest yet. Enter text and choose Hash It.
              </p>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between gap-3 rounded-[10px] border border-[var(--outline)] bg-[var(--bg-elevated)] px-4 py-3 text-xs text-[var(--on-muted)]">
            <span className="flex items-center gap-1.5">
              {digest ? (
                <CircleCheck className="size-3.5 text-emerald-400" aria-hidden="true" />
              ) : (
                <CircleAlert className="size-3.5" aria-hidden="true" />
              )}
              {digest ? "Hashed" : "Ready"}
            </span>
            <span className="font-mono">
              {digest
                ? `${sourceLength ?? 0} chars · ${digest.digestBytes} bytes · SHA-256`
                : "Local only"}
            </span>
          </div>
        </section>
      </section>
    </>
  );
}
