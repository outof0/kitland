import { useCopyFeedback } from "../hooks/useCopyFeedback";
import {
  AES_CIPHER_MAX_INPUT_CHARS,
  createWebCryptoHostRuntime,
  decryptAesGcm,
  encryptAesGcm,
} from "@kitland/core";
import { CircleCheck, FileInput, Info, Lock, RefreshCw, Unlock } from "lucide-react";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { useCallback, useEffect, useId, useState } from "react";
import {
  FieldLabel,
  FormPanel,
  ResultCard,
  ResultHead,
  ResultPanel,
  Segmented,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

const SAMPLE_KEY = "8f3b9c7a2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90";
const SAMPLE_NONCE = "00112233445566778899aabb";
const SAMPLE_MESSAGE = "Attack at dawn.";

export type AesCipherMode = "encrypt" | "decrypt";

export type AesCipherToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/**
 * AES Cipher Tool matching design.pen frame `zes65` (AES Cipher).
 */
export function AesCipherTool({
  initialInput,
  capabilities: _capabilities = LOCAL_ONLY_CAPABILITIES,
}: AesCipherToolProps = {}) {
  void _capabilities;
  const messageId = useId();
  const keyId = useId();
  const nonceId = useId();
  const [mode, setMode] = useState<AesCipherMode>("encrypt");
  const [keyHex, setKeyHex] = useState(SAMPLE_KEY);
  const [nonceHex, setNonceHex] = useState(SAMPLE_NONCE);
  const [message, setMessage] = useState(initialInput ?? SAMPLE_MESSAGE);

  useEffect(() => {
    if (initialInput !== undefined && initialInput !== "") {
      setMessage(initialInput);
    }
  }, [initialInput]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    { ok: true; value: string } | { ok: false; error: { message: string } } | null
  >(null);
  const { isCopied, copy } = useCopyFeedback();

  // Run encryption/decryption
  useEffect(() => {
    let active = true;
    if (!message.trim() || !keyHex.trim()) {
      setResult(null);
      return;
    }
    if (keyHex.length !== 64 || !/^[0-9a-fA-F]+$/.test(keyHex)) {
      setResult({
        ok: false,
        error: { message: "Key must be exactly 64 hexadecimal characters (32 bytes / 256-bit)." },
      });
      return;
    }
    if (mode === "encrypt" && (nonceHex.length !== 24 || !/^[0-9a-fA-F]+$/.test(nonceHex))) {
      setResult({
        ok: false,
        error: { message: "Nonce must be exactly 24 hexadecimal characters (12 bytes)." },
      });
      return;
    }
    if (message.length > AES_CIPHER_MAX_INPUT_CHARS) {
      setResult({
        ok: false,
        error: {
          message: `Message exceeds ${AES_CIPHER_MAX_INPUT_CHARS.toLocaleString()} characters.`,
        },
      });
      return;
    }

    setBusy(true);
    const run = async () => {
      try {
        const runtime = createWebCryptoHostRuntime(globalThis.crypto);
        if (mode === "encrypt") {
          const res = await encryptAesGcm(keyHex, nonceHex, message, runtime.aes);
          if (!active) return;
          if (res.ok) {
            setResult({ ok: true, value: res.value });
          } else {
            setResult({ ok: false, error: { message: res.error.message } });
          }
        } else {
          const res = await decryptAesGcm(keyHex, message.trim(), runtime.aes);
          if (!active) return;
          if (res.ok) {
            setResult({ ok: true, value: res.value });
          } else {
            setResult({ ok: false, error: { message: res.error.message } });
          }
        }
      } catch (err) {
        if (!active) return;
        setResult({
          ok: false,
          error: { message: err instanceof Error ? err.message : "Cipher operation failed." },
        });
      } finally {
        if (active) setBusy(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [mode, keyHex, nonceHex, message]);

  const generateRandomKey = useCallback(() => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    setKeyHex(
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    );
  }, []);

  const generateRandomNonce = useCallback(() => {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    setNonceHex(
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    );
  }, []);

  const onSample = useCallback(() => {
    setMode("encrypt");
    setKeyHex(SAMPLE_KEY);
    setNonceHex(SAMPLE_NONCE);
    setMessage(SAMPLE_MESSAGE);
  }, []);

  const statusLabel = busy
    ? mode === "encrypt"
      ? "Encrypting"
      : "Decrypting"
    : result?.ok
      ? mode === "encrypt"
        ? "Encrypted"
        : "Decrypted"
      : result && !result.ok
        ? "Error"
        : "Ready";

  const outputValue = result?.ok ? result.value : "";
  const errorMessage = result && !result.ok ? result.error.message : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <ToolHeader
        icon={mode === "encrypt" ? Lock : Unlock}
        title="AES Cipher"
        subtitle="Encrypt & decrypt with authenticated AES-256-GCM"
        actions={
          <button
            type="button"
            onClick={onSample}
            className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[8px] border border-outline bg-surface-low px-3 text-[13px] font-semibold text-on-surface transition-colors hover:bg-surface hover:border-outline-strong"
          >
            <FileInput className="size-[15px] text-on-muted" />
            <span>Sample</span>
          </button>
        }
      />

      {/* Main Workspace */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {/* Form Panel */}
        <FormPanel width={340}>
          <FieldLabel>MODE + KEY + NONCE</FieldLabel>

          {/* Mode Switcher */}
          <Segmented
            value={mode}
            onChange={(v) => setMode(v as AesCipherMode)}
            boxed
            options={[
              { value: "encrypt", label: "Encrypt" },
              { value: "decrypt", label: "Decrypt" },
            ]}
          />

          {/* Key Row */}
          <div className="box-border flex h-[36px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <label
              htmlFor={keyId}
              className="shrink-0 cursor-pointer text-[12px] font-normal text-on-muted"
            >
              Key (256-bit hex)
            </label>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 justify-end">
              <input
                id={keyId}
                type="text"
                value={keyHex}
                onChange={(e) => setKeyHex(e.target.value.trim())}
                placeholder="64 hex characters"
                spellCheck={false}
                className="w-full bg-transparent text-right font-mono text-[11px] text-on-surface outline-none placeholder:text-on-faint"
              />
              <button
                type="button"
                onClick={generateRandomKey}
                title="Generate random 256-bit key"
                aria-label="Generate random key"
                className="cursor-pointer text-primary transition-opacity hover:opacity-80"
              >
                <RefreshCw className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Nonce Row (in Encrypt Mode) */}
          {mode === "encrypt" ? (
            <div className="box-border flex h-[36px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
              <label
                htmlFor={nonceId}
                className="shrink-0 cursor-pointer text-[12px] font-normal text-on-muted"
              >
                Nonce / IV (96-bit)
              </label>
              <div className="flex min-w-0 flex-1 items-center gap-1.5 justify-end">
                <input
                  id={nonceId}
                  type="text"
                  value={nonceHex}
                  onChange={(e) => setNonceHex(e.target.value.trim())}
                  placeholder="24 hex characters"
                  spellCheck={false}
                  className="w-full bg-transparent text-right font-mono text-[11px] text-on-surface outline-none placeholder:text-on-faint"
                />
                <button
                  type="button"
                  onClick={generateRandomNonce}
                  title="Generate random 96-bit nonce"
                  aria-label="Generate random nonce"
                  className="cursor-pointer text-primary transition-opacity hover:opacity-80"
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Message Textarea */}
          <div className="box-border flex w-full flex-col rounded-[10px] border border-outline bg-surface p-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <label
              htmlFor={messageId}
              className="mb-1 text-[11px] font-mono uppercase tracking-wider text-on-faint"
            >
              {mode === "encrypt"
                ? "Plaintext Message"
                : "Ciphertext (nonce:tag:ciphertext or JSON)"}
            </label>
            <textarea
              id={messageId}
              aria-label="Message payload"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                mode === "encrypt" ? "Enter text to encrypt..." : "Paste ciphertext to decrypt..."
              }
              rows={5}
              spellCheck={false}
              className="w-full resize-none bg-transparent font-mono text-[12px] leading-relaxed text-on-surface outline-none placeholder:text-on-faint"
            />
          </div>

          <p className="m-0 text-[11px] leading-relaxed text-on-faint">
            Authenticated and symmetric; use a 256-bit key with 96-bit nonce.
          </p>
        </FormPanel>

        {/* Result Panel */}
        <ResultPanel>
          <ResultHead
            title={mode === "encrypt" ? "Ciphertext Output" : "Plaintext Result"}
            subtitle={
              outputValue
                ? `${mode === "encrypt" ? "AES-GCM Payload" : "Decrypted UTF-8"} • ${outputValue.length} chars`
                : "Awaiting input"
            }
            onCopy={() => void copy("output", outputValue)}
            copied={isCopied("output")}
          />

          <ResultCard>
            {errorMessage ? (
              <div className="font-mono text-[13px] text-error" role="alert">
                {errorMessage}
              </div>
            ) : outputValue ? (
              <code className="select-all break-all font-mono text-[15px] font-semibold leading-relaxed text-on-surface lg:text-[18px]">
                {outputValue}
              </code>
            ) : (
              <div className="font-mono text-[13px] italic text-on-faint">
                {busy ? "Processing..." : "Result will appear here..."}
              </div>
            )}
            <div className="select-none font-mono text-[12px] text-on-faint">
              AES-256-GCM • 128-bit authentication tag embedded
            </div>
          </ResultCard>

          {/* Tip Banner */}
          <div className="flex items-center gap-2.5 rounded-[10px] bg-primary-soft p-3 text-primary">
            <Info className="size-4 shrink-0" />
            <span className="text-[12px] leading-relaxed">
              Never reuse a nonce/IV with the same key in AES-GCM. A fresh random nonce is
              recommended for each message.
            </span>
          </div>
        </ResultPanel>
      </div>

      {/* Status Bar */}
      <StatusBar
        label="AES Cipher status"
        chip={{ icon: CircleCheck, text: statusLabel }}
        stats={[
          mode === "encrypt" ? "Encrypt" : "Decrypt",
          "AES-256-GCM",
          `${message.length} chars in`,
        ]}
        lang="AES"
      />
    </div>
  );
}
