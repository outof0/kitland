import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { inspectJwt } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { CircleCheck, FileInput, KeyRound, ShieldAlert, Trash2 } from "lucide-react";
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

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDQyIiwibmFtZSI6IkFkYSIsImlhdCI6MTc0MDkwNDU0MiwiZXhwIjoxNzQwOTA4MTQyfQ.signature";
const DEBOUNCE_MS = 150;

export type JwtDecoderToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/**
 * JWT Decoder tool.
 */
export function JwtDecoderTool({
  initialInput,
  capabilities: _capabilities = LOCAL_ONLY_CAPABILITIES,
}: JwtDecoderToolProps = {}) {
  void _capabilities;
  const tokenId = useId();
  const [token, setToken] = useState(initialInput ?? SAMPLE_JWT);

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setToken(initialInput);
    }
  }, [initialInput]);
  const [headerJson, setHeaderJson] = useState("");
  const [payloadJson, setPayloadJson] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [algorithm, setAlgorithm] = useState("HS256");
  const [claimCount, setClaimCount] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const { isCopied, copy } = useCopyFeedback();

  const decode = useCallback((raw: string) => {
    if (!raw.trim()) {
      setHeaderJson("");
      setPayloadJson("");
      setSignatureText("");
      setError(null);
      return;
    }
    const r = inspectJwt(raw);
    if (r.ok) {
      setHeaderJson(JSON.stringify(r.value.header, null, 2));
      setPayloadJson(JSON.stringify(r.value.payload, null, 2));
      setSignatureText(r.value.signature || "(none)");
      setAlgorithm(String(r.value.header.alg || "Unknown"));
      setClaimCount(Object.keys(r.value.payload).length);
      setError(null);
    } else {
      setError(r.error.message);
    }
  }, []);

  useEffect(() => {
    if (!token.trim()) {
      setHeaderJson("");
      setPayloadJson("");
      setSignatureText("");
      setError(null);
      return;
    }
    const timer = setTimeout(() => {
      decode(token);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [token, decode]);

  const onSample = useCallback(() => {
    setToken(SAMPLE_JWT);
  }, []);

  const onClear = useCallback(() => {
    setToken("");
    setHeaderJson("");
    setPayloadJson("");
    setSignatureText("");
    setError(null);
  }, []);

  const statusLabel = error ? "Invalid" : headerJson ? "Decoded" : "Ready";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <ToolHeader
        icon={KeyRound}
        title="JWT Decoder"
        subtitle="Inspect JWT claims; verify only with a supplied key"
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
        <FormPanel width={360}>
          <FieldLabel>TOKEN</FieldLabel>

          {/* Token Input Box */}
          <div className="box-border flex w-full flex-col rounded-[10px] border border-outline bg-surface p-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <label
              htmlFor={tokenId}
              className="mb-1 text-[11px] font-mono uppercase tracking-wider text-on-faint"
            >
              Encoded JWT
            </label>
            <textarea
              id={tokenId}
              aria-label="Encoded JWT"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste JWT string (header.payload.signature)..."
              rows={6}
              spellCheck={false}
              className="w-full resize-none bg-transparent font-mono text-[12px] leading-relaxed text-on-surface outline-none placeholder:text-on-faint"
            />
          </div>

          <p className="m-0 text-[11px] leading-relaxed text-on-faint">
            Paste a JWT to inspect its 3 parts. Decoding does not verify its signature.
          </p>
        </FormPanel>

        {/* Result Panel */}
        <ResultPanel>
          <ResultHead
            title="Decoded JWT"
            subtitle={headerJson ? `${algorithm} • ${claimCount} claims` : "No token decoded"}
            onCopy={() => void copy("payload", payloadJson)}
            copied={isCopied("payload")}
            filled
            copyLabel="Copy Payload"
          />

          {error ? (
            <ResultCard>
              <div className="font-mono text-[13px] text-error" role="alert">
                {error}
              </div>
            </ResultCard>
          ) : headerJson ? (
            <div className="flex flex-col gap-3">
              {/* Header Segment */}
              <div className="flex flex-col gap-1.5 rounded-[12px] bg-bg-elevated p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-on-muted">
                    Header
                  </span>
                  <span className="rounded-[5px] bg-primary-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                    alg: {algorithm}
                  </span>
                </div>
                <pre className="overflow-x-auto rounded-[8px] bg-surface p-2.5 font-mono text-[12px] leading-relaxed text-on-surface">
                  {headerJson}
                </pre>
              </div>

              {/* Payload Segment */}
              <div className="flex flex-col gap-1.5 rounded-[12px] bg-bg-elevated p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-on-muted">
                    Payload (Claims)
                  </span>
                  <span className="font-mono text-[11px] text-on-faint">{claimCount} claims</span>
                </div>
                <pre className="overflow-x-auto rounded-[8px] bg-surface p-2.5 font-mono text-[12px] leading-relaxed text-on-surface">
                  {payloadJson}
                </pre>
              </div>

              {/* Signature Segment */}
              <div className="flex flex-col gap-1.5 rounded-[12px] bg-bg-elevated p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-on-muted">
                    Signature
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-warning">
                    <ShieldAlert className="size-3.5" />
                    <span>Unverified</span>
                  </div>
                </div>
                <code className="select-all break-all rounded-[8px] bg-surface p-2.5 font-mono text-[11px] text-on-surface">
                  {signatureText}
                </code>
              </div>
            </div>
          ) : (
            <ResultCard>
              <div className="font-mono text-[13px] italic text-on-faint">
                Paste a JWT token on the left to inspect its structure.
              </div>
            </ResultCard>
          )}
        </ResultPanel>
      </div>

      {/* Status Bar */}
      <StatusBar
        label="JWT Decoder status"
        chip={{ icon: CircleCheck, text: statusLabel }}
        stats={[algorithm, `${claimCount} claims`, `${token.length} chars`]}
        lang="JWT"
      />
    </div>
  );
}
