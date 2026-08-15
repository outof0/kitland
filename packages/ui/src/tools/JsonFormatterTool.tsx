import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { usePersistedAutoTransform } from "../hooks/usePersistedAutoTransform";
import { downloadText, pickTextFile } from "../lib/clipboard";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { JSON_FORMATTER_MAX_INPUT_CHARS, repairJson, type JsonFormatMode } from "@kitland/core";
import type { InjectedEditorRef } from "../components/CodeEditorContext";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  formatBytes,
  ModeOptionsBar,
  stateSummary,
  SummaryBar,
  type FeedbackTone,
} from "./json-formatter/controls";
import { ToolHeader } from "./json-formatter/ToolHeader";
import { ToolArea } from "./json-formatter/ToolCards";
import type { JsonFormatterHook, JsonValue } from "./json-formatter/types";
import { useFormatterHistory } from "./json-formatter/useFormatterHistory";
import { useSyncJsonFormatter } from "./json-formatter/useSyncJsonFormatter";

const SAMPLE =
  '{\n  "name": "dev",\n  "tags": ["a", "b"],\n  "count": 3,\n  "active": true,\n  "meta": {\n    "created": "2025-03-14T10:00:00Z",\n    "tags": {}\n  }\n}';
const ERROR_FEEDBACK_MS = 4_000;

type Feedback = { tone: FeedbackTone; message: string } | null;

export type JsonFormatterToolProps = {
  readonly useFormatter?: JsonFormatterHook;
  readonly share?: {
    readonly readState?: () => { input: string } | null;
    readonly createUrl?: (state: { input: string }) => Promise<string>;
  };
  readonly capabilities?: ToolCapabilities;
  readonly initialInput?: string;
};

function tryFormatJson(source: string, indent: 2 | 4): string | null {
  try {
    return JSON.stringify(JSON.parse(source), null, indent);
  } catch {
    return null;
  }
}

function tryMinifyJson(source: string): string | null {
  try {
    return JSON.stringify(JSON.parse(source));
  } catch {
    return null;
  }
}

export function JsonFormatterTool({
  useFormatter = useSyncJsonFormatter,
  share,
  capabilities = LOCAL_ONLY_CAPABILITIES,
  initialInput,
}: JsonFormatterToolProps = {}) {
  const inputId = useId();
  const outputId = useId();
  const errorId = useId();
  const inputRef = useRef<InjectedEditorRef>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const inputCardRef = useRef<HTMLElement>(null);
  const outputCardRef = useRef<HTMLElement>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);
  const [mode, setMode] = useState<JsonFormatMode>("beautify");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [inputView, setInputView] = useState<"code" | "tree">("code");
  const [outputView, setOutputView] = useState<"code" | "tree">("code");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [announcement, setAnnouncement] = useState("");
  const [outputOverride, setOutputOverride] = useState<string | null>(null);
  const [autoFormat, setAutoFormat] = usePersistedAutoTransform(true, true);
  const [manualOutput, setManualOutput] = useState<string | null>(null);
  const [committedOutput, setCommittedOutput] = useState<string>("");
  const [manualRequested, setManualRequested] = useState<JsonFormatMode | null>(null);

  const initialValue = useMemo(() => {
    if (initialInput !== undefined && initialInput !== "") return initialInput;
    if (share?.readState) {
      const shared = share.readState();
      if (shared?.input) return shared.input;
    }
    return "";
    // Omit share from dependencies so identity churn does not recompute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput]);

  const history = useFormatterHistory(initialValue);
  const source = history.value;

  const lastInitialInputRef = useRef(initialInput);
  const historyRef = useRef(history);
  historyRef.current = history;

  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      historyRef.current.reset(initialInput);
    }
  }, [initialInput]);

  const state = useFormatter(source, indent, mode);
  const inspection = state.status === "success" ? state.inspection : null;
  const liveOutput = inspection?.formatted ?? "";

  const output =
    outputOverride ??
    (autoFormat
      ? manualOutput !== null
        ? manualOutput
        : liveOutput
      : manualOutput !== null
        ? manualOutput
        : committedOutput);

  const rawError = state.status === "error" ? state.error.message : null;
  const isInvalid = Boolean(rawError) && Boolean(source.trim());
  const error = isInvalid ? rawError : null;

  const { isCopied, copy } = useCopyFeedback();

  useEffect(() => {
    if (autoFormat) {
      setManualOutput(null);
      setCommittedOutput(liveOutput);
    }
  }, [source, autoFormat, liveOutput]);

  const handleAutoFormatToggle = useCallback(
    (nextAuto: boolean) => {
      setAutoFormat(nextAuto);
      if (nextAuto) {
        setManualOutput(null);
        setCommittedOutput(liveOutput);
      } else {
        setCommittedOutput(output);
        setManualOutput(null);
      }
    },
    [liveOutput, output],
  );

  const outcome = useMemo(() => {
    let parsedValue: JsonValue | null = null;
    try {
      parsedValue = output ? (JSON.parse(output) as JsonValue) : null;
    } catch {
      parsedValue = null;
    }
    return {
      parsedValue,
      totalValues: inspection?.totalValues ?? 0,
      sizeLabel: formatBytes(new TextEncoder().encode(output).length),
    };
  }, [inspection, output]);

  const showFeedback = useCallback((next: Feedback, duration = ERROR_FEEDBACK_MS) => {
    if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current);
    setFeedback(next);
    feedbackTimer.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimer.current = undefined;
    }, duration);
  }, []);

  const clearFeedback = useCallback(() => {
    if (feedbackTimer.current !== undefined) {
      window.clearTimeout(feedbackTimer.current);
      feedbackTimer.current = undefined;
    }
    setFeedback(null);
  }, []);

  const beginChange = useCallback(() => {
    clearFeedback();
    setAnnouncement("");
    setOutputOverride(null);
  }, [clearFeedback]);

  const edit = useCallback(
    (next: string) => {
      beginChange();
      history.set(next);
    },
    [beginChange, history],
  );

  const onSample = useCallback(() => {
    beginChange();
    history.reset(SAMPLE);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [beginChange, history]);

  const onClear = useCallback(() => {
    beginChange();
    history.reset("");
    setManualOutput(null);
    inputRef.current?.focus();
  }, [beginChange, history]);

  const onRepair = useCallback(() => {
    beginChange();
    const repaired = repairJson(source);
    if (!repaired) {
      showFeedback({ tone: "error", message: "Could not repair JSON" });
      return;
    }
    history.set(repaired);
    setAnnouncement("Repaired JSON");
  }, [beginChange, history, showFeedback, source]);

  const onUpload = useCallback(async () => {
    beginChange();
    const picked = await pickTextFile({ maxChars: JSON_FORMATTER_MAX_INPUT_CHARS });
    if (!picked.ok) {
      showFeedback({ tone: "error", message: picked.message });
      return;
    }
    history.reset(picked.text);
  }, [beginChange, history, showFeedback]);

  const onCopyInput = useCallback(async () => {
    clearFeedback();
    const res = await copy("input", source);
    if (!res.ok) {
      showFeedback({ tone: "error", message: res.message });
    }
  }, [clearFeedback, copy, showFeedback, source]);

  const onCopyOutput = useCallback(async () => {
    clearFeedback();
    const res = await copy("output", output);
    if (!res.ok) {
      showFeedback({ tone: "error", message: res.message });
    }
  }, [clearFeedback, copy, output, showFeedback]);

  const onDownload = useCallback(() => {
    clearFeedback();
    downloadText("formatted.json", output);
  }, [clearFeedback, output]);

  const onPrint = useCallback(() => {
    clearFeedback();
    if (typeof window === "undefined") return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) {
      showFeedback({
        tone: "error",
        message: "Print popup blocked by browser",
      });
      return;
    }
    const escaped = output.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    win.document.write(
      `<!DOCTYPE html><html><head><title>Print JSON</title><style>pre{font-family:monospace;white-space:pre-wrap;}</style></head><body><pre>${escaped}</pre></body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }, [clearFeedback, output, showFeedback]);

  const onToggleFullscreen = useCallback((element: HTMLElement | null) => {
    if (!element || typeof document === "undefined") return;
    if (document.fullscreenElement === element) {
      void document.exitFullscreen?.();
    } else {
      void element.requestFullscreen?.();
    }
  }, []);

  const onValidate = useCallback(() => {
    clearFeedback();
    if (source.trim().length === 0) {
      setAnnouncement("Nothing to validate.");
      return;
    }
    if (state.status === "success") {
      setAnnouncement("JSON is valid.");
    } else if (state.status === "error") {
      setAnnouncement(`Validation failed: ${state.error.message}`);
    }
  }, [clearFeedback, source, state]);

  const onBeautify = useCallback(() => {
    clearFeedback();
    setMode("beautify");
    if (inspection?.formatted && mode === "beautify") {
      setCommittedOutput(inspection.formatted);
      setManualOutput(null);
      setOutputOverride(null);
    } else {
      setManualRequested("beautify");
    }
  }, [clearFeedback, inspection, mode]);

  const onMinify = useCallback(() => {
    clearFeedback();
    setMode("minify");
    if (inspection?.formatted && mode === "minify") {
      setCommittedOutput(inspection.formatted);
      setManualOutput(null);
      setOutputOverride(null);
    } else {
      setManualRequested("minify");
    }
  }, [clearFeedback, inspection, mode]);

  const onFormatInputInPlace = useCallback(() => {
    if (!source.trim()) return;
    const formatted = tryFormatJson(source, indent);
    if (formatted !== null) {
      beginChange();
      history.set(formatted);
      setAnnouncement("Beautified input JSON");
    } else {
      showFeedback({ tone: "error", message: "Cannot format invalid JSON" }, ERROR_FEEDBACK_MS);
    }
  }, [beginChange, history, indent, showFeedback, source]);

  const onMinifyInputInPlace = useCallback(() => {
    if (!source.trim()) return;
    const minified = tryMinifyJson(source);
    if (minified !== null) {
      beginChange();
      history.set(minified);
      setAnnouncement("Minified input JSON");
    } else {
      showFeedback({ tone: "error", message: "Cannot minify invalid JSON" }, ERROR_FEEDBACK_MS);
    }
  }, [beginChange, history, showFeedback, source]);

  const onFormatOutputInPlace = useCallback(() => {
    if (!output.trim()) return;
    const formatted = tryFormatJson(output, indent);
    if (formatted !== null) {
      setOutputOverride(formatted);
      setManualOutput(formatted);
      setAnnouncement("Beautified output JSON");
    } else {
      showFeedback({ tone: "error", message: "Cannot format invalid JSON" }, ERROR_FEEDBACK_MS);
    }
  }, [indent, output, showFeedback]);

  const onMinifyOutputInPlace = useCallback(() => {
    if (!output.trim()) return;
    const minified = tryMinifyJson(output);
    if (minified !== null) {
      setOutputOverride(minified);
      setManualOutput(minified);
      setAnnouncement("Minified output JSON");
    } else {
      showFeedback({ tone: "error", message: "Cannot minify invalid JSON" }, ERROR_FEEDBACK_MS);
    }
  }, [output, showFeedback]);

  useEffect(() => {
    if (manualRequested && state.status === "success" && state.inspection) {
      setCommittedOutput(state.inspection.formatted);
      setManualOutput(null);
      setOutputOverride(null);
      setManualRequested(null);
    }
  }, [manualRequested, state]);

  const onSwap = useCallback(() => {
    if (!output || output.trim().length === 0) return;
    beginChange();
    history.set(output);
    setMode((m) => (m === "beautify" ? "minify" : "beautify"));
  }, [beginChange, history, output]);

  const changeMode = useCallback(
    (next: JsonFormatMode) => {
      beginChange();
      setMode(next);
    },
    [beginChange],
  );

  const changeIndent = useCallback(
    (next: 2 | 4) => {
      beginChange();
      setIndent(next);
    },
    [beginChange],
  );

  const handleShare = useCallback(async () => {
    if (!share?.createUrl || !source) return;
    try {
      const shareUrl = await share.createUrl({ input: source });
      if (typeof shareUrl === "string" && shareUrl) {
        const res = await copy("share", shareUrl);
        if (!res.ok) {
          setAnnouncement(res.message ?? "Could not copy share link.");
        }
      }
    } catch (err) {
      setAnnouncement(err instanceof Error ? err.message : "Could not create share link.");
    }
  }, [copy, share, source]);

  const summary = stateSummary(state);
  const displayStatus = summary.status;
  const displayTone = summary.tone;

  const onShareHandler = share
    ? () => {
        void handleShare();
      }
    : undefined;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        onSample={onSample}
        shareDisabled={!source}
        onShare={onShareHandler}
        isShared={isCopied("share")}
        showShare={share !== undefined}
        shareDisclosure="Share links include the current input. Don't share secrets."
      />

      <ModeOptionsBar
        mode={mode}
        indent={indent}
        disabled={mode === "minify"}
        onModeChange={changeMode}
        onIndentChange={changeIndent}
      />

      <ToolArea
        inputCardRef={inputCardRef}
        inputView={inputView}
        onInputViewChange={setInputView}
        inputEditorId={inputId}
        inputErrorId={errorId}
        error={error}
        source={source}
        inputRef={inputRef}
        onInputChange={edit}
        onInputFocus={() => {}}
        onInputBlur={() => {}}
        format={{ mode, indent, onIndentChange: changeIndent }}
        inputTools={{
          hasInput: Boolean(source),
          onFormatInput: onFormatInputInPlace,
          onMinifyInput: onMinifyInputInPlace,
          onRepair,
          onUpload: () => void onUpload(),
          onCopyInput: () => void onCopyInput(),
          copiedInput: isCopied("input"),
          canUndo: history.canUndo,
          canRedo: history.canRedo,
          onUndo: history.undo,
          onRedo: history.redo,
          onClear,
          onFullscreen: () => onToggleFullscreen(inputCardRef.current),
          uploadButtonRef,
          showUpload: capabilities.fileOpen ?? false,
        }}
        outcome={outcome}
        outputCardRef={outputCardRef}
        outputView={outputView}
        onOutputViewChange={setOutputView}
        outputEditorId={outputId}
        output={output}
        onOutputChange={setOutputOverride}
        outputTools={{
          disabled: !output,
          onFormatOutput: onFormatOutputInPlace,
          onMinifyOutput: onMinifyOutputInPlace,
          onCopyOutput: () => void onCopyOutput(),
          copiedOutput: isCopied("output"),
          onDownload,
          onPrint,
          onFullscreen: () => onToggleFullscreen(outputCardRef.current),
          showDownload: capabilities.fileSave ?? false,
          showPrint: capabilities.print ?? false,
        }}
        onValidate={onValidate}
        onBeautify={onBeautify}
        onMinify={onMinify}
        onSwap={onSwap}
        autoFormat={autoFormat}
        onAutoFormatChange={handleAutoFormatToggle}
      />

      <SummaryBar
        status={displayStatus}
        tone={displayTone}
        rootType={inspection?.rootType}
        objectCount={inspection?.objectCount}
        arrayCount={inspection?.arrayCount}
        propsCount={
          inspection
            ? inspection.stringCount +
              inspection.numberCount +
              inspection.booleanCount +
              inspection.nullCount
            : undefined
        }
        maxDepth={inspection?.maxDepth}
        sizeLabel={outcome.sizeLabel}
      />

      {feedback && (
        <output
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-2.5 text-xs font-semibold shadow-lg transition-all ${
            feedback.tone === "success" ? "bg-success text-white" : "bg-danger text-white"
          }`}
        >
          {feedback.message}
        </output>
      )}

      {announcement && (
        <output className="sr-only" aria-live="polite">
          {announcement}
        </output>
      )}
    </div>
  );
}
