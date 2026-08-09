import {
  URL_TRANSFORM_MAX_INPUT_CHARS,
  type UrlEncodingScope,
  type UrlTransformMode,
} from "@kitland/core";
import { useUrlTransform } from "@/hooks/useUrlTransform";
import { copyText, downloadText } from "@/lib/clipboard";
import {
  ArrowLeftRight,
  Braces,
  CircleAlert,
  CircleCheck,
  Copy,
  Eraser,
  FileCode,
  FileInput,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

const SAMPLE_INPUT = "https://example.test/search?q=cà phê + bánh&tag=🍵#today";
const COPY_CONFIRMATION_MS = 900;

/**
 * Web adapter for the generic transform contract. Input stays in the browser;
 * the only background work is the module worker used for large transforms.
 */
export function UrlEncodeTool() {
  const inputId = useId();
  const outputId = useId();
  const inputErrorId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  const [mode, setMode] = useState<UrlTransformMode>("encode");
  const [scope, setScope] = useState<UrlEncodingScope>("component");
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [copied, setCopied] = useState<"input" | "output" | null>(null);
  const { result, isProcessing } = useUrlTransform(mode, scope, input);
  const inputLimitError =
    input.length > URL_TRANSFORM_MAX_INPUT_CHARS
      ? `Input exceeds the ${URL_TRANSFORM_MAX_INPUT_CHARS.toLocaleString()} character limit.`
      : null;
  const transformError =
    input.length > 0 && !isProcessing
      ? (inputLimitError ?? (!result.ok ? result.error.message : null))
      : null;
  const output = !isProcessing && !transformError && result.ok ? result.value : "";
  const scopeLabel = scope === "component" ? "URL component" : "Full URL";
  const inputLabel = mode === "encode" ? `${scopeLabel} input` : "Percent-encoded input";
  const outputLabel = mode === "encode" ? "Percent-encoded result" : `${scopeLabel} result`;

  useEffect(
    () => () => {
      if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const showCopied = useCallback((target: "input" | "output") => {
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
      if (copiedResult.ok) showCopied(target);
    },
    [showCopied],
  );

  const onSwap = useCallback(() => {
    if (
      isProcessing ||
      !result.ok ||
      inputLimitError ||
      result.value.length > URL_TRANSFORM_MAX_INPUT_CHARS
    ) {
      return;
    }
    setInput(result.value);
    setMode((current) => (current === "encode" ? "decode" : "encode"));
    setCopied(null);
  }, [inputLimitError, isProcessing, result]);

  const onModeChange = useCallback(
    (nextMode: UrlTransformMode) => {
      if (nextMode === mode) return;

      // Carry only an output that the next editor can accept. If an invalid or
      // oversized value is being inspected, changing direction must still be
      // possible so the user can correct it without clearing their text.
      if (
        !isProcessing &&
        result.ok &&
        !inputLimitError &&
        result.value.length <= URL_TRANSFORM_MAX_INPUT_CHARS
      ) {
        setInput(result.value);
      }
      setMode(nextMode);
      setCopied(null);
    },
    [inputLimitError, isProcessing, mode, result],
  );

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <Braces />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">URL Encode / Decode</h2>
          <p className="tool-header__subtitle">
            Percent-encode text locally. Choose whether URI delimiters are data or URL structure.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setMode("encode");
              setScope("component");
              setInput(SAMPLE_INPUT);
              setCopied(null);
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
              onClick={() => onModeChange(nextMode)}
              disabled={isProcessing}
            >
              {nextMode === "encode" ? "Encode" : "Decode"}
            </Button>
          ))}
        </fieldset>

        <fieldset className="tool-format">
          <legend className="sr-only">Encoding scope</legend>
          <span className="tool-format__label">Encode as</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={
              scope === "component"
                ? "tool-format__seg tool-format__seg--active"
                : "tool-format__seg"
            }
            aria-pressed={scope === "component"}
            onClick={() => setScope("component")}
            title="Escapes URI delimiters such as /, ?, &, =, and #"
          >
            Component
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={
              scope === "url" ? "tool-format__seg tool-format__seg--active" : "tool-format__seg"
            }
            aria-pressed={scope === "url"}
            onClick={() => setScope("url")}
            title="Keeps URI delimiters readable and structurally meaningful"
          >
            Full URL
          </Button>
        </fieldset>
      </div>

      <p className="tool-field-note">
        {scope === "component"
          ? "Component escapes / ? & = and # as data."
          : "Full URL keeps : / ? & = and # as URL structure."}{" "}
        A + sign remains +; this tool does not guess HTML form encoding.
      </p>

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
            }}
            spellCheck={false}
            aria-invalid={transformError ? true : undefined}
            aria-describedby={transformError ? inputErrorId : undefined}
            placeholder={
              mode === "encode" ? "Paste text or a URL to encode…" : "Paste percent-encoded text…"
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
              onClick={onSwap}
              disabled={
                isProcessing ||
                !result.ok ||
                Boolean(inputLimitError) ||
                result.value.length > URL_TRANSFORM_MAX_INPUT_CHARS
              }
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
            downloadText(mode === "encode" ? "encoded-url.txt" : "decoded-url.txt", output)
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
          {scope === "component" ? "URI component" : "URI"}
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
