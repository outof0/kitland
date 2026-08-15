import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { generateToken, type TokenFormat } from "@kitland/core";
import { CircleCheck, Copy, RefreshCw, Shuffle } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";
import {
  FieldLabel,
  FormPanel,
  ResultCard,
  ResultHead,
  ResultPanel,
  RunButton,
  Segmented,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

const LENGTH_PRESETS = [16, 24, 32, 48, 64] as const;
const FORMATS = [
  { value: "base64url", label: "Base64URL" },
  { value: "hex", label: "Hex" },
];

/**
 * Token Generator tool matching design.pen frame `KHKID` (Token Generator).
 */
export function TokenGeneratorTool() {
  const lengthInputId = useId();
  const [length, setLength] = useState(32);
  const [format, setFormat] = useState<TokenFormat>("base64url");
  const [token, setToken] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isCopied, copy } = useCopyFeedback();

  const generate = useCallback(() => {
    const r = generateToken(length, format, (n) => {
      const b = new Uint8Array(n);
      globalThis.crypto.getRandomValues(b);
      return b;
    });
    if (r.ok) {
      setToken(r.value);
      setError(null);
      setHistory((prev) => {
        const next = [r.value, ...prev.filter((t) => t !== r.value)].slice(0, 4);
        return next;
      });
    } else {
      setError(r.error.message);
    }
  }, [length, format]);

  useEffect(() => {
    generate();
  }, [generate]);

  const statusLabel = error ? "Error" : token ? "Generated" : "Ready";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <ToolHeader
        icon={Shuffle}
        title="Token Generator"
        subtitle="Generate random security tokens"
        actions={
          <button
            type="button"
            onClick={generate}
            className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[8px] border border-outline bg-surface-low px-3 text-[13px] font-semibold text-on-surface transition-colors hover:bg-surface hover:border-outline-strong"
          >
            <RefreshCw className="size-[14px] text-on-muted" />
            <span>Generate</span>
          </button>
        }
      />

      {/* Main Workspace */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {/* Form Panel */}
        <FormPanel width={300}>
          <FieldLabel>FORMAT + LENGTH</FieldLabel>

          {/* Format */}
          <Segmented
            value={format}
            onChange={(v) => setFormat(v as TokenFormat)}
            boxed
            options={FORMATS}
          />

          {/* Length Row */}
          <div className="box-border flex h-[36px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <label
              htmlFor={lengthInputId}
              className="cursor-pointer text-[13px] font-normal text-on-muted"
            >
              Byte Length
            </label>
            <input
              id={lengthInputId}
              type="number"
              min="8"
              max="256"
              value={length}
              onChange={(e) => setLength(Math.max(8, Math.min(256, Number(e.target.value) || 8)))}
              className="w-16 bg-transparent text-right font-mono text-[12px] text-on-surface outline-none"
            />
          </div>

          {/* Length Presets */}
          <div className="flex flex-wrap gap-1.5">
            {LENGTH_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLength(preset)}
                className={`h-[26px] flex-1 cursor-pointer rounded-[6px] font-mono text-[11px] font-semibold transition-colors ${
                  length === preset
                    ? "bg-primary text-on-primary"
                    : "bg-surface border border-outline text-on-muted hover:text-on-surface"
                }`}
              >
                {preset}B
              </button>
            ))}
          </div>

          {/* Run Action */}
          <RunButton onClick={generate}>Generate New Token</RunButton>

          <p className="m-0 text-[11px] leading-relaxed text-on-faint">
            Cryptographically secure random token generated with Web Crypto.
          </p>
        </FormPanel>

        {/* Result Panel */}
        <ResultPanel>
          <ResultHead
            title="Generated Token"
            subtitle={`${format} • ${length} bytes entropy • ${token.length} chars`}
            onCopy={() => void copy("token", token)}
            copied={isCopied("token")}
            filled
            copyLabel="Copy"
          />

          <ResultCard>
            {error ? (
              <div className="font-mono text-[13px] text-error" role="alert">
                {error}
              </div>
            ) : token ? (
              <code className="select-all break-all font-mono text-[18px] font-semibold leading-relaxed text-on-surface lg:text-[22px]">
                {token}
              </code>
            ) : (
              <div className="font-mono text-[13px] italic text-on-faint">
                Token will appear here...
              </div>
            )}
            <div className="select-none font-mono text-[12px] text-on-faint">
              {length * 8}-bit entropy • Web Crypto CSPRNG
            </div>
          </ResultCard>

          {/* Recent Tokens History */}
          {history.length > 1 ? (
            <div className="flex flex-col gap-2 pt-2">
              <FieldLabel>RECENT GENERATED</FieldLabel>
              <div className="flex flex-col gap-1.5">
                {history.slice(1).map((item, idx) => (
                  <div
                    key={item + idx}
                    className="flex h-[36px] items-center justify-between gap-2 rounded-[8px] border border-outline bg-bg-elevated px-3 font-mono text-[11px] text-on-muted"
                  >
                    <span className="min-w-0 flex-1 truncate select-all">{item}</span>
                    <button
                      type="button"
                      onClick={() => void copy(`hist-${idx}`, item)}
                      aria-label={`Copy token ${idx + 1}`}
                      className="cursor-pointer text-primary transition-opacity hover:opacity-80"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </ResultPanel>
      </div>

      {/* Status Bar */}
      <StatusBar
        label="Token Generator status"
        chip={{ icon: CircleCheck, text: statusLabel }}
        stats={[format, `${length} bytes`, `${token.length} chars`]}
        lang="TOKEN"
      />
    </div>
  );
}
