import { JSON_DIFF_MAX_INPUT_CHARS, type JsonDiffEntry, type JsonDiffResult } from "@kitland/core";
import { Button } from "@/components/ui/button";
import { useJsonDiff } from "@/hooks/useJsonDiff";
import { copyText } from "@/lib/clipboard";
import {
  ArrowLeftRight,
  Braces,
  Check,
  ClipboardCopy,
  Eraser,
  FileDiff,
  FileInput,
} from "lucide-react";
import { useCallback, useId, useRef, useState, type RefObject } from "react";

const SAMPLE_LEFT = `{
  "service": "kitland",
  "version": 1,
  "features": ["diff", "local"]
}`;
const SAMPLE_RIGHT = `{
  "service": "kitland",
  "version": 2,
  "features": ["diff", "private", "local"],
  "released": false
}`;
const MAX_VISIBLE_ENTRIES = 500;

type CopyState = "result" | null;

/**
 * Structural JSON comparison in the shared workspace shell.
 * Both documents stay in this tab; no source text is sent over the network.
 */
export function JsonDiffTool() {
  const leftId = useId();
  const rightId = useId();
  const leftHelpId = useId();
  const rightHelpId = useId();
  const resultId = useId();
  const leftRef = useRef<HTMLTextAreaElement>(null);
  const [left, setLeft] = useState(SAMPLE_LEFT);
  const [right, setRight] = useState(SAMPLE_RIGHT);
  const [copied, setCopied] = useState<CopyState>(null);
  const [feedback, setFeedback] = useState("");
  const { result, isProcessing } = useJsonDiff(left, right);
  const resultError = !result.ok ? result.error : null;
  const leftError = resultError?.code.startsWith("LEFT_") ? resultError.message : null;
  const rightError = resultError?.code.startsWith("RIGHT_") ? resultError.message : null;
  const comparisonError = resultError && !leftError && !rightError ? resultError.message : null;
  const comparison = result.ok ? result.value : null;
  const resultText = comparison ? serializeDiff(comparison) : "";
  const visibleEntries = comparison?.entries.slice(0, MAX_VISIBLE_ENTRIES) ?? [];
  const hiddenEntryCount = Math.max(0, (comparison?.entries.length ?? 0) - visibleEntries.length);

  const resetCopy = useCallback(() => {
    setCopied(null);
    window.setTimeout(() => setFeedback(""), 900);
  }, []);

  const onCopyResult = useCallback(async () => {
    if (!resultText) {
      setFeedback("Create a valid comparison before copying its result.");
      return;
    }
    const copiedResult = await copyText(resultText);
    if (!copiedResult.ok) {
      setFeedback(copiedResult.message);
      return;
    }
    setCopied("result");
    setFeedback("Comparison copied to clipboard.");
    window.setTimeout(resetCopy, 900);
  }, [resetCopy, resultText]);

  const onSample = useCallback(() => {
    setLeft(SAMPLE_LEFT);
    setRight(SAMPLE_RIGHT);
    setFeedback("");
    setCopied(null);
    leftRef.current?.focus();
  }, []);

  const onSwap = useCallback(() => {
    setLeft(right);
    setRight(left);
    setFeedback("");
  }, [left, right]);

  const onClear = useCallback(() => {
    setLeft("");
    setRight("");
    setFeedback("");
    setCopied(null);
    leftRef.current?.focus();
  }, []);

  const status = isProcessing
    ? "Comparing…"
    : comparisonError || leftError || rightError
      ? "Fix JSON"
      : comparison?.summary.total === 0
        ? "No differences"
        : `${comparison?.summary.total ?? 0} differences`;
  const statusClass =
    comparisonError || leftError || rightError
      ? "tool-status__chip tool-status__chip--error"
      : isProcessing
        ? "tool-status__chip tool-status__chip--processing"
        : comparison?.summary.total === 0
          ? "tool-status__chip tool-status__chip--ready"
          : "tool-status__chip";

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <FileDiff />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">Compare JSON</h2>
          <p className="tool-header__subtitle">
            Structural comparison: whitespace and object key order do not count as changes.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button type="button" variant="ghost" size="sm" className="tool-btn" onClick={onSample}>
            <FileInput aria-hidden="true" />
            Sample
          </Button>
          <Button type="button" variant="ghost" size="sm" className="tool-btn" onClick={onClear}>
            <Eraser aria-hidden="true" />
            Clear both
          </Button>
        </div>
      </div>

      <p className="tool-field-note">
        Compared locally · up to {formatCount(JSON_DIFF_MAX_INPUT_CHARS)} characters per document
      </p>

      <output
        className={feedback ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback}
      </output>

      <div className="tool-editor">
        <JsonEditorCard
          label="Before JSON"
          id={leftId}
          describedBy={leftHelpId}
          inputRef={leftRef}
          value={left}
          onChange={setLeft}
          error={leftError}
          helpId={leftHelpId}
        />
        <div className="tool-rail">
          <div className="tool-rail__action">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="tool-rail__btn tool-rail__btn--swap"
              onClick={onSwap}
              aria-label="Swap before and after JSON"
              title="Swap before and after JSON"
            >
              <ArrowLeftRight aria-hidden="true" />
            </Button>
            <span className="tool-rail__lbl">Swap</span>
          </div>
        </div>
        <JsonEditorCard
          label="After JSON"
          id={rightId}
          describedBy={rightHelpId}
          value={right}
          onChange={setRight}
          error={rightError}
          helpId={rightHelpId}
        />
      </div>

      <section className="tool-card flex-[0_0_220px]" aria-labelledby={resultId}>
        <div className="tool-card__header">
          <div className="tool-card__title-group">
            <span className="tool-card__dot tool-card__dot--out" aria-hidden="true" />
            <span id={resultId} className="tool-card__label">
              Structural differences
            </span>
          </div>
          <div className="tool-card__toolbar">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="tool-card__tb-btn"
              onClick={() => void onCopyResult()}
              disabled={!resultText || isProcessing}
              aria-label={copied === "result" ? "Comparison copied" : "Copy comparison"}
              title={copied === "result" ? "Comparison copied" : "Copy comparison as JSON"}
            >
              {copied === "result" ? (
                <Check aria-hidden="true" />
              ) : (
                <ClipboardCopy aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
        <div className="tool-card__body">
          {comparisonError ? (
            <p className="tool-alert" role="alert">
              {comparisonError}
            </p>
          ) : isProcessing ? (
            <p className="tool-header__subtitle" aria-live="polite">
              Comparing the latest documents…
            </p>
          ) : comparison?.summary.total === 0 ? (
            <p className="tool-header__subtitle">The documents are structurally identical.</p>
          ) : (
            <ol aria-label="JSON differences" className="m-0 max-h-[28rem] overflow-auto pl-5">
              {visibleEntries.map((entry) => (
                <DiffEntry key={`${entry.operation}:${entry.path}`} entry={entry} />
              ))}
              {hiddenEntryCount > 0 ? (
                <li className="tool-header__subtitle">
                  Showing the first {formatCount(MAX_VISIBLE_ENTRIES)} differences; copy the result
                  for all {formatCount(comparison?.summary.total ?? 0)}.
                </li>
              ) : null}
            </ol>
          )}
        </div>
      </section>

      <div className="tool-status">
        <div className="tool-status__left">
          <span className={statusClass}>{status}</span>
          {comparison && comparison.summary.total > 0 ? (
            <span className="tool-header__subtitle">
              +{comparison.summary.added} added · −{comparison.summary.removed} removed · ~
              {comparison.summary.changed} changed
            </span>
          ) : null}
        </div>
        <span className="tool-status__lang">
          <Braces aria-hidden="true" />
          JSON
        </span>
      </div>
    </>
  );
}

function JsonEditorCard({
  label,
  id,
  describedBy,
  inputRef,
  value,
  onChange,
  error,
  helpId,
}: {
  label: string;
  id: string;
  describedBy: string;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  helpId: string;
}) {
  return (
    <div className="tool-card">
      <div className="tool-card__header">
        <div className="tool-card__title-group">
          <span className="tool-card__dot tool-card__dot--in" aria-hidden="true" />
          <span className="tool-card__label">{label}</span>
        </div>
      </div>
      <div className="tool-card__body">
        <div className="tool-card__code">
          <label htmlFor={id} className="sr-only">
            {label}
          </label>
          <textarea
            ref={inputRef}
            id={id}
            className="tool-card__textarea"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            maxLength={JSON_DIFF_MAX_INPUT_CHARS}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            placeholder='Paste valid JSON, for example {"enabled": true}'
          />
        </div>
      </div>
      <div id={helpId} className="tool-card__hint">
        {error ? (
          <span className="tool-card__validation" role="alert">
            <span>{error}</span>
          </span>
        ) : (
          <span>
            {formatCount(value.length)} / {formatCount(JSON_DIFF_MAX_INPUT_CHARS)} chars
          </span>
        )}
      </div>
    </div>
  );
}

function DiffEntry({ entry }: { entry: JsonDiffEntry }) {
  const path = entry.path || "/ (root)";
  const before = Object.hasOwn(entry, "before") ? ` ${shortValue(entry.before)}` : "";
  const after = Object.hasOwn(entry, "after") ? ` ${shortValue(entry.after)}` : "";
  const detail =
    entry.operation === "added"
      ? `added:${after}`
      : entry.operation === "removed"
        ? `removed:${before}`
        : `changed:${before} →${after}`;
  return (
    <li>
      <code>{path}</code> — {detail}
    </li>
  );
}

function shortValue(value: JsonDiffEntry["before"]): string {
  const serialized = JSON.stringify(value) ?? "undefined";
  return serialized.length > 160 ? `${serialized.slice(0, 157)}…` : serialized;
}

function serializeDiff(result: JsonDiffResult): string {
  return JSON.stringify(result, null, 2);
}

function formatCount(value: number): string {
  return value.toLocaleString();
}
