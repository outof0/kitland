import { AutoTransformToggle } from "./AutoTransformToggle";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { usePersistedAutoTransform } from "../hooks/usePersistedAutoTransform";
import { downloadText, pickTextFile } from "../lib/clipboard";
import { beautifyCode, minifyCode } from "../lib/editor-tools";
import type { DeferredTextTransformState } from "../hooks/useDeferredTextTransform";
import {
  resolveEditorLanguage,
  useCodeEditorContext,
  type InjectedEditorLanguage,
  type InjectedEditorRef,
} from "./CodeEditorContext";
import { HostCodeEditor } from "./HostCodeEditor";
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  CircleAlert,
  Copy,
  Download,
  FileInput,
  FoldVertical,
  Share2,
  Trash2,
  UnfoldVertical,
  Upload,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

export type TextTransformEditorProps = {
  readonly icon: ComponentType<{ className?: string }>;
  readonly title: string;
  readonly description: string;
  readonly inputLabel?: string;
  readonly outputLabel?: string;
  readonly placeholder: string;
  readonly source: string;
  readonly onSourceChange: (value: string) => void;
  readonly onSample: () => void;
  readonly maxInputChars: number;
  readonly state: DeferredTextTransformState;
  readonly options?: ReactNode;
  readonly langTag?: string;
  readonly onSwap?: () => void;
  readonly showSwap?: boolean;
  readonly swapLabel?: string;
  readonly swapText?: string;
  readonly actionLabel?: string;
  readonly actionIcon?: LucideIcon;
  readonly outputExtension?: string;
  readonly outputMimeType?: string;
  readonly indentLabel?: string;
  readonly validLabel?: string;
  readonly inputLanguage?: string;
  readonly outputLanguage?: string;
  /** When true the result pane is editable in place (defaults to the host context). */
  readonly editableOutput?: boolean;
  /** Tab indentation for the injected editor panes. Defaults to 2. */
  readonly indentSize?: 2 | 4;
  readonly onManualRun?: () => void;
  readonly onOutputChange?: (value: string) => void;
  readonly showShare?: boolean;
  readonly onShare?: () => string | void | Promise<string | void>;
  readonly shareDisclosure?: string;
  readonly showBeautifyMinify?: boolean;
  readonly showUpload?: boolean;
  readonly showDownload?: boolean;
  readonly showCopyOutput?: boolean;
  readonly showClearInput?: boolean;
  readonly autoFormatDefault?: boolean;
  /** When false, Auto stays session-local (generate tools). Default follows autoFormatDefault. */
  readonly persistAutoPreference?: boolean;
  readonly customGutter?: (line: number) => ReactNode;
  readonly outputFileName?: string;
  readonly copyOutputLabel?: string;
  readonly saveResultLabel?: string;
  readonly allowEmptyInput?: boolean;
  readonly onOptionChange?: (key: string, value: unknown) => void;
  /** Diff pattern: secondary (B) pane. When set, renders A | Swap | B + output. */
  readonly secondary?: string;
  readonly onSecondaryChange?: (value: string) => void;
  readonly secondaryLabel?: string;
  readonly secondaryPlaceholder?: string;
  readonly secondaryMaxChars?: number;
  readonly onSwapSecondary?: () => void;
  /** When true, hide the central Run/Convert button while Auto is on (live transform contract). Defaults to the auto-format policy. */
  readonly hideActionWhenAuto?: boolean;
  /** Custom action controls rendered inside the center action rail. */
  readonly extraRailActions?: ReactNode;
};

type PaneProps = {
  readonly paneId: string;
  readonly label: string;
  readonly source: string;
  readonly onChange: (value: string) => void;
  readonly error: string | null;
  readonly helpId: string;
  readonly placeholder: string;
  readonly maxChars: number;
  readonly linesCount: number;
  readonly showBeautifyMinify: boolean;
  readonly showUpload: boolean;
  readonly copied: boolean;
  readonly onCopy: () => void;
  readonly onClear: () => void;
  readonly onUpload: () => void;
  readonly onBeautify: () => void;
  readonly onMinify: () => void;
  readonly inputRef: React.RefObject<InjectedEditorRef | null>;
  readonly language: InjectedEditorLanguage | null;
  readonly indentSize?: 2 | 4;
  readonly onSubmit?: (() => void) | undefined;
};

type PaneBodyProps = {
  readonly paneId: string;
  readonly label: string;
  readonly value: string;
  readonly onChange?: ((value: string) => void) | undefined;
  readonly readOnly?: boolean | undefined;
  readonly placeholder: string;
  readonly error: string | null;
  readonly helpId: string;
  readonly maxChars?: number | undefined;
  readonly language: InjectedEditorLanguage | null;
  readonly editorRef?: React.Ref<InjectedEditorRef> | undefined;
  readonly indentSize?: 2 | 4 | undefined;
  readonly onSubmit?: (() => void) | undefined;
};

function PaneBody({
  paneId,
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  error,
  helpId,
  maxChars,
  language,
  editorRef,
  indentSize,
  onSubmit,
}: PaneBodyProps) {
  return (
    <HostCodeEditor
      ref={editorRef}
      id={paneId}
      value={value}
      onChange={readOnly ? undefined : onChange}
      language={language ?? "text"}
      readOnly={readOnly}
      placeholder={placeholder}
      ariaLabel={label}
      ariaDescribedBy={helpId}
      ariaInvalid={error ? true : undefined}
      indentSize={indentSize}
      onSubmit={onSubmit}
      maxChars={maxChars}
    />
  );
}

function InputPane({
  paneId,
  label,
  source,
  onChange,
  error,
  helpId,
  placeholder,
  maxChars,
  linesCount,
  showBeautifyMinify,
  showUpload,
  copied,
  onCopy,
  onClear,
  onUpload,
  onBeautify,
  onMinify,
  inputRef,
  language,
  indentSize,
  onSubmit,
}: PaneProps) {
  return (
    <section
      className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border ${
        error ? "border-danger/40" : "border-outline"
      } bg-surface focus-within:${
        error ? "border-danger ring-danger/30" : "border-primary ring-primary/30"
      } focus-within:ring-1 transition-all duration-150 max-lg:h-[min(30rem,60dvh)] max-lg:min-h-72 max-lg:flex-none tool-card tool-card--in`}
    >
      <div className="min-h-[46px] bg-surface-low border-b border-outline px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          <h3 className="m-0 text-[12px] font-bold tracking-[0.4px] text-on-surface font-display truncate">
            {label}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {showBeautifyMinify && (
            <>
              <button
                type="button"
                title={`Beautify ${label} in place`}
                aria-label={`Beautify ${label}`}
                className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={onBeautify}
                disabled={!source}
              >
                <UnfoldVertical className="size-4" />
              </button>
              <button
                type="button"
                title={`Minify ${label} in place`}
                aria-label={`Minify ${label}`}
                className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={onMinify}
                disabled={!source}
              >
                <FoldVertical className="size-4" />
              </button>
              <div className="w-[1px] h-[16px] bg-outline mx-0.5" />
            </>
          )}
          <button
            type="button"
            title={copied ? "Copied" : `Copy ${label}`}
            aria-label={copied ? "Copied" : `Copy ${label}`}
            className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              copied
                ? "bg-success-soft text-success border border-success/40"
                : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
            }`}
            onClick={onCopy}
            disabled={!source}
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </button>
          {showUpload && (
            <button
              type="button"
              title="Upload file"
              aria-label="Upload file"
              className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer"
              onClick={onUpload}
            >
              <Upload className="size-4" />
            </button>
          )}
          <div className="w-[1px] h-[16px] bg-outline mx-0.5" />
          <button
            type="button"
            title="Clear input"
            aria-label="Clear input"
            className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={onClear}
            disabled={!source}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-row overflow-hidden bg-surface">
        <PaneBody
          paneId={paneId}
          label={label}
          value={source}
          onChange={onChange}
          placeholder={placeholder}
          error={error}
          helpId={helpId}
          maxChars={maxChars}
          language={language}
          editorRef={inputRef}
          indentSize={indentSize}
          onSubmit={onSubmit}
        />
      </div>

      <div
        id={helpId}
        className="tool-card__hint h-[34px] min-h-[34px] px-3.5 py-2 border-t border-outline bg-surface-low flex items-center justify-between text-[11px] text-on-muted"
      >
        {error ? (
          <span
            className="tool-card__validation text-danger flex items-center gap-1.5"
            role="alert"
          >
            <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </span>
        ) : (
          <span>
            {linesCount} {linesCount === 1 ? "line" : "lines"} · {source.length.toLocaleString()}{" "}
            chars
          </span>
        )}
      </div>
    </section>
  );
}

type OutputPaneProps = {
  readonly paneId: string;
  readonly label: string;
  readonly output: string;
  readonly editable: boolean;
  readonly onChange: (value: string) => void;
  readonly isProcessing: boolean;
  readonly helpId: string;
  readonly linesCount: number;
  readonly showBeautifyMinify: boolean;
  readonly showDownload: boolean;
  readonly copied: boolean;
  readonly copyLabel: string;
  readonly saveLabel: string;
  readonly language: InjectedEditorLanguage | null;
  readonly indentSize?: 2 | 4;
  readonly onCopy: () => void;
  readonly onDownload: () => void;
  readonly onBeautify: () => void;
  readonly onMinify: () => void;
};

function OutputPane({
  paneId,
  label,
  output,
  editable,
  onChange,
  isProcessing,
  helpId,
  linesCount,
  showBeautifyMinify,
  showDownload,
  copied,
  copyLabel,
  saveLabel,
  language,
  indentSize,
  onCopy,
  onDownload,
  onBeautify,
  onMinify,
}: OutputPaneProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-outline bg-surface focus-within:border-success focus-within:ring-1 focus-within:ring-success/30 transition-all duration-150 max-lg:h-[min(30rem,60dvh)] max-lg:min-h-72 max-lg:flex-none tool-card tool-card--out">
      <div className="min-h-[46px] bg-surface-low border-b border-outline px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-2 rounded-full bg-success" aria-hidden="true" />
          <h3 className="m-0 text-[12px] font-bold tracking-[0.4px] text-on-surface font-display truncate">
            {label}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {showBeautifyMinify && (
            <>
              <button
                type="button"
                title={`Beautify ${label} in place`}
                aria-label={`Beautify ${label}`}
                className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={onBeautify}
                disabled={!output}
              >
                <UnfoldVertical className="size-4" />
              </button>
              <button
                type="button"
                title={`Minify ${label} in place`}
                aria-label={`Minify ${label}`}
                className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={onMinify}
                disabled={!output}
              >
                <FoldVertical className="size-4" />
              </button>
              <div className="w-[1px] h-[16px] bg-outline mx-0.5" />
            </>
          )}
          <button
            type="button"
            title={copied ? "Copied" : copyLabel}
            aria-label={copied ? "Copied" : copyLabel}
            className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              copied
                ? "bg-success-soft text-success border border-success/40"
                : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
            }`}
            onClick={onCopy}
            disabled={!output}
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </button>
          {showDownload && (
            <button
              type="button"
              title={saveLabel}
              aria-label={saveLabel}
              className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={onDownload}
              disabled={!output}
            >
              <Download className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-row overflow-hidden bg-surface">
        <PaneBody
          paneId={paneId}
          label={label}
          value={output}
          onChange={editable ? onChange : undefined}
          readOnly={!editable}
          placeholder={isProcessing ? "Processing result…" : "Result appears here…"}
          error={null}
          helpId={helpId}
          language={language}
          indentSize={indentSize}
        />
      </div>

      <div
        id={helpId}
        className="tool-card__hint h-[34px] min-h-[34px] px-3.5 py-2 border-t border-outline bg-surface-low flex items-center justify-between text-[11px] text-on-muted"
      >
        <span>
          {linesCount} {linesCount === 1 ? "line" : "lines"} · {output.length.toLocaleString()}{" "}
          chars
        </span>
      </div>
    </section>
  );
}

export function TextTransformEditor({
  icon: HeaderIcon,
  title,
  description,
  inputLabel = "Input",
  outputLabel = "Output",
  placeholder,
  source,
  onSourceChange,
  onSample,
  maxInputChars,
  state,
  options,
  langTag,
  onSwap,
  showSwap = onSwap !== undefined,
  swapLabel = "Swap input and output",
  swapText = "Swap",
  actionLabel = "Transform",
  actionIcon: ActionIcon,
  outputExtension = "txt",
  outputMimeType: _outputMimeType = "text/plain",
  indentLabel: _indentLabel,
  validLabel,
  inputLanguage,
  outputLanguage,
  editableOutput,
  indentSize = 2,
  onManualRun,
  onOutputChange,
  showShare = false,
  onShare,
  shareDisclosure,
  showBeautifyMinify = false,
  showUpload = false,
  showDownload = false,
  showCopyOutput: _showCopyOutput = true,
  autoFormatDefault = true,
  persistAutoPreference,
  allowEmptyInput = false,
  outputFileName,
  copyOutputLabel,
  saveResultLabel = "Save result",
  secondary,
  onSecondaryChange,
  secondaryLabel = "Changed (B)",
  secondaryPlaceholder = "Paste or type changed text…",
  secondaryMaxChars,
  onSwapSecondary,
  hideActionWhenAuto = autoFormatDefault,
  extraRailActions,
}: TextTransformEditorProps) {
  const headingId = useId();
  const inputId = useId();
  const outputId = useId();
  const inputHelpId = useId();
  const outputHelpId = useId();
  const secondaryId = useId();
  const secondaryHelpId = useId();

  const inputRef = useRef<InjectedEditorRef>(null);
  const secondaryInputRef = useRef<InjectedEditorRef>(null);

  const [autoFormat, setAutoFormat] = usePersistedAutoTransform(
    persistAutoPreference ?? autoFormatDefault,
    autoFormatDefault,
  );
  const [manualOutput, setManualOutput] = useState<string | null>(null);
  const [committedOutput, setCommittedOutput] = useState<string>("");
  const [shareError, setShareError] = useState<string | null>(null);
  const { isCopied, copy } = useCopyFeedback();
  const editorContext = useCodeEditorContext();

  const isDiff = onSecondaryChange !== undefined;
  const hasInput = source.length > 0 || allowEmptyInput;
  const error = !state.isProcessing && !state.result.ok ? state.result.error.message : null;
  const liveOutput = !state.isProcessing && state.result.ok ? state.result.value : "";

  const outputEditable = editableOutput ?? editorContext?.editableOutput ?? false;
  const inputLanguageId = resolveEditorLanguage(langTag, inputLanguage);
  const outputLanguageId = resolveEditorLanguage(langTag, outputLanguage);

  const output = autoFormat
    ? manualOutput !== null
      ? manualOutput
      : liveOutput
    : manualOutput !== null
      ? manualOutput
      : committedOutput;

  useEffect(() => {
    if (autoFormat) {
      setManualOutput(null);
      setCommittedOutput(liveOutput);
    }
  }, [source, autoFormat, liveOutput]);

  const toggleAutoFormat = useCallback(() => {
    setAutoFormat((prev) => {
      const next = !prev;
      if (next) {
        setManualOutput(null);
        setCommittedOutput(liveOutput);
      } else {
        setCommittedOutput(output);
        setManualOutput(null);
      }
      return next;
    });
  }, [liveOutput, output]);

  const handleManualRun = useCallback(() => {
    if (onManualRun) {
      onManualRun();
    } else {
      setManualOutput(null);
      setCommittedOutput(liveOutput);
    }
  }, [onManualRun, liveOutput]);

  const clear = useCallback(() => {
    onSourceChange("");
    setManualOutput(null);
    setCommittedOutput("");
    inputRef.current?.focus();
  }, [onSourceChange]);

  const clearSecondary = useCallback(() => {
    onSecondaryChange?.("");
    setManualOutput(null);
    setCommittedOutput("");
  }, [onSecondaryChange]);

  const handleUploadClick = useCallback(async () => {
    const res = await pickTextFile({
      accept: ".txt,.json,.xml,.yaml,.yml,.sql,.js,.ts,.html,.md",
      maxChars: maxInputChars,
    });
    if (res.ok) {
      onSourceChange(res.text);
    }
  }, [maxInputChars, onSourceChange]);

  const handleSecondaryUploadClick = useCallback(async () => {
    const res = await pickTextFile({
      accept: ".txt,.json,.xml,.yaml,.yml,.sql,.js,.ts,.html,.md",
      maxChars: secondaryMaxChars ?? maxInputChars,
    });
    if (res.ok) {
      onSecondaryChange?.(res.text);
    }
  }, [maxInputChars, onSecondaryChange, secondaryMaxChars]);

  const handleDownloadOutput = useCallback(() => {
    if (!output) return;
    const filename =
      outputFileName ??
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-output.${outputExtension}`;
    downloadText(filename, output);
  }, [output, title, outputFileName, outputExtension]);

  const copyInput = useCallback(async () => {
    if (!source) return;
    await copy("input", source);
  }, [copy, source]);

  const copySecondary = useCallback(async () => {
    if (!secondary) return;
    await copy("secondary", secondary);
  }, [copy, secondary]);

  const copyOutput = useCallback(async () => {
    if (!output) return;
    await copy("output", output);
  }, [copy, output]);

  const handleShare = useCallback(async () => {
    if (!onShare) return;
    setShareError(null);
    try {
      const shareUrl = await onShare();
      if (typeof shareUrl === "string" && shareUrl) {
        const result = await copy("share", shareUrl);
        if (!result.ok) {
          setShareError(result.message ?? "Could not copy share link.");
        }
      }
    } catch (err) {
      setShareError(
        err instanceof Error ? err.message : "Could not create share link. Copy failed.",
      );
    }
  }, [onShare, copy]);

  const handleSwap = useCallback(() => {
    if (isDiff) {
      onSwapSecondary?.();
      setManualOutput(null);
      setCommittedOutput("");
      return;
    }
    if (onSwap) {
      onSwap();
      setManualOutput(null);
      setCommittedOutput("");
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isDiff, onSwap, onSwapSecondary]);

  const handleBeautifyInput = useCallback(() => {
    if (!source) return;
    const beautified = beautifyCode(source);
    if (beautified && beautified !== source) onSourceChange(beautified);
  }, [source, onSourceChange]);

  const handleMinifyInput = useCallback(() => {
    if (!source) return;
    const minified = minifyCode(source);
    if (minified && minified !== source) onSourceChange(minified);
  }, [source, onSourceChange]);

  const handleBeautifySecondary = useCallback(() => {
    if (!secondary) return;
    const beautified = beautifyCode(secondary);
    if (beautified && beautified !== secondary) onSecondaryChange?.(beautified);
  }, [secondary, onSecondaryChange]);

  const handleMinifySecondary = useCallback(() => {
    if (!secondary) return;
    const minified = minifyCode(secondary);
    if (minified && minified !== secondary) onSecondaryChange?.(minified);
  }, [secondary, onSecondaryChange]);

  const handleBeautifyOutput = useCallback(() => {
    if (!output) return;
    const beautified = beautifyCode(output);
    if (beautified) {
      setManualOutput(beautified);
      onOutputChange?.(beautified);
    }
  }, [output, onOutputChange]);

  const handleMinifyOutput = useCallback(() => {
    if (!output) return;
    const minified = minifyCode(output);
    if (minified) {
      setManualOutput(minified);
      onOutputChange?.(minified);
    }
  }, [output, onOutputChange]);

  const handleOutputEdit = useCallback(
    (value: string) => {
      setManualOutput(value);
      onOutputChange?.(value);
    },
    [onOutputChange],
  );

  const inputLinesCount = useMemo(() => {
    return source ? source.split("\n").length : 0;
  }, [source]);

  const secondaryLinesCount = useMemo(() => {
    return secondary ? secondary.split("\n").length : 0;
  }, [secondary]);

  const outputLinesCount = useMemo(() => {
    return output ? output.split("\n").length : 0;
  }, [output]);

  const ActiveActionIcon = ActionIcon ?? ArrowRight;

  const status = state.isProcessing
    ? "Processing…"
    : error
      ? "Fix input"
      : output
        ? "Ready"
        : "Waiting for input";

  const statusClass = error
    ? "bg-danger-soft text-danger"
    : state.isProcessing
      ? "bg-primary-soft text-primary animate-pulse"
      : output
        ? "bg-success-soft text-success"
        : "bg-surface text-on-muted";

  const inputPane = (
    <InputPane
      paneId={inputId}
      label={inputLabel}
      source={source}
      onChange={onSourceChange}
      error={error}
      helpId={inputHelpId}
      placeholder={placeholder}
      maxChars={maxInputChars}
      linesCount={inputLinesCount}
      showBeautifyMinify={showBeautifyMinify}
      showUpload={showUpload}
      copied={isCopied("input")}
      onCopy={() => void copyInput()}
      onClear={clear}
      onUpload={() => void handleUploadClick()}
      onBeautify={handleBeautifyInput}
      onMinify={handleMinifyInput}
      inputRef={inputRef}
      language={inputLanguageId}
      indentSize={indentSize}
      onSubmit={autoFormat && hideActionWhenAuto ? undefined : handleManualRun}
    />
  );

  const secondaryPane = isDiff ? (
    <InputPane
      paneId={secondaryId}
      label={secondaryLabel}
      source={secondary ?? ""}
      onChange={(value) => onSecondaryChange?.(value)}
      error={null}
      helpId={secondaryHelpId}
      placeholder={secondaryPlaceholder}
      maxChars={secondaryMaxChars ?? maxInputChars}
      linesCount={secondaryLinesCount}
      showBeautifyMinify={showBeautifyMinify}
      showUpload={showUpload}
      copied={isCopied("secondary")}
      onCopy={() => void copySecondary()}
      onClear={clearSecondary}
      onUpload={() => void handleSecondaryUploadClick()}
      onBeautify={handleBeautifySecondary}
      onMinify={handleMinifySecondary}
      inputRef={secondaryInputRef}
      language={inputLanguageId}
      indentSize={indentSize}
    />
  ) : null;

  const outputPane = (
    <OutputPane
      paneId={outputId}
      label={outputLabel}
      output={output}
      editable={outputEditable}
      onChange={handleOutputEdit}
      isProcessing={state.isProcessing}
      helpId={outputHelpId}
      linesCount={outputLinesCount}
      showBeautifyMinify={showBeautifyMinify}
      showDownload={showDownload}
      copied={isCopied("output")}
      copyLabel={copyOutputLabel ?? `Copy ${outputLabel}`}
      saveLabel={saveResultLabel}
      language={outputLanguageId}
      indentSize={indentSize}
      onCopy={() => void copyOutput()}
      onDownload={handleDownloadOutput}
      onBeautify={handleBeautifyOutput}
      onMinify={handleMinifyOutput}
    />
  );

  const swapButton = (
    <button
      type="button"
      className="flex size-[40px] items-center justify-center rounded-[10px] border border-outline bg-surface-low text-on-muted transition-colors cursor-pointer hover:bg-surface hover:text-on-surface hover:border-outline-strong active:bg-primary-soft active:text-primary active:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
      onClick={handleSwap}
      disabled={state.isProcessing}
      aria-label={swapLabel}
      title={swapLabel}
    >
      <ArrowLeftRight className="size-[18px]" />
    </button>
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3.5 w-full tool-editor">
      {/* Tool Header */}
      <div className="flex flex-col gap-1 pb-1 min-w-0 max-w-full">
        <div className="flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className="size-9 sm:size-11 bg-primary-soft border border-primary/30 rounded-[9px] sm:rounded-[11px] text-primary flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <HeaderIcon className="size-4.5 sm:size-[22px]" />
            </div>
            <div className="min-w-0">
              <h2
                id={headingId}
                className="text-base sm:text-[20px] font-bold font-display text-on-surface tracking-tight m-0 truncate"
              >
                {title}
              </h2>
              <p className="text-[13px] text-on-muted m-0 mt-0.5 max-sm:hidden">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onSample();
                inputRef.current?.focus();
              }}
              className="h-8 sm:h-[34px] px-2 sm:px-3 bg-surface-low border border-outline rounded-lg text-xs sm:text-[13px] font-semibold text-on-surface hover:bg-surface hover:border-outline-strong transition-colors flex items-center gap-1 sm:gap-1.5 cursor-pointer"
            >
              <FileInput className="size-3.5 sm:size-[15px] text-on-muted" />
              <span>Sample</span>
            </button>
            {showShare && (
              <button
                type="button"
                onClick={handleShare}
                aria-label={isCopied("share") ? "Link copied" : "Share input link"}
                title={isCopied("share") ? "Link copied" : "Share input link"}
                className={`h-8 sm:h-[34px] px-2 sm:px-3 rounded-lg text-xs sm:text-[13px] font-semibold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                  isCopied("share")
                    ? "border border-success/40 bg-success-soft text-success shadow-none"
                    : "border border-outline-strong bg-surface-low text-on-muted hover:text-on-surface hover:bg-surface"
                }`}
              >
                {isCopied("share") ? (
                  <Check className="size-3.5 sm:size-[15px] text-success" />
                ) : (
                  <Share2 className="size-3.5 sm:size-[15px]" />
                )}
                <span>Share</span>
              </button>
            )}
          </div>
        </div>
        {showShare && shareDisclosure && (
          <p className="max-w-[340px] text-left sm:text-right sm:self-end text-[11px] leading-snug text-on-faint m-0 mt-0.5">
            {shareDisclosure}
          </p>
        )}
        {shareError && (
          <p
            role="alert"
            className="max-w-[340px] text-left sm:text-right sm:self-end text-[11px] leading-snug text-danger m-0 mt-0.5"
          >
            {shareError}
          </p>
        )}
      </div>

      {/* Options Bar */}
      {options && (
        <div className="flex items-center justify-between flex-wrap gap-2 min-h-[40px] px-1">
          <div className="flex items-center gap-2 flex-wrap">{options}</div>
        </div>
      )}

      {/* Main Split Area */}
      {isDiff ? (
        <div className="tool-editor-stage flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <div className="flex min-h-0 min-w-0 flex-1 gap-3.5 overflow-hidden max-lg:flex-col max-lg:overflow-y-auto">
            {inputPane}
            <div className="flex w-[68px] shrink-0 flex-col items-center justify-center gap-2 py-2 select-none self-center max-lg:w-full max-lg:flex-row max-lg:gap-3 max-lg:my-2 tool-rail">
              <div className="flex flex-col items-center gap-1">
                {swapButton}
                <span className="text-[11px] font-medium text-on-muted text-center max-lg:hidden">
                  {swapText}
                </span>
              </div>
            </div>
            {secondaryPane}
          </div>
          {outputPane}
        </div>
      ) : (
        <div className="tool-editor-stage flex min-h-0 min-w-0 flex-1 gap-3.5 overflow-hidden max-lg:flex-col max-lg:overflow-y-auto">
          {inputPane}

          {/* Center Action Rail — live transforms expose manual Run only after Auto is switched off. */}
          <div className="flex w-[68px] shrink-0 flex-col items-center justify-center gap-2 py-2 select-none self-center max-lg:w-full max-lg:flex-row max-lg:gap-3 max-lg:my-2 tool-rail">
            {extraRailActions}

            {!hideActionWhenAuto || !autoFormat ? (
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  className="flex size-[40px] items-center justify-center rounded-[10px] border border-outline bg-surface-low text-on-muted transition-colors cursor-pointer hover:bg-surface hover:text-on-surface hover:border-outline-strong active:bg-primary-soft active:text-primary active:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                  onClick={handleManualRun}
                  disabled={!hasInput}
                  aria-label={actionLabel}
                  title={`${actionLabel} (Ctrl+Enter)`}
                >
                  <ActiveActionIcon className="size-[18px]" />
                </button>
                <span className="text-[11px] font-medium text-on-muted text-center max-lg:hidden">
                  {actionLabel}
                </span>
              </div>
            ) : null}

            {/* Swap Button if available */}
            {showSwap && (
              <div className="flex flex-col items-center gap-1">
                {swapButton}
                <span className="text-[11px] font-medium text-on-muted text-center max-lg:hidden">
                  {swapText}
                </span>
              </div>
            )}

            <AutoTransformToggle autoFormat={autoFormat} onToggle={toggleAutoFormat} />
          </div>

          {outputPane}
        </div>
      )}

      {/* Status Bar */}
      <footer
        aria-label={`${title} status`}
        className="flex h-[40px] shrink-0 items-center justify-between gap-3 rounded-[10px] bg-surface-low border border-outline px-4 tool-status"
      >
        <div className="flex items-center gap-3">
          <div className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium ${statusClass}`}>
            <span>{status}</span>
          </div>
          <div className="flex items-center gap-4 text-[12px] font-mono text-on-muted max-sm:hidden">
            <span>{inputLinesCount} lines in</span>
            <span>{outputLinesCount} lines out</span>
            {validLabel && <span>{validLabel}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {langTag && (
            <div className="px-2.5 py-1 rounded-[6px] bg-surface border border-outline text-[11px] font-mono font-bold text-primary-strong">
              <span>{langTag}</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
