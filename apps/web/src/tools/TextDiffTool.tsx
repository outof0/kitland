import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTextDiff } from "@/hooks/useTextDiff";
import { TEXT_DIFF_MAX_INPUT_CHARS, TEXT_DIFF_MAX_LINES } from "@kitland/core";
import { CircleAlert, FileDiff, FileInput, Trash2 } from "lucide-react";
import { useId, useRef, useState, type RefObject } from "react";

const BEFORE_SAMPLE = "one\nlocal tools\nship carefully\n🍵";
const AFTER_SAMPLE = "one\nlocal developer tools\nship carefully\n東京\nready";
const DISPLAY_LINE_LIMIT = 1_000;

export function TextDiffTool() {
  const beforeId = useId();
  const afterId = useId();
  const beforeRef = useRef<HTMLTextAreaElement>(null);
  const [before, setBefore] = useState(BEFORE_SAMPLE);
  const [after, setAfter] = useState(AFTER_SAMPLE);
  const { result, isProcessing } = useTextDiff(before, after);
  const error = !isProcessing && !result.ok ? result.error.message : null;
  const diff = !isProcessing && result.ok ? result.value : null;
  const shownLines = diff?.lines.slice(0, DISPLAY_LINE_LIMIT) ?? [];

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4" aria-labelledby="text-diff-title">
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <FileDiff />
        </div>
        <div className="tool-header__texts">
          <h2 id="text-diff-title" className="tool-header__title">
            Text Diff
          </h2>
          <p className="tool-header__subtitle">
            Compare two local text values with a deterministic, line-oriented diff.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setBefore(BEFORE_SAMPLE);
              setAfter(AFTER_SAMPLE);
              beforeRef.current?.focus();
            }}
          >
            <FileInput aria-hidden="true" /> Sample
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setBefore("");
              setAfter("");
              beforeRef.current?.focus();
            }}
          >
            <Trash2 aria-hidden="true" /> Clear
          </Button>
        </div>
      </div>

      <p className="tool-field-note">
        Runs locally · each side is limited to {TEXT_DIFF_MAX_INPUT_CHARS.toLocaleString()}{" "}
        characters / {TEXT_DIFF_MAX_LINES.toLocaleString()} lines.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextInput
          id={beforeId}
          inputRef={beforeRef}
          label="Original"
          value={before}
          onChange={setBefore}
        />
        <TextInput id={afterId} label="Changed" value={after} onChange={setAfter} />
      </div>

      {error ? (
        <p className="tool-alert" role="alert">
          <CircleAlert aria-hidden="true" /> {error}
        </p>
      ) : null}
      <section
        className="min-h-0 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)]"
        aria-live="polite"
        aria-label="Diff result"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--outline)] px-4 py-3">
          <p className="m-0 font-mono text-[11px] tracking-[0.14em] text-[var(--on-faint)]">
            RESULT
          </p>
          {isProcessing ? (
            <span className="tool-status__chip tool-status__chip--processing">Comparing…</span>
          ) : diff ? (
            <div className="flex gap-2 font-mono text-xs">
              <span className="text-[var(--success)]">+{diff.added}</span>
              <span className="text-[var(--danger)]">−{diff.removed}</span>
              <span className="text-[var(--on-muted)]">={diff.unchanged}</span>
            </div>
          ) : null}
        </div>
        {diff ? (
          <ol className="m-0 max-h-[28rem] list-none overflow-auto p-0 font-mono text-xs">
            {shownLines.map((line, index) => (
              <li
                key={`${line.kind}-${line.oldLine}-${line.newLine}-${index}`}
                className={
                  line.kind === "added"
                    ? "flex gap-3 border-b border-[color-mix(in_srgb,var(--success)_24%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] px-3 py-1.5"
                    : line.kind === "removed"
                      ? "flex gap-3 border-b border-[color-mix(in_srgb,var(--danger)_24%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-3 py-1.5"
                      : "flex gap-3 border-b border-[var(--outline)] px-3 py-1.5"
                }
              >
                <span aria-hidden="true" className="w-3 text-[var(--on-faint)]">
                  {line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " "}
                </span>
                <span className="w-12 text-right text-[var(--on-faint)]">{line.oldLine ?? ""}</span>
                <span className="w-12 text-right text-[var(--on-faint)]">{line.newLine ?? ""}</span>
                <code className="min-w-0 whitespace-pre-wrap break-words text-[var(--on-surface)]">
                  {line.value || " "}
                </code>
              </li>
            ))}
          </ol>
        ) : (
          <p className="m-0 p-4 text-sm text-[var(--on-muted)]">
            {isProcessing ? "Preparing the diff…" : "Enter text to compare."}
          </p>
        )}
        {diff && diff.lines.length > shownLines.length ? (
          <p className="m-0 border-t border-[var(--outline)] p-3 text-xs text-[var(--on-muted)]">
            Showing the first {DISPLAY_LINE_LIMIT.toLocaleString()} of{" "}
            {diff.lines.length.toLocaleString()} diff lines.
          </p>
        ) : null}
      </section>
    </section>
  );
}

function TextInput({
  id,
  inputRef,
  label,
  value,
  onChange,
}: {
  id: string;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <section className="tool-card tool-card--in">
      <div className="tool-card__header">
        <label htmlFor={id} className="tool-card__label">
          {label}
        </label>
        <span className="font-mono text-[11px] text-[var(--on-faint)]">
          {value.length.toLocaleString()} chars
        </span>
      </div>
      <div className="tool-card__body">
        <Textarea
          ref={inputRef}
          id={id}
          className="tool-card__textarea min-h-56"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          placeholder={`Paste ${label.toLowerCase()} text…`}
        />
      </div>
    </section>
  );
}
