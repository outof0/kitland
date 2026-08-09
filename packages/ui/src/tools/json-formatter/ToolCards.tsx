import { AutoTransformToggle } from "../../components/AutoTransformToggle";
import type { InjectedEditorRef } from "../../components/CodeEditorContext";
import { ArrowLeftRight, CheckCircle2, FoldVertical, UnfoldVertical } from "lucide-react";
import type { ComponentProps, RefObject } from "react";
import { CodeEditor } from "./CodeEditor";
import { InputTools, OutputTools, ViewSeg, type View } from "./controls";
import { TreePane } from "./JsonTree";
import type { JsonValue } from "./types";

export function ToolArea({
  inputCardRef,
  inputView,
  onInputViewChange,
  inputEditorId,
  inputErrorId,
  error,
  source,
  inputRef,
  onInputChange,
  onInputFocus,
  onInputBlur,
  format,
  inputTools,
  outcome,
  outputCardRef,
  outputView,
  onOutputViewChange,
  outputEditorId,
  output,
  onOutputChange,
  outputTools,
  onValidate,
  onBeautify,
  onMinify,
  onSwap,
  autoFormat,
  onAutoFormatChange,
}: {
  inputCardRef: RefObject<HTMLElement | null>;
  inputView: View;
  onInputViewChange: (next: View) => void;
  inputEditorId: string;
  inputErrorId: string;
  error: string | null;
  source: string;
  inputRef: RefObject<InjectedEditorRef | null>;
  onInputChange: (next: string) => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  format: {
    mode: "beautify" | "minify";
    indent: 2 | 4;
    onIndentChange: (next: 2 | 4) => void;
  };
  inputTools: ComponentProps<typeof InputTools>;
  outcome: {
    parsedValue: JsonValue | null;
    totalValues: number;
    sizeLabel: string;
  };
  outputCardRef: RefObject<HTMLElement | null>;
  outputView: View;
  onOutputViewChange: (next: View) => void;
  outputEditorId: string;
  output: string;
  onOutputChange: (next: string) => void;
  outputTools: ComponentProps<typeof OutputTools>;
  onValidate: () => void;
  onBeautify: () => void;
  onMinify: () => void;
  onSwap?: () => void;
  autoFormat?: boolean;
  onAutoFormatChange?: (auto: boolean) => void;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-3.5 max-lg:flex-col max-lg:overflow-y-auto">
      <section
        ref={inputCardRef}
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border ${
          error ? "border-danger/40" : "border-outline"
        } bg-surface focus-within:${
          error ? "border-danger ring-danger/30" : "border-primary ring-primary/30"
        } focus-within:ring-1 transition-all duration-150 max-lg:min-h-72 max-lg:flex-none`}
      >
        <div className="flex min-h-[45.5px] shrink-0 items-center justify-between gap-2 border-b border-outline bg-surface-low px-3.5 flex-wrap">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <h3 className="m-0 text-xs font-bold tracking-[0.4px] text-on-surface">Input</h3>
            </div>
            <ViewSeg value={inputView} onChange={onInputViewChange} />
          </div>
          <InputTools
            hasInput={inputTools.hasInput}
            onFormatInput={inputTools.onFormatInput}
            onMinifyInput={inputTools.onMinifyInput}
            onRepair={inputTools.onRepair}
            onUpload={inputTools.onUpload}
            onCopyInput={inputTools.onCopyInput}
            copiedInput={inputTools.copiedInput}
            canUndo={inputTools.canUndo}
            canRedo={inputTools.canRedo}
            onUndo={inputTools.onUndo}
            onRedo={inputTools.onRedo}
            onClear={inputTools.onClear}
            onFullscreen={inputTools.onFullscreen}
            uploadButtonRef={inputTools.uploadButtonRef}
            showUpload={inputTools.showUpload}
          />
        </div>
        {inputView === "code" ? (
          <CodeEditor
            value={source}
            minLines={10}
            id={inputEditorId}
            label="JSON input"
            describedBy={error ? inputErrorId : undefined}
            placeholder={'Paste JSON, for example {"enabled": true}'}
            ariaInvalid={error ? true : undefined}
            onChange={onInputChange}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            textareaRef={inputRef}
          />
        ) : outcome.parsedValue ? (
          <TreePane
            value={outcome.parsedValue}
            totalValues={outcome.totalValues}
            sizeLabel={outcome.sizeLabel}
          />
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-xs text-on-faint">
            Enter valid JSON to browse it as a tree.
          </div>
        )}
        {error ? (
          <p
            id={inputErrorId}
            role="alert"
            className="m-0 shrink-0 border-t border-danger/30 bg-danger-soft px-3 py-2 text-[11px] text-danger"
          >
            {error}
          </p>
        ) : null}
      </section>

      {/* Center Action Rail with Auto Toggle */}
      <div className="flex w-[68px] shrink-0 flex-col items-center justify-center gap-2 py-2 select-none self-center max-lg:w-full max-lg:flex-row max-lg:flex-wrap max-lg:gap-3 max-lg:my-2">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onBeautify}
            aria-label="Beautify JSON"
            aria-pressed={format.mode === "beautify"}
            title="Beautify JSON with indent"
            className="flex size-[40px] items-center justify-center rounded-[10px] border border-outline bg-surface-low text-on-muted transition-colors cursor-pointer hover:bg-surface hover:text-on-surface hover:border-outline-strong active:bg-primary-soft active:text-primary active:border-primary/50"
          >
            <UnfoldVertical className="size-[16px]" aria-hidden="true" />
          </button>
          <span className="text-[9px] font-medium text-on-muted max-lg:hidden">Beautify</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onMinify}
            aria-label="Minify JSON"
            aria-pressed={format.mode === "minify"}
            title="Minify JSON (compact)"
            className="flex size-[40px] items-center justify-center rounded-[10px] border border-outline bg-surface-low text-on-muted transition-colors cursor-pointer hover:bg-surface hover:text-on-surface hover:border-outline-strong active:bg-primary-soft active:text-primary active:border-primary/50"
          >
            <FoldVertical className="size-[16px]" aria-hidden="true" />
          </button>
          <span className="text-[9px] font-medium text-on-muted max-lg:hidden">Minify</span>
        </div>

        {onSwap ? (
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={onSwap}
              aria-label="Swap output to input"
              title="Swap output into input"
              className="flex size-[40px] items-center justify-center rounded-[10px] border border-outline bg-surface-low text-on-muted hover:bg-surface hover:text-on-surface hover:border-primary transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="size-[16px]" aria-hidden="true" />
            </button>
            <span className="text-[9px] font-medium text-on-muted max-lg:hidden">Swap</span>
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onValidate}
            aria-label="Validate"
            title="Validate the current input"
            className="flex size-[40px] items-center justify-center rounded-[10px] border border-outline bg-surface-low text-on-muted hover:bg-surface hover:text-on-surface hover:border-success transition-colors cursor-pointer"
          >
            <CheckCircle2 className="size-[16px]" aria-hidden="true" />
          </button>
          <span className="text-[9px] font-medium uppercase text-on-muted max-lg:hidden">
            VALIDATE
          </span>
        </div>

        {onAutoFormatChange && (
          <AutoTransformToggle
            autoFormat={Boolean(autoFormat)}
            onToggle={() => onAutoFormatChange(!autoFormat)}
            noun="format"
          />
        )}
      </div>

      <section
        ref={outputCardRef}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-outline bg-surface focus-within:border-success focus-within:ring-1 focus-within:ring-success/30 transition-all duration-150 max-lg:min-h-72 max-lg:flex-none"
      >
        <div className="flex min-h-[45.5px] shrink-0 items-center justify-between gap-2 border-b border-outline bg-surface-low px-3.5 flex-wrap">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
              <h3 className="m-0 text-xs font-bold tracking-[0.4px] text-on-surface">Output</h3>
            </div>
            <ViewSeg value={outputView} onChange={onOutputViewChange} />
          </div>
          <OutputTools
            disabled={outputTools.disabled}
            onFormatOutput={outputTools.onFormatOutput}
            onMinifyOutput={outputTools.onMinifyOutput}
            onCopyOutput={outputTools.onCopyOutput}
            copiedOutput={outputTools.copiedOutput}
            onDownload={outputTools.onDownload}
            onPrint={outputTools.onPrint}
            onFullscreen={outputTools.onFullscreen}
            showDownload={outputTools.showDownload}
            showPrint={outputTools.showPrint}
          />
        </div>
        {outputView === "code" ? (
          <CodeEditor
            value={output}
            minLines={14}
            id={outputEditorId}
            label="Formatted JSON"
            placeholder="Formatted JSON appears here…"
            onChange={onOutputChange}
          />
        ) : outcome.parsedValue ? (
          <TreePane
            value={outcome.parsedValue}
            totalValues={outcome.totalValues}
            sizeLabel={outcome.sizeLabel}
          />
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center p-4 text-xs text-on-faint">
            Formatted JSON appears here…
          </div>
        )}
      </section>
    </div>
  );
}
