import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { validateBcryptRequest } from "@kitland/core";
import bcrypt from "bcryptjs";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { CircleCheck, FileInput, Lock } from "lucide-react";
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

const SAMPLE_PASSWORD = "correct horse";
const DEFAULT_ROUNDS = 10;
const ROUNDS_OPTIONS = [4, 6, 8, 10, 11, 12] as const;
const DEBOUNCE_MS = 150;

export type BcryptHashToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/**
 * Bcrypt Hash tool.
 */
export function BcryptHashTool({
  initialInput,
  capabilities: _capabilities = LOCAL_ONLY_CAPABILITIES,
}: BcryptHashToolProps = {}) {
  void _capabilities;
  const passwordId = useId();
  const [password, setPassword] = useState(initialInput ?? SAMPLE_PASSWORD);

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setPassword(initialInput);
    }
  }, [initialInput]);
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS);
  const [hash, setHash] = useState("");
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "match" | "mismatch">("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { isCopied, copy } = useCopyFeedback();
  const hashGenRef = useRef(0);

  // Hash calculation — guarded against stale out-of-order completions at cost 10–12.
  const doHash = useCallback(async (pwd: string, cost: number) => {
    const gen = hashGenRef.current + 1;
    hashGenRef.current = gen;
    const v = validateBcryptRequest(pwd, cost);
    if (!v.ok) {
      if (gen !== hashGenRef.current) return;
      setError(v.error.message);
      return;
    }
    if (gen !== hashGenRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const salt = await bcrypt.genSalt(cost);
      if (gen !== hashGenRef.current) return;
      const res = await bcrypt.hash(pwd, salt);
      if (gen !== hashGenRef.current) return;
      setHash(res);
      setError(null);
    } catch {
      if (gen !== hashGenRef.current) return;
      setError("Bcrypt hashing unavailable.");
    } finally {
      if (gen === hashGenRef.current) setBusy(false);
    }
  }, []);

  // Realtime hash with debounce — no manual button (matches SHA/HMAC pattern)
  useEffect(() => {
    const timer = setTimeout(() => {
      void doHash(password, rounds);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [password, rounds, doHash]);

  // Verification check
  useEffect(() => {
    if (!verifyInput || !hash) {
      setVerifyStatus("idle");
      return;
    }
    let active = true;
    const run = async () => {
      try {
        const isMatch = await bcrypt.compare(verifyInput, hash);
        if (!active) return;
        setVerifyStatus(isMatch ? "match" : "mismatch");
      } catch {
        if (!active) return;
        setVerifyStatus("mismatch");
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [verifyInput, hash]);

  const onSample = useCallback(() => {
    setPassword(SAMPLE_PASSWORD);
    setRounds(DEFAULT_ROUNDS);
    setVerifyInput("");
  }, []);

  const statusLabel = busy ? "Hashing" : error ? "Error" : hash ? "Hashed" : "Ready";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <ToolHeader
        icon={Lock}
        title="Bcrypt Hash"
        subtitle="Hash passwords with bcrypt"
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
        <FormPanel width={300}>
          <FieldLabel>COST + PASSWORD</FieldLabel>

          {/* Rounds */}
          <div className="box-border flex h-[32px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3">
            <span className="text-[13px] font-normal text-on-muted">Rounds</span>
            <select
              aria-label="Cost rounds"
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="cursor-pointer bg-transparent text-right font-mono text-[12px] text-on-surface outline-none"
            >
              {ROUNDS_OPTIONS.map((r) => (
                <option key={r} value={r} className="bg-surface text-on-surface">
                  {r} rounds
                </option>
              ))}
            </select>
          </div>

          {/* Password Input */}
          <div className="box-border flex h-[32px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <label
              htmlFor={passwordId}
              className="shrink-0 cursor-pointer text-[13px] font-normal text-on-muted"
            >
              Password
            </label>
            <input
              id={passwordId}
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="correct horse"
              spellCheck={false}
              className="w-full bg-transparent text-right font-mono text-[12px] text-on-surface outline-none placeholder:text-on-faint"
            />
          </div>

          {/* Salt */}
          <div className="box-border flex h-[32px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[9px] border border-outline bg-surface px-3">
            <span className="text-[13px] font-normal text-on-muted">Salt</span>
            <span className="font-mono text-[12px] text-on-surface">auto</span>
          </div>

          <p className="m-0 text-[11px] leading-relaxed text-on-faint">
            Adaptive hash; cost factor {rounds} ≈ {rounds >= 12 ? "400ms+" : "100ms"} — hashes automatically as you type (debounced {DEBOUNCE_MS}ms).
          </p>
        </FormPanel>

        {/* Result Panel */}
        <ResultPanel>
          <ResultHead
            title="Bcrypt Hash"
            subtitle={`bcrypt • cost ${rounds} • ${hash ? hash.length : 60} chars`}
            onCopy={() => void copy("hash", hash)}
            copied={isCopied("hash")}
            filled
            copyLabel="Copy"
          />

          <ResultCard>
            {error ? (
              <div className="font-mono text-[13px] text-error">{error}</div>
            ) : hash ? (
              <div className="select-all break-all font-mono text-[16px] font-semibold leading-snug text-on-surface lg:text-[20px]">
                {hash}
              </div>
            ) : (
              <div className="font-mono text-[13px] italic text-on-faint">
                {busy ? "Generating hash..." : "Hash will appear here..."}
              </div>
            )}
            <div className="select-none font-mono text-[12px] text-on-faint">
              Salt embedded • one-way • cost tunable
            </div>
          </ResultCard>

          {/* Verify Row */}
          <div className="box-border flex h-[40px] w-full shrink-0 flex-row items-center justify-between gap-2 rounded-[10px] border border-outline bg-bg-elevated px-3 transition-colors focus-within:border-primary">
            <input
              type="text"
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              placeholder="re-type password to verify…"
              spellCheck={false}
              aria-label="Re-type password to verify"
              className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-on-surface outline-none placeholder:text-on-faint"
            />
            <div
              className={`box-border flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-[11px] font-semibold ${
                verifyStatus === "match"
                  ? "bg-success-soft text-success"
                  : verifyStatus === "mismatch"
                    ? "bg-error/20 text-error"
                    : "bg-surface text-on-muted"
              }`}
            >
              <span>
                {verifyStatus === "match"
                  ? "Match"
                  : verifyStatus === "mismatch"
                    ? "Mismatch"
                    : "Verify"}
              </span>
            </div>
          </div>
        </ResultPanel>
      </div>

      {/* Status Bar */}
      <StatusBar
        label="Bcrypt Hash status"
        chip={{ icon: CircleCheck, text: statusLabel }}
        stats={[`cost: ${rounds}`, "bcrypt", `${hash ? hash.length : 60} chars`]}
        lang="bcrypt"
      />
    </div>
  );
}
