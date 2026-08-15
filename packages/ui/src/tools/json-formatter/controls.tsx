import {
  Braces,
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  FoldVertical,
  Maximize2,
  Printer,
  Redo2,
  Trash2,
  Undo2,
  UnfoldVertical,
  Upload,
  Wrench,
} from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { IndentMenu } from "./IndentMenu";
import type { JsonFormatMode } from "@kitland/core";
import type { FeedbackTone, JsonFormatterState, View } from "./types";

export { type FeedbackTone, type View };

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function IconButton({
  label,
  title,
  onClick,
  disabled,
  children,
  ref,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean | undefined;
  children: ReactNode;
  ref?: RefObject<HTMLButtonElement | null> | undefined;
}) {
  return (
    <button
      ref={ref}
      type="button"
      className="flex size-8 shrink-0 items-center justify-center rounded-[7px] text-on-muted hover:bg-surface hover:text-on-surface border border-transparent hover:border-outline disabled:pointer-events-none disabled:opacity-30 transition-colors cursor-pointer [&_svg]:size-4"
      aria-label={label}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Sep() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-outline" aria-hidden="true" />;
}

export function ViewSeg({ value, onChange }: { value: View; onChange: (next: View) => void }) {
  return (
    <div className="flex h-7 shrink-0 items-center gap-0.5 rounded-lg border border-outline bg-surface-low p-0.5">
      {(["code", "tree"] as const).map((view) => (
        <button
          key={view}
          type="button"
          aria-pressed={value === view}
          onClick={() => onChange(view)}
          className={`h-6 rounded-md px-2 text-[11px] font-semibold cursor-pointer ${
            value === view
              ? "bg-primary-soft text-primary-strong"
              : "text-on-muted hover:bg-transparent hover:text-on-surface"
          }`}
        >
          {view === "code" ? "Code" : "Tree"}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: number | string | undefined }) {
  return (
    <div className="flex shrink-0 items-center gap-[5px]">
      <dt className="text-[11.5px] leading-snug text-on-faint">{label}</dt>
      <dd className="m-0 text-[11.5px] leading-snug font-semibold text-on-muted">
        {value === undefined ? "—" : typeof value === "number" ? value.toLocaleString() : value}
      </dd>
    </div>
  );
}

/** Maps the live inspection state to the summary chip label and tone. */
export function stateSummary(state: JsonFormatterState) {
  const status =
    state.status === "idle"
      ? "Waiting"
      : state.status === "processing"
        ? "Inspecting"
        : state.status === "success"
          ? "Valid"
          : state.kind === "limit"
            ? "Limit"
            : state.kind === "unavailable"
              ? "Unavailable"
              : "Error";
  const tone: FeedbackTone | "processing" | "idle" =
    state.status === "success"
      ? "success"
      : state.status === "error"
        ? "error"
        : state.status === "processing"
          ? "processing"
          : "idle";
  return { status, tone };
}

export function ModeOptionsBar({
  mode,
  indent,
  disabled,
  onModeChange,
  onIndentChange,
}: {
  mode: JsonFormatMode;
  indent: 2 | 4;
  disabled: boolean;
  onModeChange: (next: JsonFormatMode) => void;
  onIndentChange: (next: 2 | 4) => void;
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 min-h-[40px] px-1">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="h-[32px] flex items-center gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
          {(["beautify", "minify"] as const).map((modeName) => (
            <button
              key={modeName}
              type="button"
              aria-pressed={mode === modeName}
              onClick={() => onModeChange(modeName)}
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer capitalize ${
                mode === modeName ? "text-primary" : "text-on-muted hover:text-on-surface"
              }`}
            >
              {modeName === "beautify" ? "Beautify" : "Minify"}
            </button>
          ))}
        </div>
        <IndentMenu
          value={indent}
          onChange={onIndentChange}
          disabled={disabled}
          triggerLabel="Indent"
        />
      </div>
    </div>
  );
}

export function InputTools({
  hasInput,
  onFormatInput,
  onMinifyInput,
  onRepair,
  onUpload,
  onCopyInput,
  copiedInput = false,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onFullscreen,
  uploadButtonRef,
  showUpload = true,
}: {
  hasInput: boolean;
  onFormatInput?: (() => void) | undefined;
  onMinifyInput?: (() => void) | undefined;
  onRepair: () => void;
  onUpload: () => void;
  onCopyInput: () => void;
  copiedInput?: boolean | undefined;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onFullscreen: () => void;
  uploadButtonRef?: RefObject<HTMLButtonElement | null> | undefined;
  showUpload?: boolean | undefined;
}) {
  return (
    <div className="flex min-w-0 items-center gap-0.5 flex-wrap">
      {onFormatInput && (
        <IconButton
          label="Beautify input"
          title="Beautify / Format input in place"
          onClick={onFormatInput}
          disabled={!hasInput}
        >
          <UnfoldVertical aria-hidden="true" />
        </IconButton>
      )}
      {onMinifyInput && (
        <IconButton
          label="Minify input"
          title="Minify input in place"
          onClick={onMinifyInput}
          disabled={!hasInput}
        >
          <FoldVertical aria-hidden="true" />
        </IconButton>
      )}
      <Sep />
      <button
        type="button"
        className={`flex size-8 shrink-0 items-center justify-center rounded-[7px] transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-4 ${
          copiedInput
            ? "bg-success-soft text-success border border-success/40"
            : "text-on-muted hover:bg-surface hover:text-on-surface border border-transparent hover:border-outline"
        }`}
        aria-label={copiedInput ? "Copied input" : "Copy input"}
        title={copiedInput ? "Copied input" : "Copy input"}
        onClick={onCopyInput}
        disabled={!hasInput}
      >
        {copiedInput ? (
          <Check className="size-4 text-success" aria-hidden="true" />
        ) : (
          <Copy aria-hidden="true" />
        )}
      </button>
      {showUpload && (
        <IconButton
          label="Upload"
          title="Upload a JSON file"
          onClick={onUpload}
          ref={uploadButtonRef}
        >
          <Upload aria-hidden="true" />
        </IconButton>
      )}
      <IconButton
        label="Repair"
        title="Repair common JSON mistakes"
        onClick={onRepair}
        disabled={!hasInput}
      >
        <Wrench aria-hidden="true" />
      </IconButton>
      <IconButton label="Undo" title="Undo" onClick={onUndo} disabled={!canUndo}>
        <Undo2 aria-hidden="true" />
      </IconButton>
      <IconButton label="Redo" title="Redo" onClick={onRedo} disabled={!canRedo}>
        <Redo2 aria-hidden="true" />
      </IconButton>
      <IconButton label="Clear" title="Clear input" onClick={onClear} disabled={!hasInput}>
        <Trash2 aria-hidden="true" />
      </IconButton>
      <Sep />
      <IconButton label="Toggle fullscreen" title="Fullscreen" onClick={onFullscreen}>
        <Maximize2 aria-hidden="true" />
      </IconButton>
    </div>
  );
}

export function OutputTools({
  disabled,
  onFormatOutput,
  onMinifyOutput,
  onCopyOutput,
  copiedOutput = false,
  onDownload,
  onPrint,
  onFullscreen,
  showDownload = true,
  showPrint = false,
}: {
  disabled: boolean;
  onFormatOutput?: (() => void) | undefined;
  onMinifyOutput?: (() => void) | undefined;
  onCopyOutput: () => void;
  copiedOutput?: boolean | undefined;
  onDownload: () => void;
  onPrint: () => void;
  onFullscreen: () => void;
  showDownload?: boolean | undefined;
  showPrint?: boolean | undefined;
}) {
  return (
    <div className="flex min-w-0 items-center gap-0.5 flex-wrap">
      {onFormatOutput && (
        <IconButton
          label="Beautify output"
          title="Beautify / Format output in place"
          onClick={onFormatOutput}
          disabled={disabled}
        >
          <UnfoldVertical aria-hidden="true" />
        </IconButton>
      )}
      {onMinifyOutput && (
        <IconButton
          label="Minify output"
          title="Minify output in place"
          onClick={onMinifyOutput}
          disabled={disabled}
        >
          <FoldVertical aria-hidden="true" />
        </IconButton>
      )}
      <Sep />
      <button
        type="button"
        className={`flex size-8 shrink-0 items-center justify-center rounded-[7px] transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-4 ${
          copiedOutput
            ? "bg-success-soft text-success border border-success/40"
            : "text-on-muted hover:bg-surface hover:text-on-surface border border-transparent hover:border-outline"
        }`}
        aria-label={copiedOutput ? "Copied formatted JSON" : "Copy formatted JSON"}
        title={copiedOutput ? "Copied formatted JSON" : "Copy formatted JSON"}
        onClick={onCopyOutput}
        disabled={disabled}
      >
        {copiedOutput ? (
          <Check className="size-4 text-success" aria-hidden="true" />
        ) : (
          <Copy aria-hidden="true" />
        )}
      </button>
      {showDownload && (
        <IconButton
          label="Download"
          title="Download formatted JSON"
          onClick={onDownload}
          disabled={disabled}
        >
          <Download aria-hidden="true" />
        </IconButton>
      )}
      {showPrint && (
        <IconButton
          label="Print"
          title="Print formatted JSON"
          onClick={onPrint}
          disabled={disabled}
        >
          <Printer aria-hidden="true" />
        </IconButton>
      )}
      <Sep />
      <IconButton label="Toggle fullscreen" title="Fullscreen" onClick={onFullscreen}>
        <Maximize2 aria-hidden="true" />
      </IconButton>
    </div>
  );
}

export function SummaryBar({
  status,
  tone,
  rootType,
  objectCount,
  arrayCount,
  propsCount,
  maxDepth,
  sizeLabel,
}: {
  status: string;
  tone: FeedbackTone | "processing" | "idle";
  rootType: string | undefined;
  objectCount: number | undefined;
  arrayCount: number | undefined;
  propsCount: number | undefined;
  maxDepth: number | undefined;
  sizeLabel: string;
}) {
  const chipClass =
    tone === "success"
      ? "bg-success-soft text-success border border-success/30"
      : tone === "error"
        ? "bg-danger-soft text-danger border border-danger/30"
        : tone === "processing"
          ? "bg-primary-soft text-primary border border-primary/30"
          : "bg-surface text-on-muted border border-outline";
  return (
    <footer
      className="flex min-h-11 min-w-0 max-w-full shrink-0 flex-wrap items-center gap-3 rounded-[10px] border border-outline bg-surface-low px-4"
      aria-label="JSON inspection summary"
    >
      <span
        className={`flex h-6 items-center gap-1.5 rounded-md px-[9px] text-[11px] font-semibold whitespace-nowrap ${chipClass}`}
      >
        {tone === "success" ? <CircleCheck className="size-3 shrink-0" aria-hidden="true" /> : null}
        {tone === "error" ? <CircleAlert className="size-3 shrink-0" aria-hidden="true" /> : null}
        <output aria-live="polite">{status}</output>
      </span>
      <dl className="flex min-w-0 max-w-full flex-wrap items-center gap-4 max-sm:gap-2.5">
        <Stat label="type" value={rootType} />
        <Stat label="obj" value={objectCount} />
        <Stat label="arr" value={arrayCount} />
        <Stat label="props" value={propsCount} />
        <Stat label="depth" value={maxDepth} />
        <Stat label="size" value={sizeLabel} />
      </dl>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-md border border-outline bg-surface px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap text-primary">
        <Braces className="size-3" aria-hidden="true" />
        JSON
      </span>
    </footer>
  );
}
