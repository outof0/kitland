import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRegexTester } from "@/hooks/useRegexTester";
import {
  REGEX_TEST_MAX_INPUT_CHARS,
  REGEX_TEST_MAX_MATCHES,
  REGEX_TEST_MAX_PATTERN_CHARS,
} from "@kitland/core";
import { CircleAlert, FileInput, Regex, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";

const SAMPLE_PATTERN = String.raw`(?<word>\b[\p{L}\p{N}]+\b)`;
const SAMPLE_FLAGS = "gu";
const SAMPLE_INPUT = "Tea, bánh, and 🍵.";
const DISPLAY_MATCH_LIMIT = 100;

export function RegexTesterTool() {
  const patternId = useId();
  const flagsId = useId();
  const inputId = useId();
  const patternRef = useRef<HTMLInputElement>(null);
  const [pattern, setPattern] = useState(SAMPLE_PATTERN);
  const [flags, setFlags] = useState(SAMPLE_FLAGS);
  const [input, setInput] = useState(SAMPLE_INPUT);
  const { result, isProcessing } = useRegexTester(pattern, input, flags);
  const error = !isProcessing && !result.ok ? result.error.message : null;
  const regexResult = !isProcessing && result.ok ? result.value : null;
  const visibleMatches = regexResult?.matches.slice(0, DISPLAY_MATCH_LIMIT) ?? [];

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4" aria-labelledby="regex-tester-title">
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <Regex />
        </div>
        <div className="tool-header__texts">
          <h2 id="regex-tester-title" className="tool-header__title">
            Regex Tester
          </h2>
          <p className="tool-header__subtitle">
            Test JavaScript regular expressions against local text in an isolated worker.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setPattern(SAMPLE_PATTERN);
              setFlags(SAMPLE_FLAGS);
              setInput(SAMPLE_INPUT);
              patternRef.current?.focus();
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
              setPattern("");
              setFlags("");
              setInput("");
              patternRef.current?.focus();
            }}
          >
            <Trash2 aria-hidden="true" /> Clear
          </Button>
        </div>
      </div>

      <p className="tool-field-note">
        Runs locally · pattern {REGEX_TEST_MAX_PATTERN_CHARS.toLocaleString()} chars · text{" "}
        {REGEX_TEST_MAX_INPUT_CHARS.toLocaleString()} chars · worker stops execution after 750 ms.
      </p>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem]">
        <div>
          <label
            htmlFor={patternId}
            className="mb-1.5 block text-sm font-medium text-[var(--on-surface)]"
          >
            Pattern
          </label>
          <input
            ref={patternRef}
            id={patternId}
            className="h-10 w-full rounded-lg border border-[var(--outline)] bg-[var(--bg-elevated)] px-3 font-mono text-sm text-[var(--on-surface)] outline-none focus:border-[var(--primary)]"
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            spellCheck={false}
            placeholder="\d+"
          />
        </div>
        <div>
          <label
            htmlFor={flagsId}
            className="mb-1.5 block text-sm font-medium text-[var(--on-surface)]"
          >
            Flags
          </label>
          <input
            id={flagsId}
            className="h-10 w-full rounded-lg border border-[var(--outline)] bg-[var(--bg-elevated)] px-3 font-mono text-sm text-[var(--on-surface)] outline-none focus:border-[var(--primary)]"
            value={flags}
            onChange={(event) => setFlags(event.target.value)}
            spellCheck={false}
            placeholder="gim"
          />
        </div>
      </div>

      <section className="tool-card tool-card--in">
        <div className="tool-card__header">
          <label htmlFor={inputId} className="tool-card__label">
            Test text
          </label>
          <span className="font-mono text-[11px] text-[var(--on-faint)]">
            {input.length.toLocaleString()} chars
          </span>
        </div>
        <div className="tool-card__body">
          <Textarea
            id={inputId}
            className="tool-card__textarea min-h-48"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            spellCheck={false}
            placeholder="Paste text to test…"
          />
        </div>
      </section>

      {error ? (
        <p className="tool-alert" role="alert">
          <CircleAlert aria-hidden="true" /> {error}
        </p>
      ) : null}
      <section
        className="min-h-0 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)]"
        aria-live="polite"
        aria-label="Regex matches"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--outline)] px-4 py-3">
          <p className="m-0 font-mono text-[11px] tracking-[0.14em] text-[var(--on-faint)]">
            MATCHES
          </p>
          <span
            className={
              isProcessing
                ? "tool-status__chip tool-status__chip--processing"
                : "tool-status__chip tool-status__chip--ready"
            }
          >
            {isProcessing
              ? "Testing…"
              : `${regexResult?.matches.length ?? 0} match${regexResult?.matches.length === 1 ? "" : "es"}`}
          </span>
        </div>
        {regexResult ? (
          <ol className="m-0 max-h-[24rem] list-none overflow-auto p-0">
            {visibleMatches.map((match, index) => (
              <li
                key={`${match.index}-${index}`}
                className="border-b border-[var(--outline)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <code className="rounded bg-[var(--bg-elevated)] px-2 py-0.5 text-sm text-[var(--on-surface)]">
                    {match.value || "∅"}
                  </code>
                  <span className="font-mono text-xs text-[var(--on-faint)]">
                    {match.index}–{match.end}
                  </span>
                </div>
                {match.captures.length > 0 ? (
                  <p className="m-0 mt-2 font-mono text-xs text-[var(--on-muted)]">
                    {match.captures
                      .map((capture) => `$${capture.index}=${capture.value ?? "undefined"}`)
                      .join(" · ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="m-0 p-4 text-sm text-[var(--on-muted)]">
            {isProcessing ? "Testing pattern…" : "Enter a pattern and text to inspect matches."}
          </p>
        )}
        {regexResult?.truncated ? (
          <p className="m-0 border-t border-[var(--outline)] p-3 text-xs text-[var(--on-muted)]">
            Match collection stopped at {REGEX_TEST_MAX_MATCHES.toLocaleString()} results.
          </p>
        ) : null}
        {regexResult && regexResult.matches.length > visibleMatches.length ? (
          <p className="m-0 border-t border-[var(--outline)] p-3 text-xs text-[var(--on-muted)]">
            Showing the first {DISPLAY_MATCH_LIMIT} matches.
          </p>
        ) : null}
      </section>
    </section>
  );
}
