import { Button } from "@/components/ui/button";
import { useJsonToolbox } from "@/hooks/useJsonToolbox";
import { copyText } from "@/lib/clipboard";
import { JSON_TOOLBOX_MAX_INPUT_CHARS } from "@kitland/core";
import { Braces, Check, ClipboardCopy, Eraser, FileInput, SearchCheck } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

const SAMPLE = '{"project":"Kitland","tools":["format","inspect"],"local":true}';

export function JsonToolboxTool() {
  const inputId = useId();
  const outputId = useId();
  const inputHelpId = useId();
  const outputHelpId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [source, setSource] = useState(SAMPLE);
  const [indent, setIndent] = useState<2 | 4>(2);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState("");
  const { result, isProcessing } = useJsonToolbox(source, indent);
  const output = !isProcessing && result.ok ? result.value.formatted : "";
  const error = !isProcessing && !result.ok ? result.error.message : null;
  const inspection = !isProcessing && result.ok ? result.value : null;

  const sample = useCallback(() => {
    setSource(SAMPLE);
    setFeedback("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const clear = useCallback(() => {
    setSource("");
    setCopied(false);
    setFeedback("");
    inputRef.current?.focus();
  }, []);

  const copyOutput = useCallback(async () => {
    if (!output) {
      setFeedback("Inspect valid JSON before copying the formatted result.");
      return;
    }
    const copiedResult = await copyText(output);
    if (!copiedResult.ok) {
      setFeedback(copiedResult.message);
      return;
    }
    setCopied(true);
    setFeedback("Formatted JSON copied to clipboard.");
    window.setTimeout(() => setCopied(false), 900);
  }, [output]);

  const status = isProcessing
    ? "Inspecting…"
    : error
      ? "Fix JSON"
      : inspection
        ? "Valid JSON"
        : "Waiting for input";
  const statusClass = error
    ? "tool-status__chip tool-status__chip--error"
    : isProcessing
      ? "tool-status__chip tool-status__chip--processing"
      : inspection
        ? "tool-status__chip"
        : "tool-status__chip tool-status__chip--ready";

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <SearchCheck />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">JSON Toolbox</h2>
          <p className="tool-header__subtitle">
            Validate, format, and inspect a JSON document locally.
          </p>
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
      <div className="tool-options">
        <label className="tool-options__format">
          Indent
          <select
            value={indent}
            onChange={(event) => setIndent(Number(event.target.value) as 2 | 4)}
            aria-label="JSON indent size"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </label>
      </div>
      <p className="tool-field-note">
        Runs locally · up to {JSON_TOOLBOX_MAX_INPUT_CHARS.toLocaleString()} characters
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
              <span className="tool-card__label">JSON input</span>
            </div>
          </div>
          <div className="tool-card__body">
            <div className="tool-card__code">
              <label htmlFor={inputId} className="sr-only">
                JSON input
              </label>
              <textarea
                ref={inputRef}
                id={inputId}
                className="tool-card__textarea"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                spellCheck={false}
                maxLength={JSON_TOOLBOX_MAX_INPUT_CHARS}
                aria-invalid={error ? true : undefined}
                aria-describedby={inputHelpId}
                placeholder='Paste JSON, for example {"enabled": true}'
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
                {source.length.toLocaleString()} / {JSON_TOOLBOX_MAX_INPUT_CHARS.toLocaleString()}{" "}
                chars
              </span>
            )}
          </div>
        </section>

        <div className="tool-rail" aria-hidden="true">
          <div className="tool-rail__action">
            <Braces />
            <span className="tool-rail__lbl">Inspect</span>
          </div>
        </div>

        <section className="tool-card">
          <div className="tool-card__header">
            <div className="tool-card__title-group">
              <span className="tool-card__dot tool-card__dot--out" aria-hidden="true" />
              <span className="tool-card__label">Formatted JSON</span>
            </div>
            <div className="tool-card__toolbar">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="tool-card__tb-btn"
                onClick={() => void copyOutput()}
                disabled={!output}
                aria-label={copied ? "Formatted JSON copied" : "Copy formatted JSON"}
                title={copied ? "Formatted JSON copied" : "Copy formatted JSON"}
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
                Formatted JSON
              </label>
              <textarea
                id={outputId}
                className="tool-card__textarea"
                value={output}
                readOnly
                spellCheck={false}
                aria-describedby={outputHelpId}
                placeholder={isProcessing ? "Inspecting JSON…" : "Formatted JSON appears here…"}
              />
            </div>
          </div>
          <div id={outputHelpId} className="tool-card__hint">
            <span>Read-only · {output.length.toLocaleString()} chars</span>
          </div>
        </section>
      </div>

      {inspection ? (
        <div className="tool-status" aria-label="JSON inspection summary">
          <div className="tool-status__left">
            <span className="tool-header__subtitle">
              {inspection.rootType} · {inspection.totalValues.toLocaleString()} values · depth{" "}
              {inspection.maxDepth}
            </span>
          </div>
          <span className="tool-status__lang">
            {inspection.objectCount} objects · {inspection.arrayCount} arrays
          </span>
        </div>
      ) : null}
      <div className="tool-status">
        <div className="tool-status__left">
          <span className={statusClass}>{status}</span>
        </div>
        <span className="tool-status__lang">JSON</span>
      </div>
    </>
  );
}
