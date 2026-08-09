import { Button } from "@/components/ui/button";
import { useJsonEscape } from "@/hooks/useJsonEscape";
import { Textarea } from "@/components/ui/textarea";
import { copyText } from "@/lib/clipboard";
import {
  JSON_ESCAPE_MAX_ENCODED_CHARS,
  JSON_ESCAPE_MAX_INPUT_CHARS,
  type JsonEscapeMode,
} from "@kitland/core";
import {
  ArrowLeftRight,
  Braces,
  CircleAlert,
  CircleCheck,
  Copy,
  Eraser,
  FileCode,
  FileInput,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";

const SAMPLE = 'Hello, "Kitland"!\nPaste this into JSON safely. 🍵';
const COPY_CONFIRMATION_MS = 900;

/** Escape plain text into a quoted JSON string, or decode one back to text. */
export function JsonEscapeTool() {
  const inputId = useId();
  const outputId = useId();
  const inputErrorId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const [mode, setMode] = useState<JsonEscapeMode>("encode");
  const [input, setInput] = useState(SAMPLE);
  const [copied, setCopied] = useState<"input" | "output" | null>(null);
  const [feedback, setFeedback] = useState("");
  const { result, isProcessing } = useJsonEscape(input, mode);
  const inputLimit =
    mode === "encode" ? JSON_ESCAPE_MAX_INPUT_CHARS : JSON_ESCAPE_MAX_ENCODED_CHARS;
  const limitError =
    input.length > inputLimit
      ? `Input exceeds the ${inputLimit.toLocaleString()} character limit.`
      : null;
  const error =
    input.length > 0 ? (limitError ?? (!result.ok ? result.error.message : null)) : null;
  const output = !isProcessing && !error && result.ok ? result.value : "";
  const inputLabel = mode === "encode" ? "Plain text" : "JSON string literal";
  const outputLabel = mode === "encode" ? "JSON string literal" : "Plain text";

  useEffect(
    () => () => {
      if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const showCopied = useCallback((target: "input" | "output") => {
    setCopied(target);
    setFeedback("");
    if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => {
      setCopied((current) => (current === target ? null : current));
      copyTimer.current = undefined;
    }, COPY_CONFIRMATION_MS);
  }, []);

  const copy = useCallback(
    async (target: "input" | "output", value: string) => {
      if (!value) return;
      const copiedResult = await copyText(value);
      if (copiedResult.ok) showCopied(target);
      else {
        setCopied(null);
        setFeedback(copiedResult.message);
      }
    },
    [showCopied],
  );

  const resetInput = useCallback((value: string) => {
    setInput(value);
    setCopied(null);
    setFeedback("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const switchMode = useCallback(
    (nextMode: JsonEscapeMode) => {
      if (nextMode === mode) return;
      // Carry a valid result into the opposite direction, making encode →
      // decode a useful round-trip while preserving invalid input for editing.
      const nextInputLimit =
        nextMode === "encode" ? JSON_ESCAPE_MAX_INPUT_CHARS : JSON_ESCAPE_MAX_ENCODED_CHARS;
      if (!isProcessing && !error && result.ok && result.value.length <= nextInputLimit) {
        setInput(result.value);
      }
      setMode(nextMode);
      setCopied(null);
      setFeedback("");
    },
    [error, isProcessing, mode, result],
  );

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <Braces />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">JSON Escape</h2>
          <p className="tool-header__subtitle">
            Escape or unescape a JSON string locally, including quotes and control characters.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => resetInput(SAMPLE)}
          >
            <FileInput aria-hidden="true" /> Sample
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => resetInput("")}
          >
            <Eraser aria-hidden="true" /> Clear
          </Button>
        </div>
      </div>

      <div className="tool-options">
        <fieldset className="tool-mode">
          <legend className="sr-only">JSON string operation</legend>
          {(["encode", "decode"] as const).map((nextMode) => (
            <Button
              key={nextMode}
              type="button"
              variant="ghost"
              size="sm"
              className={
                mode === nextMode ? "tool-mode__seg tool-mode__seg--active" : "tool-mode__seg"
              }
              aria-pressed={mode === nextMode}
              onClick={() => switchMode(nextMode)}
              disabled={isProcessing}
            >
              {nextMode === "encode" ? "Escape" : "Unescape"}
            </Button>
          ))}
        </fieldset>
      </div>
      <p className="tool-field-note">
        Runs locally · up to {inputLimit.toLocaleString()} characters · encode adds surrounding
        quotes
      </p>
      <output
        className={feedback ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        role={feedback ? "alert" : undefined}
        aria-live="polite"
      >
        {feedback}
      </output>

      <div className="tool-editor">
        <EditorCard
          label={inputLabel}
          inputRef={inputRef}
          inputId={inputId}
          errorId={inputErrorId}
          input={input}
          inputLimit={inputLimit}
          error={error}
          copied={copied === "input"}
          onInput={(value) => {
            setInput(value);
            setCopied(null);
            setFeedback("");
          }}
          onCopy={() => void copy("input", input)}
          onClear={() => resetInput("")}
        />
        <div className="tool-rail" aria-hidden="true">
          <div className="tool-rail__action">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="tool-rail__btn tool-rail__btn--swap"
              onClick={() => switchMode(mode === "encode" ? "decode" : "encode")}
              disabled={isProcessing || Boolean(error) || !output}
              aria-label="Use the result as input and switch direction"
              title="Use the result as input and switch direction"
            >
              <ArrowLeftRight aria-hidden="true" />
            </Button>
            <span className="tool-rail__lbl">Swap</span>
          </div>
        </div>
        <div className="tool-card tool-card--out">
          <div className="tool-card__header">
            <div className="tool-card__title-group">
              <span className="tool-card__dot tool-card__dot--out" aria-hidden="true" />
              <span className="tool-card__label">{outputLabel}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="tool-card__tb-btn"
              onClick={() => void copy("output", output)}
              disabled={!output}
              aria-label={copied === "output" ? `Copied ${outputLabel}` : `Copy ${outputLabel}`}
              title={copied === "output" ? `Copied ${outputLabel}` : `Copy ${outputLabel}`}
            >
              {copied === "output" ? (
                <CircleCheck aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
            </Button>
          </div>
          <div className="tool-card__body">
            <div className="tool-card__code">
              <label htmlFor={outputId} className="sr-only">
                {outputLabel}
              </label>
              <Textarea
                id={outputId}
                className="tool-card__textarea"
                value={output}
                readOnly
                spellCheck={false}
                placeholder={isProcessing ? "Processing…" : "Result appears here…"}
              />
            </div>
          </div>
          <div className="tool-card__hint">Read-only · {output.length.toLocaleString()} chars</div>
        </div>
      </div>

      <div className="tool-status">
        <div className="tool-status__left">
          <span
            className={
              error
                ? "tool-status__chip tool-status__chip--error"
                : isProcessing
                  ? "tool-status__chip tool-status__chip--processing"
                  : "tool-status__chip tool-status__chip--ready"
            }
          >
            {!error && !isProcessing ? <CircleCheck aria-hidden="true" /> : null}
            {isProcessing ? "Processing…" : error ? "Fix input" : "Ready"}
          </span>
        </div>
        <span className="tool-status__lang">
          <FileCode aria-hidden="true" /> JSON
        </span>
      </div>
    </>
  );
}

function EditorCard({
  label,
  inputRef,
  inputId,
  errorId,
  input,
  inputLimit,
  error,
  copied,
  onInput,
  onCopy,
  onClear,
}: {
  label: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  inputId: string;
  errorId: string;
  input: string;
  inputLimit: number;
  error: string | null;
  copied: boolean;
  onInput: (value: string) => void;
  onCopy: () => void;
  onClear: () => void;
}) {
  return (
    <div className="tool-card tool-card--in">
      <div className="tool-card__header">
        <div className="tool-card__title-group">
          <span className="tool-card__dot tool-card__dot--in" aria-hidden="true" />
          <span className="tool-card__label">{label}</span>
        </div>
        <div className="tool-card__toolbar">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="tool-card__tb-btn"
            onClick={onCopy}
            disabled={!input}
            aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
            title={copied ? `Copied ${label}` : `Copy ${label}`}
          >
            {copied ? <CircleCheck aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="tool-card__tb-btn"
            onClick={onClear}
            aria-label="Clear input"
            title="Clear input"
          >
            <Eraser aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="tool-card__body">
        <div className="tool-card__code">
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <Textarea
            ref={inputRef}
            id={inputId}
            className="tool-card__textarea"
            value={input}
            onChange={(event) => onInput(event.target.value)}
            spellCheck={false}
            maxLength={inputLimit}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? errorId : undefined}
            placeholder={
              label === "Plain text"
                ? "Paste text to escape…"
                : 'Paste a JSON string, for example "hello\\nworld"…'
            }
          />
        </div>
      </div>
      <div id={errorId} className="tool-card__hint">
        {error ? (
          <span className="tool-card__validation" role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{error}</span>
          </span>
        ) : (
          <span>Editable · {input.length.toLocaleString()} chars</span>
        )}
      </div>
    </div>
  );
}
