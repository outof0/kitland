import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { resolveLiveTransformOutput } from "../lib/transform-output";
import {
  useSyncEncodingTextTransform,
  type EncodingTextTransformHook,
} from "../tools/useSyncEncodingTextTransform";
import {
  ArrowLeftRight,
  Binary,
  Braces,
  Check,
  CircleAlert,
  Code,
  Code2,
  Copy,
  Eraser,
  FileInput,
  Globe,
  Hash,
  Radio,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { HostCodeEditor } from "./HostCodeEditor";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { InjectedEditorRef } from "./CodeEditorContext";
import type {
  EncodingTextFormat,
  EncodingTextMode,
  EncodingTextTool,
} from "../tools/encoding-text-transform";
import type { ToolCapabilities } from "../capabilities";

type FormatChoice = {
  readonly value: Exclude<EncodingTextFormat, undefined>;
  readonly label: string;
  readonly title: string;
};

type InputLimits = Readonly<Record<EncodingTextMode, number>>;

export type EncodingTransformWorkspaceProps = {
  readonly tool: EncodingTextTool;
  readonly title: string;
  readonly subtitle: string;
  readonly icon?: LucideIcon;
  readonly sample: string;
  readonly inputLimits: InputLimits;
  readonly formatLabel?: string;
  readonly formatChoices?: readonly FormatChoice[];
  readonly defaultFormat?: EncodingTextFormat;
  readonly contractNote?: string;
  readonly useTransform?: EncodingTextTransformHook;
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

const WORKER_FAILURE_CODES = new Set([
  "WORKER_UNAVAILABLE",
  "WORKER_FAILED",
  "WORKER_PROTOCOL_FAILED",
  "WORKER_MESSAGE_FAILED",
  "WORKER_POST_FAILED",
  "WORKER_TIMEOUT",
]);

function toolIconFor(tool: EncodingTextTool): LucideIcon {
  if (tool === "html-entities") return Code2;
  if (tool === "base64") return Binary;
  if (tool === "url-encode") return Globe;
  if (tool === "hex-text") return Hash;
  if (tool === "unicode-converter") return Braces;
  if (tool === "rot13-caesar") return RotateCcw;
  if (tool === "morse-code") return Radio;
  return Binary;
}

export function EncodingTransformWorkspace({
  tool,
  title,
  subtitle,
  icon,
  sample,
  inputLimits,
  formatLabel,
  formatChoices,
  defaultFormat,
  useTransform = useSyncEncodingTextTransform,
  initialInput,
  capabilities: _capabilities,
}: EncodingTransformWorkspaceProps) {
  void _capabilities;
  const inputId = useId();
  const outputId = useId();
  const inputHelpId = useId();
  const outputHelpId = useId();
  const errorId = useId();
  const inputRef = useRef<InjectedEditorRef>(null);
  const [mode, setMode] = useState<EncodingTextMode>("encode");
  const [format, setFormat] = useState<EncodingTextFormat>(defaultFormat);
  const [source, setSource] = useState(() => initialInput ?? "");

  useEffect(() => {
    if (initialInput !== undefined && initialInput !== "") {
      setSource(initialInput);
    }
  }, [initialInput]);
  const { isCopied, copy, clearCopy } = useCopyFeedback();
  const inputLimit = inputLimits[mode];
  const inputLimitError =
    source.length > inputLimit
      ? `Input exceeds the ${inputLimit.toLocaleString()} UTF-16 code unit limit.`
      : null;
  const state = useTransform(tool, mode, source, format, {
    enabled: !inputLimitError,
  });
  const workerError = !state.result.ok && WORKER_FAILURE_CODES.has(state.result.error.code);
  const resultErrorCode = !state.result.ok ? state.result.error.code : null;
  const error =
    source.length === 0 || state.isProcessing
      ? inputLimitError
      : (inputLimitError ?? (!state.result.ok ? state.result.error.message : null));
  const { output: resolvedOutput } = resolveLiveTransformOutput(
    source,
    state.isProcessing,
    state.result,
  );
  const output = inputLimitError || workerError ? "" : resolvedOutput;
  const nextMode: EncodingTextMode = mode === "encode" ? "decode" : "encode";
  const Icon = icon ?? toolIconFor(tool);

  const replaceSource = useCallback(
    (nextSource: string) => {
      clearCopy();
      setSource(nextSource);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    },
    [clearCopy],
  );

  const changeMode = useCallback(
    (next: EncodingTextMode) => {
      if (next === mode) return;
      setSource(output);
      clearCopy();
      setMode(next);
    },
    [clearCopy, mode, output],
  );

  const isHtml = tool === "html-entities";
  const encodeLabel = "Encode";
  const decodeLabel = "Decode";

  const toolLabels: Record<
    string,
    { encode: [string, string]; decode: [string, string]; tag: string }
  > = {
    "html-entities": {
      encode: ["Text input", "HTML Entities result"],
      decode: ["HTML Entities input", "Text result"],
      tag: "HTML",
    },
    "url-encode": {
      encode: ["URL component input", "Percent-encoded result"],
      decode: ["Percent-encoded input", "URL component result"],
      tag: "URL ENCODE",
    },
    "hex-text": {
      encode: ["Text input", "Hex Text result"],
      decode: ["Hex Text input", "Text result"],
      tag: "HEX",
    },
    "unicode-converter": {
      encode: ["Text input", "Unicode Converter result"],
      decode: ["Unicode Converter input", "Text result"],
      tag: "UNICODE",
    },
    "binary-text": {
      encode: ["Text input", "Binary Text result"],
      decode: ["Binary Text input", "Text result"],
      tag: "BINARY",
    },
    "rot13-caesar": {
      encode: ["Text input", "ROT13 Caesar result"],
      decode: ["ROT13 Caesar input", "Text result"],
      tag: "ROT13",
    },
    "morse-code": {
      encode: ["Text input", "Morse Code result"],
      decode: ["Morse Code input", "Text result"],
      tag: "MORSE",
    },
  };

  const currentToolConfig = toolLabels[tool] || {
    encode: ["Text input", "Encoded result"],
    decode: ["Encoded input", "Decoded result"],
    tag: tool.toUpperCase().replace("-", " "),
  };

  const inputLabel = mode === "encode" ? currentToolConfig.encode[0] : currentToolConfig.decode[0];
  const outputLabel = mode === "encode" ? currentToolConfig.encode[1] : currentToolConfig.decode[1];
  const langTag = currentToolConfig.tag;

  const status =
    source.length === 0
      ? "Waiting"
      : state.isProcessing
        ? "Processing"
        : error
          ? workerError
            ? "Unavailable"
            : inputLimitError || resultErrorCode === "INPUT_TOO_LARGE"
              ? "Limit"
              : "Error"
          : mode === "encode"
            ? isHtml
              ? "Escaped"
              : "Encoded"
            : isHtml
              ? "Unescaped"
              : "Decoded";

  const isSuccess =
    status === "Escaped" || status === "Unescaped" || status === "Encoded" || status === "Decoded";

  const totalLines = source ? source.split("\n").length : 0;
  const totalChars = source.length;
  const entitiesCount = useMemo(() => {
    if (!isHtml || !output) return null;
    const matches = output.match(/&[a-zA-Z0-9#x]+;/g);
    return matches ? matches.length : 0;
  }, [isHtml, output]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      {/* Tool Header */}
      <header className="flex min-h-[52px] shrink-0 items-center justify-between gap-4 flex-wrap pb-1">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-low border border-outline text-primary"
            aria-hidden="true"
          >
            <Icon className="size-5 text-primary" />
          </div>
          <div>
            <h2
              id="tool-title"
              className="m-0 font-display text-[20px] font-bold tracking-[-0.02em] text-on-surface"
            >
              {title}
            </h2>
            <p className="m-0 mt-0.5 text-[13px] text-on-muted max-sm:hidden">{subtitle}</p>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-[8px]">
          <button
            type="button"
            className="h-[34px] px-3 rounded-[8px] bg-surface-low border border-outline text-[13px] font-semibold text-on-surface flex items-center gap-[7px] hover:bg-surface hover:border-outline-strong transition-colors cursor-pointer"
            onClick={() => {
              clearCopy();
              setMode("encode");
              setFormat(defaultFormat);
              replaceSource(sample);
            }}
            aria-label="Sample"
          >
            <FileInput className="size-[15px] text-on-muted" aria-hidden="true" />
            <span>Sample</span>
          </button>
        </div>
      </header>

      {/* Options Bar */}
      <div className="flex h-[52px] shrink-0 items-center gap-[8px] px-1">
        <div
          className="flex h-[32px] items-center gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]"
          aria-label="Conversion mode"
        >
          <button
            type="button"
            className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
              mode === "encode"
                ? "text-primary-strong"
                : "bg-transparent text-on-muted hover:text-on-surface"
            }`}
            aria-pressed={mode === "encode"}
            onClick={() => changeMode("encode")}
            disabled={state.isProcessing}
          >
            {encodeLabel}
          </button>
          <button
            type="button"
            className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
              mode === "decode"
                ? "text-primary-strong"
                : "bg-transparent text-on-muted hover:text-on-surface"
            }`}
            aria-pressed={mode === "decode"}
            onClick={() => changeMode("decode")}
            disabled={state.isProcessing}
          >
            {decodeLabel}
          </button>
        </div>

        {formatChoices && formatLabel && mode === "encode" ? (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] font-semibold text-on-muted uppercase tracking-wider">
              {formatLabel}
            </span>
            <div
              className="flex items-center gap-1 p-[2px] bg-surface-low border border-outline rounded-[8px]"
              aria-label={formatLabel}
            >
              {formatChoices.map((choice) => {
                const isActive = format === choice.value;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? "text-primary-strong"
                        : "bg-transparent text-on-muted hover:text-on-surface"
                    }`}
                    aria-pressed={isActive}
                    onClick={() => {
                      clearCopy();
                      setFormat(choice.value);
                    }}
                    title={choice.title}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Editor Area */}
      <div className="tool-editor-stage grid min-h-0 min-w-0 flex-1 overflow-hidden grid-cols-1 grid-rows-[minmax(0,16rem)_3rem_minmax(0,16rem)] gap-0 lg:grid-cols-[minmax(0,1fr)_60px_minmax(0,1fr)] lg:grid-rows-[minmax(16rem,1fr)]">
        {/* Input Card */}
        <section className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[12px] bg-surface border border-outline focus-within:border-primary focus-within:shadow-[0_0_10px_1px_rgba(37,99,235,0.25)] transition-all duration-150">
          <div className="flex h-[45.5px] shrink-0 items-center justify-between gap-2 bg-surface-low border-b border-outline px-4">
            <div className="flex min-w-0 items-center gap-[6px]">
              <span className="size-[8px] shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <h3 className="m-0 font-display text-[12px] font-bold tracking-[0.4px] text-on-surface">
                {inputLabel}
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
                onClick={() => void copy("input", source)}
                disabled={!source}
                aria-label={isCopied("input") ? `Copied ${inputLabel}` : `Copy ${inputLabel}`}
                title={isCopied("input") ? `Copied ${inputLabel}` : `Copy ${inputLabel}`}
              >
                {isCopied("input") ? (
                  <Check className="size-4 text-success" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </button>
              <div className="w-[1px] h-[16px] bg-outline mx-1"></div>
              <button
                type="button"
                className="size-[32px] rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-30"
                onClick={() => replaceSource("")}
                disabled={!source}
                aria-label={`Clear ${inputLabel}`}
                title={`Clear ${inputLabel}`}
              >
                <Eraser className="size-[14px]" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-row overflow-hidden bg-surface">
            <HostCodeEditor
              ref={inputRef}
              id={inputId}
              value={source}
              onChange={(next) => {
                clearCopy();
                setSource(next);
              }}
              language={isHtml ? "html" : "text"}
              placeholder={
                mode === "encode"
                  ? '<p>Hi "World" & friends</p>'
                  : "&lt;p&gt;Hi &quot;World&quot; &amp; friends&lt;/p&gt;"
              }
              ariaLabel={inputLabel}
              ariaDescribedBy={`${inputHelpId}${error ? ` ${errorId}` : ""}`}
              ariaInvalid={error ? true : undefined}
            />
          </div>
          {error ? (
            <div
              id={errorId}
              className="m-0 shrink-0 border-t border-danger/35 bg-danger-soft px-4 py-2 text-xs text-danger flex items-center gap-2"
              role="alert"
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{error}</span>
            </div>
          ) : null}
        </section>

        {/* Swap Rail */}
        <div className="flex min-h-0 min-w-0 w-[60px] flex-col items-center justify-center gap-1 select-none">
          <button
            type="button"
            className="size-[44px] rounded-[10px] bg-surface-low border border-outline text-on-muted hover:text-on-surface hover:border-primary flex items-center justify-center transition-colors cursor-pointer"
            onClick={() => changeMode(nextMode)}
            aria-label="Swap"
            title="Swap input and output"
          >
            <ArrowLeftRight className="size-[18px]" />
          </button>
          <span className="text-[9.5px] font-display font-medium text-on-muted text-center">
            Swap
          </span>
        </div>

        {/* Output Card */}
        <section className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[12px] bg-surface border border-outline focus-within:border-success focus-within:shadow-[0_0_10px_1px_rgba(52,211,153,0.25)] transition-all duration-150">
          <div className="flex h-[45.5px] shrink-0 items-center justify-between gap-2 bg-surface-low border-b border-outline px-4">
            <div className="flex min-w-0 items-center gap-[6px]">
              <span className="size-[8px] shrink-0 rounded-full bg-success" aria-hidden="true" />
              <h3 className="m-0 font-display text-[12px] font-bold tracking-[0.4px] text-on-surface">
                {outputLabel}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isCopied("output") ? (
                <span
                  className="text-[11px] font-medium text-success"
                  role="status"
                  aria-live="polite"
                >
                  Result copied.
                </span>
              ) : null}
              <button
                type="button"
                className={`size-[32px] rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-30 ${
                  isCopied("output")
                    ? "bg-success-soft text-success border border-success/40"
                    : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                }`}
                onClick={() => void copy("output", output)}
                disabled={!output || workerError}
                aria-label={isCopied("output") ? `Copied ${outputLabel}` : `Copy ${outputLabel}`}
                title={isCopied("output") ? `Copied ${outputLabel}` : `Copy ${outputLabel}`}
              >
                {isCopied("output") ? (
                  <Check className="size-4 text-success" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-row overflow-hidden bg-surface">
            <HostCodeEditor
              id={outputId}
              value={output}
              readOnly
              language={isHtml ? "html" : "text"}
              placeholder={state.isProcessing ? "Processing result…" : "Result appears here…"}
              ariaLabel={outputLabel}
              ariaDescribedBy={outputHelpId}
            />
          </div>
        </section>
      </div>

      {/* Status Bar */}
      <footer className="flex h-[44px] shrink-0 items-center justify-between gap-[12px] rounded-[10px] bg-surface-low border border-outline px-[16px]">
        <div className="flex min-w-0 items-center gap-[8px]">
          <div
            className={`flex items-center gap-[5px] px-[9px] py-[5px] rounded-[6px] text-[11px] font-medium ${
              isSuccess
                ? "bg-success-soft text-success"
                : status === "Error" || status === "Limit"
                  ? "bg-danger-soft text-danger"
                  : "bg-surface text-on-muted"
            }`}
          >
            <span>{status}</span>
          </div>
          <div className="flex items-center gap-[16px] text-[12px] font-mono text-on-muted max-sm:hidden">
            <span>
              {totalLines} line{totalLines === 1 ? "" : "s"}
            </span>
            <span>{totalChars} chars</span>
            {entitiesCount !== null ? <span>{entitiesCount} entities</span> : null}
          </div>
        </div>
        <div className="flex items-center">
          <div className="flex items-center gap-[6px] px-[10px] py-[4px] rounded-[6px] bg-surface border border-outline text-[11px] font-mono font-bold text-primary-strong">
            <Code className="size-[13px] text-primary-strong" />
            <span>{langTag}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
