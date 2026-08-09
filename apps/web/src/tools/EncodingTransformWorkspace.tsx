import { Button } from "@/components/ui/button";
import { useEncodingTextTransform } from "@/hooks/useEncodingTextTransform";
import { copyText, downloadText } from "@/lib/clipboard";
import {
  ArrowLeftRight,
  Binary,
  Braces,
  CircleAlert,
  CircleCheck,
  Copy,
  Eraser,
  FileCode,
  FileInput,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { EncodingTextFormat, EncodingTextTool } from "./encoding-text-transform";

type FormatChoice = {
  value: Exclude<EncodingTextFormat, undefined>;
  label: string;
  title: string;
};

type EncodingTransformWorkspaceProps = {
  tool: EncodingTextTool;
  title: string;
  subtitle: string;
  sample: string;
  inputLimit: number;
  formatLabel?: string;
  formatChoices?: readonly FormatChoice[];
  defaultFormat?: EncodingTextFormat;
  contractNote: string;
};

const COPY_CONFIRMATION_MS = 900;

/** Shared accessible shell for the first deterministic encoding-tool wave. */
export function EncodingTransformWorkspace({
  tool,
  title,
  subtitle,
  sample,
  inputLimit,
  formatLabel,
  formatChoices,
  defaultFormat,
  contractNote,
}: EncodingTransformWorkspaceProps) {
  const inputId = useId();
  const outputId = useId();
  const inputErrorId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [format, setFormat] = useState<EncodingTextFormat>(defaultFormat);
  const [input, setInput] = useState(sample);
  const [copied, setCopied] = useState<"input" | "output" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { result, isProcessing } = useEncodingTextTransform(tool, mode, input, format);
  const inputLimitError =
    input.length > inputLimit
      ? `Input exceeds the ${inputLimit.toLocaleString()} character limit.`
      : null;
  const transformError =
    input.length > 0 && !isProcessing
      ? (inputLimitError ?? (!result.ok ? result.error.message : null))
      : null;
  const output = !isProcessing && !transformError && result.ok ? result.value : "";
  const canSwap =
    !isProcessing && !inputLimitError && result.ok && result.value.length <= inputLimit;

  useEffect(
    () => () => {
      if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const showCopied = useCallback((target: "input" | "output") => {
    setFeedback(null);
    setCopied(target);
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
      if (copiedResult.ok) {
        showCopied(target);
      } else {
        setCopied(null);
        setFeedback(copiedResult.message);
      }
    },
    [showCopied],
  );

  const moveResultToInput = useCallback(
    (nextMode: "encode" | "decode") => {
      if (nextMode === mode) return;
      if (canSwap) setInput(result.value);
      setMode(nextMode);
      setCopied(null);
      setFeedback(null);
    },
    [canSwap, mode, result],
  );

  const inputLabel = mode === "encode" ? "Text input" : `${title} input`;
  const outputLabel = mode === "encode" ? `${title} result` : "Text result";
  const Icon = tool === "binary-text" ? Binary : Braces;

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
            onClick={() => {
              setMode("encode");
              setFormat(defaultFormat);
              setInput(sample);
              setCopied(null);
              setFeedback(null);
              inputRef.current?.focus();
            }}
          >
            <FileInput aria-hidden="true" />
            Sample
          </Button>
        </div>
      </div>

      <div className="tool-options">
        <fieldset className="tool-mode">
          <legend className="sr-only">Conversion mode</legend>
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
              onClick={() => moveResultToInput(nextMode)}
              disabled={isProcessing}
            >
              {nextMode === "encode" ? "Encode" : "Decode"}
            </Button>
          ))}
        </fieldset>

        {formatChoices && formatLabel ? (
          <fieldset className="tool-format">
            <legend className="sr-only">{formatLabel}</legend>
            <span className="tool-format__label">{formatLabel}</span>
            {formatChoices.map((choice) => (
              <Button
                key={choice.value}
                type="button"
                variant="ghost"
                size="sm"
                className={
                  format === choice.value
                    ? "tool-format__seg tool-format__seg--active"
                    : "tool-format__seg"
                }
                aria-pressed={format === choice.value}
                onClick={() => setFormat(choice.value)}
                title={choice.title}
              >
                {choice.label}
              </Button>
            ))}
          </fieldset>
        ) : null}
      </div>

      <p className="tool-field-note">{contractNote}</p>
      <output
        className={feedback ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        role={feedback ? "alert" : undefined}
        aria-live={feedback ? "assertive" : "polite"}
      >
        {feedback ?? ""}
      </output>
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {copied ? `${copied === "input" ? "Input" : "Result"} copied to clipboard.` : ""}
      </output>

      <div className="tool-editor">
        <EditorCard
          label={inputLabel}
          variant="in"
          copied={copied === "input"}
          canCopy={Boolean(input)}
          onCopy={() => void copy("input", input)}
          onClear={() => {
            setInput("");
            setCopied(null);
            setFeedback(null);
            inputRef.current?.focus();
          }}
          hint={
            transformError ? (
              <span id={inputErrorId} className="tool-card__validation" role="alert">
                <CircleAlert aria-hidden="true" />
                <span>{transformError}</span>
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
              setFeedback(null);
            }}
            spellCheck={false}
            aria-invalid={transformError ? true : undefined}
            aria-describedby={transformError ? inputErrorId : undefined}
            placeholder={
              mode === "encode" ? "Paste text to encode…" : "Paste encoded text to decode…"
            }
          />
        </EditorCard>

        <div className="tool-rail">
          <div className="tool-rail__action">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="tool-rail__btn tool-rail__btn--swap"
              onClick={() => moveResultToInput(mode === "encode" ? "decode" : "encode")}
              disabled={!canSwap}
              aria-label="Use the result as input and switch direction"
              title="Use the result as input and switch direction"
            >
              <ArrowLeftRight aria-hidden="true" />
            </Button>
            <span className="tool-rail__lbl">Swap</span>
          </div>
        </div>

        <EditorCard
          label={outputLabel}
          variant="out"
          copied={copied === "output"}
          canCopy={Boolean(output)}
          onCopy={() => void copy("output", output)}
          canSave={Boolean(output)}
          onSave={() =>
            downloadText(`${tool}-${mode === "encode" ? "encoded" : "decoded"}.txt`, output)
          }
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
            placeholder={isProcessing ? "Processing result…" : "Result appears here…"}
          />
        </EditorCard>
      </div>

      <div className="tool-status">
        <div className="tool-status__left">
          <span
            className={
              isProcessing
                ? "tool-status__chip tool-status__chip--processing"
                : transformError
                  ? "tool-status__chip tool-status__chip--error"
                  : "tool-status__chip tool-status__chip--ready"
            }
          >
            {!isProcessing && !transformError ? <CircleCheck aria-hidden="true" /> : null}
            {isProcessing ? "Processing…" : transformError ? "Error" : "Ready"}
          </span>
        </div>
        <span className="tool-status__lang">
          <FileCode aria-hidden="true" />
          Local only
        </span>
      </div>
    </>
  );
}

function EditorCard({
  label,
  variant,
  children,
  copied,
  canCopy,
  onCopy,
  canSave = false,
  onSave,
  onClear,
  hint,
}: {
  label: string;
  variant: "in" | "out";
  children: ReactNode;
  copied: boolean;
  canCopy: boolean;
  onCopy: () => void;
  canSave?: boolean;
  onSave?: () => void;
  onClear?: () => void;
  hint: ReactNode;
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
        <div className={`tool-card__toolbar tool-card__toolbar--${variant}`}>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="tool-card__tb-btn"
            aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
            title={copied ? `Copied ${label}` : `Copy ${label}`}
            onClick={onCopy}
            disabled={!canCopy}
          >
            {copied ? (
              <CircleCheck className="tool-card__tb-icon--success" aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
          </Button>
          {onSave ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="tool-card__tb-btn"
              aria-label="Save result"
              title="Download result as a text file"
              onClick={onSave}
              disabled={!canSave}
            >
              <Save aria-hidden="true" />
            </Button>
          ) : null}
          {onClear ? (
            <>
              <span className="tool-card__tb-sep" aria-hidden="true" />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="tool-card__tb-btn"
                aria-label="Clear input"
                title="Clear input"
                onClick={onClear}
              >
                <Eraser aria-hidden="true" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="tool-card__body">
        <div className="tool-card__code">{children}</div>
        <div className="tool-card__hint">{hint}</div>
      </div>
    </div>
  );
}
