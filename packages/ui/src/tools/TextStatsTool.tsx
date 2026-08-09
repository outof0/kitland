import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { useTextStats } from "../hooks/useInspectHooks";
import { pickTextFile } from "../lib/clipboard";
import { TEXT_STATS_MAX_INPUT_CHARS } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { BarChart3, Check, CircleAlert, Copy, FileInput, Trash2, Upload } from "lucide-react";
import { HostCodeEditor } from "../components/HostCodeEditor";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const SAMPLE = "Build local tools.\nShip carefully. 🍵\nFast, private & modern.";

export type TextStatsToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** Text Stats tool aligned with the unified 2-column inspect workspace. */
export function TextStatsTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: TextStatsToolProps = {}) {
  const inputId = useId();
  const [input, setInput] = useState(initialInput ?? SAMPLE);

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

  const { isCopied, copy } = useCopyFeedback();
  const [fileError, setFileError] = useState<string | null>(null);

  const result = useTextStats(input);
  const error = !result.ok ? result.error.message : null;
  const stats = result.ok ? result.value : null;

  const onSample = useCallback(() => {
    setInput(SAMPLE);
  }, []);

  const onClear = useCallback(() => {
    setInput("");
  }, []);

  const onUpload = useCallback(async () => {
    const picked = await pickTextFile({ maxChars: TEXT_STATS_MAX_INPUT_CHARS });
    if (!picked.ok) {
      setFileError(picked.message);
      return;
    }
    setFileError(null);
    setInput(picked.text);
  }, []);

  const onCopyStats = useCallback(async () => {
    if (!stats) return;
    const json = JSON.stringify(stats, null, 2);
    await copy("stats", json);
  }, [copy, stats]);

  const status = input.length === 0 ? "Waiting" : error ? "Error" : "Measured";
  const lineCount = input ? input.split("\n").length : 0;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <header className="flex min-h-[52px] shrink-0 items-center justify-between gap-4 flex-wrap pb-1">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-[10px] bg-surface-low border border-outline flex items-center justify-center text-primary shrink-0">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold font-display text-on-surface tracking-[-0.02em] m-0">
              Text Stats
            </h2>
            <p className="text-[13px] text-on-muted m-0 mt-0.5">
              Measure text locally with Unicode-aware character, word, line, and byte counts.
            </p>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="h-[34px] px-3 rounded-[8px] bg-surface-low border border-outline text-[13px] font-semibold text-on-surface flex items-center gap-[7px] hover:bg-surface hover:border-outline-strong transition-colors cursor-pointer"
            onClick={onSample}
            aria-label="Sample"
          >
            <FileInput className="size-[15px] text-on-muted" aria-hidden="true" />
            <span>Sample</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (2-column layout matching standard workspace) */}
      <div className="grid min-h-0 min-w-0 flex-1 overflow-hidden grid-cols-1 grid-rows-[minmax(0,16rem)_3rem_minmax(0,16rem)] gap-0 lg:grid-cols-[minmax(0,1fr)_60px_minmax(0,1fr)] lg:grid-rows-[minmax(16rem,1fr)] lg:max-h-[calc(100dvh-19rem)]">
        {/* Input Card */}
        <section className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[12px] bg-surface border border-outline focus-within:border-primary transition-all duration-150">
          <div className="flex h-[45.5px] shrink-0 items-center justify-between gap-2 bg-surface-low border-b border-outline px-4">
            <div className="flex min-w-0 items-center gap-[6px]">
              <span className="size-[8px] shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <h3 className="m-0 font-display text-[12px] font-bold tracking-[0.4px] text-on-surface">
                Text to measure
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-[2px]">
              <button
                type="button"
                className={`size-[32px] rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-30 ${
                  isCopied("input")
                    ? "bg-success-soft text-success border border-success/40"
                    : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                }`}
                onClick={() => void copy("input", input)}
                disabled={!input}
                aria-label={isCopied("input") ? "Copied text input" : "Copy text input"}
                title={isCopied("input") ? "Copied text input" : "Copy text input"}
              >
                {isCopied("input") ? (
                  <Check className="size-4 text-success" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </button>
              {(capabilities.fileOpen ?? false) && (
                <button
                  type="button"
                  className="size-[32px] rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer"
                  onClick={() => void onUpload()}
                  aria-label="Upload file"
                  title="Upload file"
                >
                  <Upload className="size-4" aria-hidden="true" />
                </button>
              )}
              <div className="w-[1px] h-[16px] bg-outline mx-1"></div>
              <button
                type="button"
                className="size-[32px] rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-30"
                onClick={onClear}
                disabled={!input}
                aria-label="Clear input"
                title="Clear input"
              >
                <Trash2 className="size-[14px]" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-row overflow-hidden bg-surface">
            <HostCodeEditor
              id={inputId}
              value={input}
              onChange={setInput}
              language="text"
              placeholder="Paste text to calculate live statistics…"
              ariaLabel="Text to measure"
              maxChars={TEXT_STATS_MAX_INPUT_CHARS}
            />
          </div>
          {error && (
            <div
              className="m-0 shrink-0 border-t border-danger/35 bg-danger-soft px-4 py-2 text-xs text-danger flex items-center gap-2"
              role="alert"
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{error}</span>
            </div>
          )}
          {fileError && (
            <div
              className="m-0 shrink-0 border-t border-danger/35 bg-danger-soft px-4 py-2 text-xs text-danger flex items-center gap-2"
              role="alert"
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{fileError}</span>
            </div>
          )}
        </section>

        {/* Center Rail */}
        <div className="flex min-h-0 min-w-0 w-[60px] flex-col items-center justify-center gap-1 select-none">
          <div className="size-[40px] rounded-[10px] bg-surface-low border border-outline text-on-muted flex items-center justify-center">
            <BarChart3 className="size-[18px]" />
          </div>
          <span className="text-[9.5px] font-display font-medium text-on-muted text-center">
            Metrics
          </span>
        </div>

        {/* Stats Output Card */}
        <section
          aria-label="Text statistics"
          className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[12px] bg-surface border border-outline focus-within:border-success transition-all duration-150"
        >
          <div className="flex h-[45.5px] shrink-0 items-center justify-between gap-2 bg-surface-low border-b border-outline px-4">
            <div className="flex min-w-0 items-center gap-[6px]">
              <span className="size-[8px] shrink-0 rounded-full bg-success" aria-hidden="true" />
              <h3 className="m-0 font-display text-[12px] font-bold tracking-[0.4px] text-on-surface">
                Calculated Metrics
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-[2px]">
              <button
                type="button"
                className={`size-[32px] rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-30 ${
                  isCopied("stats")
                    ? "bg-success-soft text-success border border-success/40"
                    : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                }`}
                onClick={() => void onCopyStats()}
                disabled={!stats}
                aria-label={isCopied("stats") ? "Copied statistics JSON" : "Copy statistics JSON"}
                title={isCopied("stats") ? "Copied statistics JSON" : "Copy statistics JSON"}
              >
                {isCopied("stats") ? (
                  <Check className="size-4 text-success" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto bg-surface">
            {stats ? (
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard label="Graphemes" value={stats.graphemes} hint="Perceived characters" />
                <StatCard label="Code Points" value={stats.codePoints} hint="Unicode scalars" />
                <StatCard label="Words" value={stats.words} hint="Word segments" />
                <StatCard label="Lines" value={stats.lines} hint="Total lines" />
                <StatCard
                  label="Chars (with spaces)"
                  value={stats.charactersWithWhitespace}
                  hint="All characters"
                />
                <StatCard
                  label="Chars (no spaces)"
                  value={stats.charactersWithoutWhitespace}
                  hint="Non-whitespace"
                />
                <StatCard label="UTF-8 Bytes" value={stats.utf8Bytes} hint="Byte size" />
                <StatCard
                  label="Max limit"
                  value={TEXT_STATS_MAX_INPUT_CHARS}
                  hint="Supported max"
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[13px] text-on-muted">
                Enter text to see statistics
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Status Bar */}
      <footer
        className="flex h-[36px] shrink-0 items-center justify-between gap-3 rounded-[8px] border border-outline bg-surface-low px-3.5 text-[12px] font-ui"
        aria-label="Text Stats status"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              status === "Measured"
                ? "bg-success-soft text-success"
                : status === "Error"
                  ? "bg-danger-soft text-danger"
                  : "bg-surface text-on-muted"
            }`}
          >
            {status}
          </span>
          <span className="text-on-muted">
            {lineCount} {lineCount === 1 ? "line" : "lines"} · {input.length} chars
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-primary">
            &lt;&gt; STATS
          </span>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="bg-surface-low border border-outline rounded-[10px] p-3 flex flex-col justify-between hover:border-outline-strong transition-colors">
      <div className="text-[12px] font-medium text-on-muted">{label}</div>
      <div className="font-mono text-[22px] font-bold text-on-surface mt-1">
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] text-on-faint mt-0.5">{hint}</div>
    </div>
  );
}
