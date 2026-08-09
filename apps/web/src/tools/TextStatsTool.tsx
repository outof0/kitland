import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTextStats } from "@/hooks/useTextStats";
import { TEXT_STATS_MAX_INPUT_CHARS } from "@kitland/core";
import { BarChart3, CircleAlert, FileInput, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";

const SAMPLE = "Build local tools.\nShip carefully. 🍵";

export function TextStatsTool() {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(SAMPLE);
  const result = useTextStats(input);
  const error = !result.ok ? result.error.message : null;
  const stats = result.ok ? result.value : null;

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4" aria-labelledby="text-stats-title">
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <BarChart3 />
        </div>
        <div className="tool-header__texts">
          <h2 id="text-stats-title" className="tool-header__title">
            Text Stats
          </h2>
          <p className="tool-header__subtitle">
            Measure text locally with Unicode-aware character, word, line, and byte counts.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setInput(SAMPLE);
              inputRef.current?.focus();
            }}
          >
            <FileInput aria-hidden="true" />
            Sample
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setInput("");
              inputRef.current?.focus();
            }}
          >
            <Trash2 aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>

      <p className="tool-field-note">
        Runs locally · up to {TEXT_STATS_MAX_INPUT_CHARS.toLocaleString()} UTF-16 characters ·
        graphemes use the platform Unicode segmenter.
      </p>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <section className="tool-card tool-card--in" aria-labelledby={`${inputId}-label`}>
          <div className="tool-card__header">
            <span id={`${inputId}-label`} className="tool-card__label">
              Text input
            </span>
            <span className="font-mono text-[11px] text-[var(--on-faint)]">
              {input.length.toLocaleString()} chars
            </span>
          </div>
          <div className="tool-card__body">
            <label htmlFor={inputId} className="sr-only">
              Text to measure
            </label>
            <Textarea
              ref={inputRef}
              id={inputId}
              className="tool-card__textarea min-h-[22rem]"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              placeholder="Paste text to measure…"
            />
            {error ? (
              <p id={errorId} className="tool-card__validation" role="alert">
                <CircleAlert aria-hidden="true" />
                <span>{error}</span>
              </p>
            ) : null}
          </div>
        </section>

        <section
          className="rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-4"
          aria-label="Text statistics"
          aria-live="polite"
        >
          <p className="m-0 font-mono text-[11px] tracking-[0.14em] text-[var(--on-faint)]">
            MEASUREMENTS
          </p>
          {stats ? (
            <dl className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="Graphemes" value={stats.graphemes} hint="User-perceived characters" />
              <Stat label="Code points" value={stats.codePoints} hint="Unicode scalar values" />
              <Stat label="Words" value={stats.words} hint="Word-like segments" />
              <Stat label="Lines" value={stats.lines} hint="Logical lines" />
              <Stat
                label="Characters"
                value={stats.charactersWithWhitespace}
                hint="Includes whitespace"
              />
              <Stat
                label="No whitespace"
                value={stats.charactersWithoutWhitespace}
                hint="Excludes whitespace"
              />
              <Stat label="UTF-8 bytes" value={stats.utf8Bytes} hint="Encoded size" />
            </dl>
          ) : (
            <p className="mt-3 text-sm text-[var(--on-muted)]">
              Correct the input to see measurements.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] p-3">
      <dt className="text-xs text-[var(--on-muted)]">{label}</dt>
      <dd className="m-0 mt-1 font-mono text-xl font-semibold text-[var(--on-surface)]">
        {value.toLocaleString()}
      </dd>
      <p className="m-0 mt-0.5 text-[10px] leading-4 text-[var(--on-faint)]">{hint}</p>
    </div>
  );
}
