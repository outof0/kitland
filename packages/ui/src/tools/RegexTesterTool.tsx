import { HostCodeEditor } from "../components/HostCodeEditor";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { useRegexTester } from "../hooks/useInspectHooks";
import { pickTextFile } from "../lib/clipboard";
import {
  REGEX_TEST_MAX_INPUT_CHARS,
  REGEX_TEST_MAX_PATTERN_CHARS,
  type RegexTestResult,
  type ToolResult,
} from "@kitland/core";
import { Check, CircleAlert, Copy, FileInput, Regex, Trash2, Upload } from "lucide-react";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

const SAMPLE_PATTERN = String.raw`(?<word>\b[\p{L}\p{N}]+\b)`;
const SAMPLE_FLAGS = "gu";
const SAMPLE_INPUT = "Tea, bánh, and 🍵.\nFast local tools for developers.";
const DISPLAY_MATCH_LIMIT = 100;

const AVAILABLE_FLAGS = [
  { flag: "g", label: "global (g)" },
  { flag: "i", label: "ignoreCase (i)" },
  { flag: "m", label: "multiline (m)" },
  { flag: "s", label: "dotAll (s)" },
  { flag: "u", label: "unicode (u)" },
] as const;

export type RegexTesterHook = (
  pattern: string,
  input: string,
  flags: string,
) => { result: ToolResult<RegexTestResult>; isProcessing: boolean };

export type RegexTesterToolProps = {
  readonly useTester?: RegexTesterHook;
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** Regex Tester tool aligned with design system tokens and layout. */
export function RegexTesterTool({
  useTester = useRegexTester,
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: RegexTesterToolProps = {}) {
  const headingId = useId();
  const inputId = useId();
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("gu");
  const [input, setInput] = useState(initialInput ?? "");
  const { isCopied, copy } = useCopyFeedback();

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setInput(initialInput);
    }
  }, [initialInput]);

  const showUpload = capabilities.fileOpen ?? false;

  const { result, isProcessing } = useTester(pattern, input, flags);
  const error = !isProcessing && !result.ok ? result.error.message : null;
  const regexResult = !isProcessing && result.ok ? result.value : null;
  const visibleMatches = regexResult?.matches.slice(0, DISPLAY_MATCH_LIMIT) ?? [];

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ""));
    } else {
      setFlags(flags + flag);
    }
  };

  const onSample = useCallback(() => {
    setPattern(SAMPLE_PATTERN);
    setFlags(SAMPLE_FLAGS);
    setInput(SAMPLE_INPUT);
  }, []);

  const onClear = useCallback(() => {
    setInput("");
  }, []);

  const onUpload = useCallback(async () => {
    const picked = await pickTextFile({
      maxChars: REGEX_TEST_MAX_INPUT_CHARS,
    });
    if (picked && picked.ok) {
      setInput(picked.text);
    }
  }, []);

  const inputLinesCount = useMemo(() => {
    if (!input) return 10;
    return Math.max(10, input.split("\n").length);
  }, [input]);

  const hasPattern = pattern.length > 0;
  const hasInput = input.length > 0;
  const status = error
    ? "Error"
    : isProcessing
      ? "Testing"
      : !hasPattern || !hasInput
        ? "Waiting"
        : visibleMatches.length > 0
          ? "Matched"
          : "No match";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <div className="size-11 bg-primary-soft border border-primary/30 rounded-[11px] text-primary flex items-center justify-center shrink-0">
            <Regex className="size-5" />
          </div>
          <div>
            <h2
              id={headingId}
              className="text-[20px] font-bold font-display text-on-surface tracking-[-0.02em] m-0"
            >
              Regex Tester
            </h2>
            <p className="text-[13px] text-on-muted m-0 mt-0.5">
              Test JavaScript regular expressions against local text.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSample}
            className="h-[32px] px-[12px] bg-surface-low border border-outline rounded-[8px] text-[12px] font-medium text-on-surface hover:bg-surface hover:border-outline-strong transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileInput className="size-3.5 text-on-muted" />
            Sample
          </button>
        </div>
      </div>

      {/* Options Bar: Pattern and Flag toggles */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Pattern input */}
        <div className="flex-1 min-w-[280px] flex items-center h-[34px] bg-surface border border-outline rounded-[8px] px-3 focus-within:border-primary transition-colors">
          <span className="text-[13px] font-mono text-on-muted select-none mr-1.5">/</span>
          <input
            type="text"
            aria-label="Pattern"
            value={pattern}
            maxLength={REGEX_TEST_MAX_PATTERN_CHARS}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Regular expression pattern…"
            className="flex-1 bg-transparent text-on-surface font-mono text-[13px] outline-none border-none"
            spellCheck={false}
          />
          <span className="text-[13px] font-mono text-on-muted select-none ml-1.5">/</span>
          <input
            type="text"
            aria-label="Flags"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder="flags"
            className="w-[45px] bg-transparent text-primary font-mono text-[13px] outline-none border-none"
            spellCheck={false}
          />
        </div>

        {/* Flag toggles */}
        <div className="h-[32px] flex items-center gap-[2px] p-[2px] bg-surface border border-outline rounded-[8px]">
          {AVAILABLE_FLAGS.map(({ flag, label }) => {
            const active = flags.includes(flag);
            return (
              <button
                key={flag}
                type="button"
                onClick={() => toggleFlag(flag)}
                title={label}
                className={`h-[26px] px-[8px] rounded-[6px] text-[12px] font-mono font-semibold transition-colors cursor-pointer ${
                  active ? "text-primary" : "text-on-muted hover:text-on-surface"
                }`}
              >
                {flag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="bg-danger-soft border border-danger/40 rounded-[10px] px-3.5 py-2 text-[12px] text-danger flex items-center gap-2"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">{error}</span>
        </div>
      )}

      {/* Two-Column Editor Layout */}
      <div className="flex min-h-0 min-w-0 flex-1 gap-3.5 max-lg:flex-col max-lg:overflow-y-auto lg:max-h-[calc(100dvh-17.5rem)]">
        {/* Input Text Card */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-outline bg-surface focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all duration-150 max-lg:min-h-72 max-lg:flex-none tool-card tool-card--in">
          <div className="min-h-[46px] bg-surface-low border-b border-outline px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              <h3 className="m-0 text-[12px] font-bold tracking-[0.4px] text-on-surface font-display truncate">
                Test String
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void copy("input", input)}
                disabled={!input}
                title={isCopied("input") ? "Copied test string" : "Copy test string"}
                aria-label={isCopied("input") ? "Copied test string" : "Copy test string"}
                className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isCopied("input")
                    ? "bg-success-soft text-success border border-success/40"
                    : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                }`}
              >
                {isCopied("input") ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
              {showUpload && (
                <button
                  type="button"
                  onClick={() => void onUpload()}
                  title="Upload file"
                  aria-label="Upload file"
                  className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer"
                >
                  <Upload className="size-4" />
                </button>
              )}
              <div className="w-[1px] h-[16px] bg-outline mx-0.5" />
              <button
                type="button"
                onClick={onClear}
                disabled={!input}
                title="Clear test string"
                aria-label="Clear test string"
                className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-row overflow-hidden bg-surface">
            <HostCodeEditor
              id={inputId}
              value={input}
              onChange={setInput}
              language="text"
              placeholder="Enter text to match against regex…"
              ariaLabel="Test text"
              maxChars={REGEX_TEST_MAX_INPUT_CHARS}
            />
          </div>

          <div className="h-[34px] min-h-[34px] px-3.5 py-2 border-t border-outline bg-surface-low flex items-center justify-between text-[11px] text-on-muted shrink-0">
            <span>
              {inputLinesCount} {inputLinesCount === 1 ? "line" : "lines"} ·{" "}
              {input.length.toLocaleString()} chars
            </span>
          </div>
        </section>

        {/* Matches Card */}
        <section
          aria-label="Regex matches"
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-outline bg-surface focus-within:border-success focus-within:ring-1 focus-within:ring-success/30 transition-all duration-150 max-lg:min-h-72 max-lg:flex-none tool-card tool-card--out"
        >
          <div className="min-h-[46px] bg-surface-low border-b border-outline px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              <h3 className="m-0 text-[12px] font-bold tracking-[0.4px] text-on-surface font-display truncate">
                {visibleMatches.length} {visibleMatches.length === 1 ? "match" : "matches"}
                {regexResult?.truncated ? " (truncated)" : ""}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void copy("matches", JSON.stringify(visibleMatches, null, 2))}
                disabled={visibleMatches.length === 0}
                title={isCopied("matches") ? "Copied matches JSON" : "Copy matches JSON"}
                aria-label={isCopied("matches") ? "Copied matches JSON" : "Copy matches JSON"}
                className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isCopied("matches")
                    ? "bg-success-soft text-success border border-success/40"
                    : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                }`}
              >
                {isCopied("matches") ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-surface">
            {visibleMatches.length > 0 ? (
              visibleMatches.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-surface-low border border-outline rounded-[9px] font-mono text-[12px]"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-outline text-on-muted text-[11px]">
                    <span className="font-semibold text-primary">Match #{idx + 1}</span>
                    <span>
                      Index: {m.index}..{m.end}
                    </span>
                  </div>
                  <div className="mt-2 text-success font-bold break-all">"{m.value}"</div>
                  {m.namedCaptures && Object.keys(m.namedCaptures).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-outline/60 space-y-1">
                      <span className="text-[11px] text-on-muted block">Named Groups:</span>
                      {Object.entries(m.namedCaptures).map(([groupName, groupValue]) => (
                        <div key={groupName} className="flex gap-2 text-[11px]">
                          <span className="text-primary font-semibold">{groupName}:</span>
                          <span className="text-on-surface break-all">"{groupValue}"</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-[13px] text-on-muted p-8 text-center">
                {error
                  ? "Fix the pattern error"
                  : !pattern && !input
                    ? "Enter a regular expression and test string to view matches"
                    : !pattern
                      ? "Enter a regular expression pattern"
                      : !input
                        ? "Enter test string to match"
                        : "No matches found"}
              </div>
            )}
          </div>

          <div className="h-[34px] min-h-[34px] px-3.5 py-2 border-t border-outline bg-surface-low flex items-center justify-between text-[11px] text-on-muted shrink-0">
            <span>
              {visibleMatches.length} {visibleMatches.length === 1 ? "match" : "matches"} found
            </span>
          </div>
        </section>
      </div>

      {/* Status Bar */}
      <footer
        aria-label="Regex Tester status"
        className="flex h-[40px] shrink-0 items-center justify-between gap-3 rounded-[10px] bg-surface-low border border-outline px-4 font-ui text-[12px] tool-status"
      >
        <div className="flex items-center gap-3">
          <div
            className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium ${
              status === "Matched"
                ? "bg-success-soft text-success"
                : status === "Error"
                  ? "bg-danger-soft text-danger"
                  : status === "Testing"
                    ? "bg-primary-soft text-primary animate-pulse"
                    : "bg-surface text-on-muted"
            }`}
          >
            <span>{status}</span>
          </div>
          <div className="flex items-center gap-4 text-[12px] font-mono text-on-muted max-sm:hidden">
            <span>
              {visibleMatches.length} {visibleMatches.length === 1 ? "match" : "matches"}
            </span>
            <span>{input.length} chars</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-[6px] bg-surface border border-outline text-[11px] font-mono font-bold text-primary">
            <span>&lt;&gt; REGEX</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
