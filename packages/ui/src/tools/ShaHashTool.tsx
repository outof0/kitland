import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { createWebCryptoHostRuntime, hashSha256, type ShaHashEncoding } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { CircleCheck, FileInput, Hash, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  FieldLabel,
  FormPanel,
  ResultCard,
  ResultHead,
  ResultPanel,
  RunButton,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

const SAMPLE_INPUT = "hello world";
const ENCODINGS: readonly ShaHashEncoding[] = ["hex", "base64", "base64url"];

export type ShaHashToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/**
 * Hash (SHA) tool.
 */
export function ShaHashTool({
  initialInput,
  capabilities: _capabilities = LOCAL_ONLY_CAPABILITIES,
}: ShaHashToolProps = {}) {
  void _capabilities;
  const inputId = useId();
  const encodingId = useId();
  const [input, setInput] = useState(initialInput ?? SAMPLE_INPUT);
  const [encoding, setEncoding] = useState<ShaHashEncoding>("hex");

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setInput(initialInput);
    }
  }, [initialInput]);
  const [digest, setDigest] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { isCopied, copy } = useCopyFeedback();
  const hashGenRef = useRef(0);

  const computeHash = useCallback(async (textToHash: string, enc: ShaHashEncoding) => {
    const gen = hashGenRef.current + 1;
    hashGenRef.current = gen;
    if (!textToHash) {
      if (gen !== hashGenRef.current) return;
      setDigest("");
      setError(null);
      return;
    }
    setBusy(true);
    try {
      const runtime = createWebCryptoHostRuntime(globalThis.crypto);
      const res = await hashSha256(textToHash, runtime.sha256, { encoding: enc });
      if (gen !== hashGenRef.current) return;
      if (res.ok) {
        setDigest(res.value.digest);
        setError(null);
      } else {
        setError(res.error.message);
      }
    } catch (err) {
      if (gen !== hashGenRef.current) return;
      setError(err instanceof Error ? err.message : "Hashing failed.");
    } finally {
      if (gen === hashGenRef.current) setBusy(false);
    }
  }, []);

  useEffect(() => {
    void computeHash(input, encoding);
  }, [input, encoding, computeHash]);

  const onSample = useCallback(() => {
    setInput(SAMPLE_INPUT);
    setEncoding("hex");
  }, []);

  const onClear = useCallback(() => {
    setInput("");
    setDigest("");
    setError(null);
  }, []);

  const statusLabel = busy ? "Computing" : error ? "Error" : digest ? "Hashed" : "Ready";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <ToolHeader
        icon={Hash}
        title="Hash (SHA)"
        subtitle="Generate SHA hashes"
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
          <FieldLabel>ALGORITHM + INPUT</FieldLabel>

          {/* Algorithm row */}
          <div className="box-border flex h-[32px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3">
            <span className="text-[13px] font-normal text-on-muted">Algorithm</span>
            <span className="font-mono text-[12px] text-on-surface">SHA-256</span>
          </div>

          {/* Encoding selector */}
          <div className="box-border flex h-[32px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3">
            <label
              htmlFor={encodingId}
              className="cursor-pointer text-[13px] font-normal text-on-muted"
            >
              Encoding
            </label>
            <select
              id={encodingId}
              aria-label="Encoding"
              value={encoding}
              onChange={(e) => setEncoding(e.target.value as ShaHashEncoding)}
              className="cursor-pointer bg-transparent text-right font-mono text-[12px] text-on-surface outline-none"
            >
              {ENCODINGS.map((enc) => (
                <option key={enc} value={enc} className="bg-surface text-on-surface">
                  {enc}
                </option>
              ))}
            </select>
          </div>

          {/* Input text */}
          <div className="box-border flex w-full flex-col rounded-[10px] border border-outline bg-surface p-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <label
              htmlFor={inputId}
              className="mb-1 text-[11px] font-mono uppercase tracking-wider text-on-faint"
            >
              Input
            </label>
            <textarea
              id={inputId}
              aria-label="Input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to hash..."
              rows={4}
              spellCheck={false}
              className="w-full resize-none bg-transparent font-mono text-[12px] leading-relaxed text-on-surface outline-none placeholder:text-on-faint"
            />
          </div>

          {/* Run Action */}
          <RunButton onClick={() => void computeHash(input, encoding)} disabled={busy}>
            {busy ? "Hashing..." : "Hash It"}
          </RunButton>

          <p className="m-0 text-[11px] leading-relaxed text-on-faint">
            One-way digest, fixed 256-bit output.
          </p>
        </FormPanel>

        {/* Result Panel */}
        <ResultPanel>
          <ResultHead
            title="SHA-256 Digest"
            subtitle={`${encoding}-encoded · ${digest ? digest.length : 64} chars`}
            onCopy={() => void copy("digest", digest)}
            copied={isCopied("digest")}
          />

          <ResultCard>
            {error ? (
              <div className="font-mono text-[13px] text-error" role="alert">
                {error}
              </div>
            ) : digest ? (
              <code className="select-all break-all font-mono text-[18px] font-semibold leading-snug text-on-surface lg:text-[22px]">
                {digest}
              </code>
            ) : (
              <div className="font-mono text-[13px] italic text-on-faint">
                {busy ? "Computing digest..." : "No digest yet. Enter text and choose Hash It."}
              </div>
            )}
            <div className="select-none font-mono text-[12px] text-on-faint">
              {digest ? `Length ${digest.length} • 256-bit • one-way` : "256-bit fixed output"}
            </div>
          </ResultCard>
        </ResultPanel>
      </div>

      {/* Status Bar */}
      <StatusBar
        label="SHA Hash status"
        chip={{ icon: CircleCheck, text: statusLabel }}
        stats={[`${input.length} chars · 32 bytes · SHA-256`, encoding]}
        lang="SHA-256"
      />
    </div>
  );
}
