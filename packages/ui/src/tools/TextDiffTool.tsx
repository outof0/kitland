import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { useTextDiff } from "../hooks/useInspectHooks";
import { Check, Copy, FileDiff, FileInput, Trash2, Upload } from "lucide-react";
import { HostCodeEditor } from "../components/HostCodeEditor";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { pickTextFile } from "../lib/clipboard";
import { TEXT_DIFF_MAX_INPUT_CHARS } from "@kitland/core";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const BEFORE_SAMPLE = "one\nlocal tools\nship carefully\n🍵";
const AFTER_SAMPLE = "one\nlocal developer tools\nship carefully\n東京\nready";
const DISPLAY_LINE_LIMIT = 1_000;

export type TextDiffToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** Text Diff tool aligned with design system tokens and layout. */
export function TextDiffTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: TextDiffToolProps = {}) {
  const headingId = useId();
  const [before, setBefore] = useState(initialInput ?? BEFORE_SAMPLE);
  const [after, setAfter] = useState(AFTER_SAMPLE);
  const { isCopied, copy } = useCopyFeedback();

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setBefore(initialInput);
    }
  }, [initialInput]);

  const showUpload = capabilities.fileOpen ?? false;

  const { result, isProcessing } = useTextDiff(before, after);
  const error = !isProcessing && !result.ok ? result.error.message : null;
  const diff = !isProcessing && result.ok ? result.value : null;
  const shownLines = diff?.lines.slice(0, DISPLAY_LINE_LIMIT) ?? [];

  const onSample = useCallback(() => {
    setBefore(BEFORE_SAMPLE);
    setAfter(AFTER_SAMPLE);
  }, []);

  const onCopyDiff = useCallback(async () => {
    if (!diff) return;
    const diffText = diff.lines
      .map((l) => `${l.kind === "added" ? "+" : l.kind === "removed" ? "-" : " "} ${l.value}`)
      .join("\n");
    await copy("diff", diffText);
  }, [copy, diff]);

  const onBeforeUpload = useCallback(async () => {
    const picked = await pickTextFile({ maxChars: TEXT_DIFF_MAX_INPUT_CHARS });
    if (picked && picked.ok) {
      setBefore(picked.text);
    }
  }, []);

  const onAfterUpload = useCallback(async () => {
    const picked = await pickTextFile({ maxChars: TEXT_DIFF_MAX_INPUT_CHARS });
    if (picked && picked.ok) {
      setAfter(picked.text);
    }
  }, []);

  const status =
    !before && !after ? "Waiting" : error ? "Error" : isProcessing ? "Processing" : "Diff Ready";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <div className="size-11 bg-primary-soft border border-primary/30 rounded-[11px] text-primary flex items-center justify-center shrink-0">
            <FileDiff className="size-5" />
          </div>
          <div>
            <h2
              id={headingId}
              className="text-[20px] font-bold font-display text-on-surface tracking-[-0.02em] m-0"
            >
              Text Diff
            </h2>
            <p className="text-[13px] text-on-muted m-0 mt-0.5">
              Compare two text snippets locally with line-by-line additions and deletions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSample}
            className="h-[32px] px-[12px] bg-surface border border-outline rounded-[8px] text-[12px] font-medium text-on-surface hover:bg-surface-low transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileInput className="size-3.5 text-on-muted" />
            Sample
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="bg-danger-soft border border-danger/40 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
        >
          {error}
        </div>
      )}

      {/* Two-Column Editor Input Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[260px]">
        {/* Original Input Card */}
        <div className="flex flex-col bg-surface-low border border-outline rounded-[12px] overflow-hidden focus-within:border-primary transition-all">
          <div className="h-[45.5px] bg-surface border-b border-outline px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-[13px] font-medium text-on-surface">Original (Before)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void copy("before", before)}
                disabled={!before}
                title={isCopied("before") ? "Copied original" : "Copy original"}
                aria-label={isCopied("before") ? "Copied original" : "Copy original"}
                className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 ${
                  isCopied("before")
                    ? "bg-success-soft text-success border border-success/40"
                    : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                }`}
              >
                {isCopied("before") ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
              {showUpload && (
                <button
                  type="button"
                  onClick={() => void onBeforeUpload()}
                  title="Upload original file"
                  aria-label="Upload original file"
                  className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface cursor-pointer transition-colors"
                >
                  <Upload className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setBefore("")}
                disabled={!before}
                title="Clear original"
                aria-label="Clear original"
                className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface disabled:opacity-30 cursor-pointer transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex min-h-[200px] flex-1 overflow-hidden bg-transparent">
            <HostCodeEditor
              value={before}
              onChange={setBefore}
              language="text"
              placeholder="Paste original text…"
              ariaLabel="Original"
            />
          </div>
        </div>

        {/* Changed Input Card */}
        <div className="flex flex-col bg-surface-low border border-outline rounded-[12px] overflow-hidden focus-within:border-primary transition-all">
          <div className="h-[45.5px] bg-surface border-b border-outline px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-[13px] font-medium text-on-surface">Modified (After)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void copy("after", after)}
                disabled={!after}
                title={isCopied("after") ? "Copied modified" : "Copy modified"}
                aria-label={isCopied("after") ? "Copied modified" : "Copy modified"}
                className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 ${
                  isCopied("after")
                    ? "bg-success-soft text-success border border-success/40"
                    : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                }`}
              >
                {isCopied("after") ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
              {showUpload && (
                <button
                  type="button"
                  onClick={() => void onAfterUpload()}
                  title="Upload modified file"
                  aria-label="Upload modified file"
                  className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface cursor-pointer transition-colors"
                >
                  <Upload className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setAfter("")}
                disabled={!after}
                title="Clear modified"
                aria-label="Clear modified"
                className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface disabled:opacity-30 cursor-pointer transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex min-h-[200px] flex-1 overflow-hidden bg-transparent">
            <HostCodeEditor
              value={after}
              onChange={setAfter}
              language="text"
              placeholder="Paste modified text…"
              ariaLabel="Changed"
            />
          </div>
        </div>
      </div>

      {/* Unified Diff Output Card */}
      <section
        aria-label="Diff result"
        className="flex flex-col bg-surface-low border border-outline rounded-[12px] overflow-hidden"
      >
        <div className="h-[45.5px] bg-surface border-b border-outline px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success" />
              <span className="text-[13px] font-medium text-on-surface">Unified Diff View</span>
            </div>
            {diff && (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-success-soft text-success">
                  +{diff.added} added
                </span>
                <span className="px-1.5 py-0.5 rounded bg-danger-soft text-danger">
                  −{diff.removed} removed
                </span>
                <span className="px-1.5 py-0.5 rounded bg-surface text-on-muted">
                  ={diff.unchanged} unchanged
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCopyDiff}
              disabled={!diff}
              title={isCopied("diff") ? "Copied diff text" : "Copy diff text"}
              aria-label={isCopied("diff") ? "Copied diff text" : "Copy diff text"}
              className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 ${
                isCopied("diff")
                  ? "bg-success-soft text-success border border-success/40"
                  : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
              }`}
            >
              {isCopied("diff") ? (
                <Check className="size-4 text-success" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto bg-surface p-0 font-mono text-[12px] leading-[22px]">
          {diff ? (
            <div>
              {shownLines.map((line, index) => (
                <div
                  key={`${line.kind}-${line.oldLine}-${line.newLine}-${index}`}
                  className={`flex items-start px-3 py-0.5 border-b border-outline/40 ${
                    line.kind === "added"
                      ? "bg-success-soft text-success"
                      : line.kind === "removed"
                        ? "bg-danger-soft text-danger"
                        : "text-on-muted"
                  }`}
                >
                  <span className="w-8 select-none text-right pr-2 text-on-muted text-[11px]">
                    {line.oldLine ?? ""}
                  </span>
                  <span className="w-8 select-none text-right pr-2 text-on-muted text-[11px]">
                    {line.newLine ?? ""}
                  </span>
                  <span className="w-4 select-none font-bold text-center">
                    {line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " "}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-all">{line.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[13px] text-on-muted">
              Enter text in both panels to view diff
            </div>
          )}
        </div>
      </section>

      {/* Status Bar */}
      <div className="h-[36px] bg-surface border border-outline rounded-[8px] px-3.5 flex items-center justify-between text-[12px] shrink-0 font-ui">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              status === "Diff Ready"
                ? "bg-success-soft text-success"
                : status === "Error"
                  ? "bg-danger-soft text-danger"
                  : "bg-surface text-on-muted"
            }`}
          >
            {status}
          </span>
          <span className="text-on-muted">
            {diff
              ? `${diff.lines.length} lines · +${diff.added} −${diff.removed}`
              : "Ready to compare"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono text-[11px] font-semibold">&lt;&gt; DIFF</span>
        </div>
      </div>
    </div>
  );
}
