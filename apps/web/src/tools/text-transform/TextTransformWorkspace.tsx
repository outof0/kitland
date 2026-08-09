import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { copyText } from "@/lib/clipboard";
import type { ToolResult } from "@kitland/core";
import {
  CircleAlert,
  CircleCheck,
  Copy,
  Eraser,
  FileCode,
  FileInput,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

const COPY_CONFIRMATION_MS = 900;

export type TextTransformWorkspaceProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  sample: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  result: ToolResult<string>;
  maxInputChars: number;
  inputLabel: string;
  outputLabel: string;
  languageLabel: string;
  options: ReactNode;
};

/** Shared web shell for bounded, live text transformations. */
export function TextTransformWorkspace({
  title,
  subtitle,
  icon: Icon,
  sample,
  input,
  setInput,
  result,
  maxInputChars,
  inputLabel,
  outputLabel,
  languageLabel,
  options,
}: TextTransformWorkspaceProps) {
  const inputId = useId();
  const outputId = useId();
  const inputErrorId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const [copied, setCopied] = useState<"input" | "output" | null>(null);
  const [feedback, setFeedback] = useState("");
  const limitError =
    input.length > maxInputChars
      ? `Input exceeds the ${maxInputChars.toLocaleString()} character limit.`
      : null;
  const error = limitError ?? (!result.ok ? result.error.message : null);
  const output = error || !result.ok ? "" : result.value;

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

  const onCopy = useCallback(
    async (target: "input" | "output", value: string) => {
      const copyResult = await copyText(value);
      if (!copyResult.ok) {
        setCopied(null);
        setFeedback(copyResult.message);
        return;
      }
      showCopied(target);
    },
    [showCopied],
  );

  const resetInput = useCallback(
    (nextValue: string) => {
      setInput(nextValue);
      setCopied(null);
      setFeedback("");
      window.requestAnimationFrame(() => inputRef.current?.focus());
    },
    [setInput],
  );

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <Icon />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">{title}</h2>
          <p className="tool-header__subtitle">{subtitle}</p>
        </div>
        <div className="tool-header__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => resetInput(sample)}
          >
            <FileInput aria-hidden="true" />
            Sample
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => resetInput("")}
          >
            <Eraser aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>

      <div className="tool-options">{options}</div>
      <p className="tool-field-note">
        Runs locally · up to {maxInputChars.toLocaleString()} characters
      </p>
      <output
        className={feedback ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        role={feedback ? "alert" : undefined}
        aria-live={feedback ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {feedback}
      </output>

      <div className="tool-editor">
        <TextCard
          label={inputLabel}
          variant="in"
          copied={copied === "input"}
          canCopy={Boolean(input)}
          onCopy={() => void onCopy("input", input)}
          onClear={() => resetInput("")}
          hint={
            error ? (
              <span id={inputErrorId} className="tool-card__validation" role="alert">
                <CircleAlert aria-hidden="true" />
                <span>{error}</span>
              </span>
            ) : (
              <span>Editable · {input.length.toLocaleString()} chars</span>
            )
          }
        >
          <label htmlFor={inputId} className="sr-only">
            {inputLabel}
          </label>
          <Textarea
            ref={inputRef}
            id={inputId}
            className="tool-card__textarea"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setCopied(null);
              setFeedback("");
            }}
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? inputErrorId : undefined}
            placeholder={`Paste text to ${title.toLowerCase()}…`}
          />
        </TextCard>

        <div className="tool-rail" aria-hidden="true">
          <FileCode className="size-5 text-[var(--on-muted)]" />
        </div>

        <TextCard
          label={outputLabel}
          variant="out"
          copied={copied === "output"}
          canCopy={Boolean(output)}
          onCopy={() => void onCopy("output", output)}
          hint={<span>Read-only · {output.length.toLocaleString()} chars</span>}
        >
          <label htmlFor={outputId} className="sr-only">
            {outputLabel}
          </label>
          <Textarea
            id={outputId}
            className="tool-card__textarea"
            value={output}
            readOnly
            spellCheck={false}
            placeholder={error ? "Fix the input to see the result…" : "Result appears here…"}
          />
        </TextCard>
      </div>

      <div className="tool-status">
        <div className="tool-status__left">
          <span
            className={
              error
                ? "tool-status__chip tool-status__chip--error"
                : input
                  ? "tool-status__chip"
                  : "tool-status__chip tool-status__chip--ready"
            }
          >
            {!error && input ? <CircleCheck aria-hidden="true" /> : null}
            {error ? "Error" : input ? "Converted" : "Ready"}
          </span>
        </div>
        <span className="tool-status__lang">
          <FileCode aria-hidden="true" />
          {languageLabel}
        </span>
      </div>
    </>
  );
}

function TextCard({
  label,
  variant,
  copied,
  canCopy,
  onCopy,
  onClear,
  hint,
  children,
}: {
  label: string;
  variant: "in" | "out";
  copied: boolean;
  canCopy: boolean;
  onCopy: () => void;
  onClear?: () => void;
  hint: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`tool-card tool-card--${variant}`}>
      <div className="tool-card__header">
        <div className="tool-card__title-group">
          <span
            className={
              variant === "in"
                ? "tool-card__dot tool-card__dot--in"
                : "tool-card__dot tool-card__dot--out"
            }
            aria-hidden="true"
          />
          <span className="tool-card__label">{label}</span>
        </div>
        <div className="tool-card__toolbar">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="tool-card__tb-btn"
            onClick={onCopy}
            disabled={!canCopy}
            aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
            title={copied ? `Copied ${label}` : `Copy ${label}`}
          >
            {copied ? (
              <CircleCheck className="tool-card__tb-icon--success" aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
          </Button>
          {onClear ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="tool-card__tb-btn"
              onClick={onClear}
              disabled={!canCopy}
              aria-label={`Clear ${label}`}
              title={`Clear ${label}`}
            >
              <Eraser aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="tool-card__body">{children}</div>
      <div className="tool-card__hint">{hint}</div>
    </div>
  );
}
