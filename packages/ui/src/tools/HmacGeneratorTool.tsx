import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { createWebCryptoHostRuntime, signHmacSha256 } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { CircleCheck, FileInput, Key, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  FieldLabel,
  FormPanel,
  ResultCard,
  ResultHead,
  ResultPanel,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

const SAMPLE_SECRET = "s3cr3t-k3y";
const SAMPLE_MESSAGE = "hello world";
const DEBOUNCE_MS = 150;

export type HmacGeneratorToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/**
 * HMAC Generator tool.
 */
export function HmacGeneratorTool({
  initialInput,
  capabilities: _capabilities = LOCAL_ONLY_CAPABILITIES,
}: HmacGeneratorToolProps = {}) {
  void _capabilities;
  const secretId = useId();
  const messageId = useId();
  const [secret, setSecret] = useState(SAMPLE_SECRET);
  const [message, setMessage] = useState(initialInput ?? SAMPLE_MESSAGE);

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setMessage(initialInput);
    }
  }, [initialInput]);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { isCopied, copy } = useCopyFeedback();
  const hmacGenRef = useRef(0);

  const computeHmac = useCallback(async (sec: string, msg: string) => {
    const gen = hmacGenRef.current + 1;
    hmacGenRef.current = gen;
    if (!sec || !msg) {
      if (gen !== hmacGenRef.current) return;
      setSignature("");
      setError(null);
      return;
    }
    setBusy(true);
    try {
      const runtime = createWebCryptoHostRuntime(globalThis.crypto);
      const res = await signHmacSha256(sec, msg, runtime.hmacSha256);
      if (gen !== hashGenRefOrLocal(hmacGenRef)) return;
      if (res.ok) {
        setSignature(res.value.digest);
        setError(null);
      } else {
        setError(res.error.message);
      }
    } catch (err) {
      if (gen !== hmacGenRef.current) return;
      setError(err instanceof Error ? err.message : "HMAC calculation failed.");
    } finally {
      if (gen === hmacGenRef.current) setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!secret || !message) {
      setSignature("");
      setError(null);
      return;
    }
    const timer = setTimeout(() => {
      void computeHmac(secret, message);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [secret, message, computeHmac]);

  const onSample = useCallback(() => {
    setSecret(SAMPLE_SECRET);
    setMessage(SAMPLE_MESSAGE);
  }, []);

  const onClear = useCallback(() => {
    setSecret("");
    setMessage("");
    setSignature("");
    setError(null);
  }, []);

  const messageBytes = new TextEncoder().encode(message).length;
  const statusLabel = busy ? "Signing" : error ? "Error" : signature ? "Signed" : "Ready";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <ToolHeader
        icon={Key}
        title="HMAC Generator"
        subtitle="Generate HMAC signatures"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSample}
              className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[8px] border border-outline bg-surface-low px-3 text-[13px] font-semibold text-on-surface transition-colors hover:bg-surface hover:border-outline-strong"
            >
              <FileInput className="size-[15px] text-on-muted" />
              <span>Sample</span>
            </button>
            <button
              type="button"
              onClick={onClear}
              className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[8px] border border-outline bg-surface-low px-3 text-[13px] font-semibold text-on-muted transition-colors hover:bg-surface hover:text-on-surface"
            >
              <Trash2 className="size-[15px] text-on-muted" />
              <span>Clear</span>
            </button>
          </div>
        }
      />

      {/* Main Workspace */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {/* Form Panel */}
        <FormPanel width={300}>
          <FieldLabel>SECRET + MESSAGE</FieldLabel>

          {/* Algorithm indicator */}
          <div className="box-border flex h-[32px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3">
            <span className="text-[13px] font-normal text-on-muted">Algorithm</span>
            <span className="font-mono text-[12px] text-on-surface">HMAC-SHA256</span>
          </div>

          {/* Secret Key input */}
          <div className="box-border flex h-[36px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <label
              htmlFor={secretId}
              className="shrink-0 cursor-pointer text-[13px] font-normal text-on-muted"
            >
              Secret
            </label>
            <input
              id={secretId}
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="secret key"
              spellCheck={false}
              className="w-full bg-transparent text-right font-mono text-[12px] text-on-surface outline-none placeholder:text-on-faint"
            />
          </div>

          {/* Message input */}
          <div className="box-border flex w-full flex-col rounded-[10px] border border-outline bg-surface p-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <label
              htmlFor={messageId}
              className="mb-1 text-[11px] font-mono uppercase tracking-wider text-on-faint"
            >
              Message
            </label>
            <textarea
              id={messageId}
              aria-label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message to sign..."
              rows={5}
              spellCheck={false}
              className="w-full resize-none bg-transparent font-mono text-[12px] leading-relaxed text-on-surface outline-none placeholder:text-on-faint"
            />
          </div>

          <p className="m-0 text-[11px] leading-relaxed text-on-faint">
            Keyed-hash message authentication code (256-bit).
          </p>
        </FormPanel>

        {/* Result Panel */}
        <ResultPanel>
          <ResultHead
            title="HMAC-SHA256 Signature"
            subtitle={`Hex-encoded · ${signature ? signature.length : 64} chars`}
            onCopy={() => void copy("signature", signature)}
            copied={isCopied("signature")}
          />

          <ResultCard>
            {error ? (
              <div className="font-mono text-[13px] text-error" role="alert">
                {error}
              </div>
            ) : signature ? (
              <code className="select-all break-all font-mono text-[18px] font-semibold leading-snug text-on-surface lg:text-[22px]">
                {signature}
              </code>
            ) : (
              <div className="font-mono text-[13px] italic text-on-faint">
                {busy ? "Computing signature..." : "No signature yet. Enter key and message to generate HMAC."}
              </div>
            )}
            <div className="select-none font-mono text-[12px] text-on-faint">
              {signature ? `Length ${signature.length} • 256-bit digest` : "256-bit keyed hash"}
            </div>
          </ResultCard>
        </ResultPanel>
      </div>

      {/* Status Bar */}
      <StatusBar
        label="HMAC status"
        chip={{ icon: CircleCheck, text: statusLabel }}
        stats={[`${messageBytes} bytes msg`, `${secret.length} chars key`, "HMAC-SHA256"]}
        lang="HMAC"
      />
    </div>
  );
}

function hashGenRefOrLocal(ref: { current: number }) {
  return ref.current;
}
