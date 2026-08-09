import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { ArrowRight, Check, ClipboardCopy, Eraser, FileInput, type LucideIcon } from "lucide-react";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import type { DeferredTextTransformState } from "@/hooks/useDeferredTextTransform";

type TextTransformEditorProps = {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly inputLabel: string;
  readonly outputLabel: string;
  readonly placeholder: string;
  readonly source: string;
  readonly onSourceChange: (value: string) => void;
  readonly onSample: () => void;
  readonly maxInputChars: number;
  readonly state: DeferredTextTransformState;
  readonly options?: ReactNode;
};

/** Shared accessible two-pane presentation for bounded local text transforms. */
export function TextTransformEditor({
  icon: Icon,
  title,
  description,
  inputLabel,
  outputLabel,
  placeholder,
  source,
  onSourceChange,
  onSample,
  maxInputChars,
  state,
  options,
}: TextTransformEditorProps) {
  const inputId = useId();
  const outputId = useId();
  const inputHelpId = useId();
  const outputHelpId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState("");
  const output = !state.isProcessing && state.result.ok ? state.result.value : "";
  const error = !state.isProcessing && !state.result.ok ? state.result.error.message : null;

  const clear = useCallback(() => {
    onSourceChange("");
    setFeedback("");
    setCopied(false);
    inputRef.current?.focus();
  }, [onSourceChange]);

  const sample = useCallback(() => {
    onSample();
    setFeedback("");
    setCopied(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, [onSample]);

  const copyOutput = useCallback(async () => {
    if (!output) {
      setFeedback("Create a valid result before copying it.");
      return;
    }
    const copiedResult = await copyText(output);
    if (!copiedResult.ok) {
      setFeedback(copiedResult.message);
      return;
    }
    setCopied(true);
    setFeedback("Result copied to clipboard.");
    window.setTimeout(() => setCopied(false), 900);
  }, [output]);

  const status = state.isProcessing
    ? "Processing…"
    : error
      ? "Fix input"
      : output
        ? "Ready"
        : "Waiting for input";
  const statusClass = error
    ? "tool-status__chip tool-status__chip--error"
    : state.isProcessing
      ? "tool-status__chip tool-status__chip--processing"
      : output
        ? "tool-status__chip"
        : "tool-status__chip tool-status__chip--ready";

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <Icon />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">{title}</h2>
          <p className="tool-header__subtitle">{description}</p>
        </div>
        <div className="tool-header__actions">
          <Button type="button" variant="ghost" size="sm" className="tool-btn" onClick={sample}>
            <FileInput aria-hidden="true" /> Sample
          </Button>
          <Button type="button" variant="ghost" size="sm" className="tool-btn" onClick={clear}>
            <Eraser aria-hidden="true" /> Clear
          </Button>
        </div>
      </div>

      {options ? <div className="tool-options">{options}</div> : null}
      <p className="tool-field-note">
        Runs locally · up to {maxInputChars.toLocaleString()} characters
      </p>
      <output
        className={feedback ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback}
      </output>

      <div className="tool-editor">
        <section className="tool-card">
          <div className="tool-card__header">
            <div className="tool-card__title-group">
              <span className="tool-card__dot tool-card__dot--in" aria-hidden="true" />
              <span className="tool-card__label">{inputLabel}</span>
            </div>
          </div>
          <div className="tool-card__body">
            <div className="tool-card__code">
              <label htmlFor={inputId} className="sr-only">
                {inputLabel}
              </label>
              <textarea
                ref={inputRef}
                id={inputId}
                className="tool-card__textarea"
                value={source}
                onChange={(event) => onSourceChange(event.target.value)}
                spellCheck={false}
                maxLength={maxInputChars}
                aria-invalid={error ? true : undefined}
                aria-describedby={inputHelpId}
                placeholder={placeholder}
              />
            </div>
          </div>
          <div id={inputHelpId} className="tool-card__hint">
            {error ? (
              <span className="tool-card__validation" role="alert">
                <span>{error}</span>
              </span>
            ) : (
              <span>
                {source.length.toLocaleString()} / {maxInputChars.toLocaleString()} chars
              </span>
            )}
          </div>
        </section>

        <div className="tool-rail" aria-hidden="true">
          <div className="tool-rail__action">
            <ArrowRight />
            <span className="tool-rail__lbl">Local</span>
          </div>
        </div>

        <section className="tool-card">
          <div className="tool-card__header">
            <div className="tool-card__title-group">
              <span className="tool-card__dot tool-card__dot--out" aria-hidden="true" />
              <span className="tool-card__label">{outputLabel}</span>
            </div>
            <div className="tool-card__toolbar">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="tool-card__tb-btn"
                onClick={() => void copyOutput()}
                disabled={!output}
                aria-label={copied ? "Result copied" : "Copy result"}
                title={copied ? "Result copied" : "Copy result"}
              >
                {copied ? (
                  <Check className="tool-card__tb-icon--success" aria-hidden="true" />
                ) : (
                  <ClipboardCopy aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
          <div className="tool-card__body">
            <div className="tool-card__code">
              <label htmlFor={outputId} className="sr-only">
                {outputLabel}
              </label>
              <textarea
                id={outputId}
                className="tool-card__textarea"
                value={output}
                readOnly
                spellCheck={false}
                aria-describedby={outputHelpId}
                placeholder={state.isProcessing ? "Processing result…" : "Result appears here…"}
              />
            </div>
          </div>
          <div id={outputHelpId} className="tool-card__hint">
            <span>Read-only · {output.length.toLocaleString()} chars</span>
          </div>
        </section>
      </div>

      <div className="tool-status">
        <div className="tool-status__left">
          <span className={statusClass}>{status}</span>
        </div>
        <span className="tool-status__lang">Local only</span>
      </div>
    </>
  );
}
