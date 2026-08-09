import {
  BASE64_MAX_ENCODED_CHARS,
  BASE64_MAX_INPUT_CHARS,
  BASE64_MAX_UTF8_BYTES,
  type Base64Mode,
} from "@kitland/core";
import { getToolBySlug } from "@kitland/tool-catalog";
import { useBase64Transform } from "@/hooks/useBase64Transform";
import {
  BASE64_SHARE_URL_MAX_LENGTH,
  createBase64ShareUrl,
  isBase64ShareHash,
  readBase64ShareState,
  type Base64Format,
  type SharedBase64State,
} from "@/lib/base64-share";
import { copyText, downloadText, pickTextFile } from "@/lib/clipboard";
import {
  ArrowLeftRight,
  Binary,
  CircleAlert,
  CircleCheck,
  Copy,
  Eraser,
  FileCode,
  FileInput,
  Link,
  Save,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
  type ReactNode,
} from "react";

const tool = getToolBySlug("base64");

/** Sample copy from design.pen Base64 → Input Body. */
const SAMPLE_INPUT = "Hello, world!\nThis is a secret message.";
const COPY_CONFIRMATION_MS = 900;
const MESSAGE_FEEDBACK_MS = 4_000;

// Shared links can only be read in the browser. Keep the server and first
// client render identical, then restore fragment state before the first paint.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type CopyTarget = "output" | "input" | "share";
type Feedback = {
  tone: "error" | "info";
  message: string;
};

/**
 * design.pen · Base64 (Z1RWQB) — golden path per KIT-0001.
 * This tool deliberately operates on UTF-8 text, not arbitrary binary files.
 */
export function Base64Tool() {
  const inputId = useId();
  const outputId = useId();
  const inputHelpId = useId();
  const inputErrorId = useId();
  const outputHelpId = useId();
  const shareDescriptionId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const copyResetTimer = useRef<number | undefined>(undefined);
  const feedbackResetTimer = useRef<number | undefined>(undefined);
  const [mode, setMode] = useState<Base64Mode>("encode");
  const [format, setFormat] = useState<Base64Format>("standard");
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [copyAnnouncement, setCopyAnnouncement] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useIsomorphicLayoutEffect(() => {
    const sharedState = readSharedBase64State();
    if (!sharedState) return;

    setMode(sharedState.mode);
    setFormat(sharedState.format);
    setInput(sharedState.input);
  }, []);

  const urlSafe = format === "url-safe";
  const inputLimit = mode === "encode" ? BASE64_MAX_INPUT_CHARS : BASE64_MAX_ENCODED_CHARS;
  const uploadByteLimit = mode === "encode" ? BASE64_MAX_UTF8_BYTES : BASE64_MAX_ENCODED_CHARS;
  const inputLimitError =
    input.length > inputLimit
      ? `Input exceeds the ${inputLimit.toLocaleString()} character limit.`
      : null;
  const {
    result: transformResult,
    outputByteLength,
    isProcessing,
  } = useBase64Transform(mode, input, { enabled: !inputLimitError, urlSafe });
  const transformError =
    input.length === 0
      ? null
      : (inputLimitError ??
        (!isProcessing && !transformResult.ok ? transformResult.error.message : null));
  // Keep validation in the input card's fixed-height footer. Rendering an
  // alert as its own workspace item made the editor split jump every time a
  // debounced decode error arrived or was resolved.
  const inputValidationMessage = transformError
    ? `${transformError} ${
        inputLimitError
          ? "Shorten the input and try again."
          : mode === "decode"
            ? "Check the selected format and padding."
            : "Please try again."
      }`
    : uploadError;
  const output =
    !isProcessing && transformResult.ok && !inputLimitError ? transformResult.value : "";
  const canCopyOutput = Boolean(output) && !transformError && !isProcessing;

  const lineCount = countTextLines(input);
  const charCount = input.length;
  const byteLabel = formatBytes(output ? outputByteLength : 0);
  const formatLabel = urlSafe ? "Base64URL" : "Standard Base64";
  const inputLabel = mode === "encode" ? "UTF-8 text input" : `${formatLabel} input`;
  const outputLabel = mode === "encode" ? `${formatLabel} result` : "UTF-8 text result";
  const statusLabel =
    input.length === 0
      ? "Ready"
      : transformError
        ? "Error"
        : isProcessing
          ? "Processing…"
          : mode === "encode"
            ? "Encoded"
            : "Decoded";
  const inputContractNote =
    mode === "encode"
      ? `UTF-8 text · ≤${formatCount(inputLimit)} chars / ${formatBytes(BASE64_MAX_UTF8_BYTES)}`
      : `${formatLabel} · ≤${formatCount(inputLimit)} chars`;

  useEffect(
    () => () => {
      if (copyResetTimer.current !== undefined) {
        window.clearTimeout(copyResetTimer.current);
      }
      if (feedbackResetTimer.current !== undefined) {
        window.clearTimeout(feedbackResetTimer.current);
      }
    },
    [],
  );

  const clearFeedback = useCallback(() => {
    if (feedbackResetTimer.current !== undefined) {
      window.clearTimeout(feedbackResetTimer.current);
      feedbackResetTimer.current = undefined;
    }
    setFeedback(null);
  }, []);

  const showFeedback = useCallback((nextFeedback: Feedback, duration = MESSAGE_FEEDBACK_MS) => {
    if (feedbackResetTimer.current !== undefined) {
      window.clearTimeout(feedbackResetTimer.current);
    }
    setFeedback(nextFeedback);
    feedbackResetTimer.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackResetTimer.current = undefined;
    }, duration);
  }, []);

  const showCopySuccess = useCallback(
    (target: CopyTarget) => {
      setCopied(target);
      setCopyAnnouncement(getCopyAnnouncement(target));
      clearFeedback();

      if (copyResetTimer.current !== undefined) {
        window.clearTimeout(copyResetTimer.current);
      }
      copyResetTimer.current = window.setTimeout(() => {
        setCopied((current) => (current === target ? null : current));
        setCopyAnnouncement("");
        copyResetTimer.current = undefined;
      }, COPY_CONFIRMATION_MS);
    },
    [clearFeedback],
  );

  const showCopyFailure = useCallback(
    (message: string) => {
      setCopied(null);
      setCopyAnnouncement("");
      showFeedback({ tone: "error", message });
    },
    [showFeedback],
  );

  const onCopyOutput = useCallback(async () => {
    if (!canCopyOutput) {
      showCopyFailure(
        isProcessing
          ? "The result is still processing. Please wait before copying."
          : "Create a valid result before copying it.",
      );
      return;
    }

    const copiedResult = await copyText(output);
    if (copiedResult.ok) {
      showCopySuccess("output");
    } else {
      showCopyFailure(copiedResult.message);
    }
  }, [canCopyOutput, isProcessing, output, showCopyFailure, showCopySuccess]);

  const onCopyInput = useCallback(async () => {
    if (!input) {
      showCopyFailure("There is no input to copy yet.");
      return;
    }

    const copiedResult = await copyText(input);
    if (copiedResult.ok) {
      showCopySuccess("input");
    } else {
      showCopyFailure(copiedResult.message);
    }
  }, [input, showCopyFailure, showCopySuccess]);

  const onSave = useCallback(() => {
    if (!canCopyOutput) return;
    downloadText(
      mode === "encode"
        ? urlSafe
          ? "encoded.base64url.txt"
          : "encoded.base64.txt"
        : "decoded.txt",
      output,
    );
  }, [canCopyOutput, mode, output, urlSafe]);

  const onSample = useCallback(() => {
    clearSharedUrlFragment();
    setMode("encode");
    setFormat("standard");
    setInput(SAMPLE_INPUT);
    setUploadError(null);
    setCopied(null);
    setCopyAnnouncement("");
    clearFeedback();
    inputRef.current?.focus();
  }, [clearFeedback]);

  const onClear = useCallback(() => {
    clearSharedUrlFragment();
    setInput("");
    setUploadError(null);
    setCopied(null);
    setCopyAnnouncement("");
    clearFeedback();
    inputRef.current?.focus();
  }, [clearFeedback]);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      clearSharedUrlFragment();
      setInput(event.target.value);
      setUploadError(null);
      setCopied(null);
      setCopyAnnouncement("");
      clearFeedback();
    },
    [clearFeedback],
  );

  const onModeChange = useCallback(
    (nextMode: Base64Mode) => {
      if (nextMode === mode) return;

      // A visible result is the only safe value to carry across directions. This
      // preserves a valid round trip instead of making that result invalid input.
      if (!isProcessing && !inputLimitError && transformResult.ok) {
        const nextInputLimit =
          nextMode === "encode" ? BASE64_MAX_INPUT_CHARS : BASE64_MAX_ENCODED_CHARS;

        // Decode accepts a larger encoded payload than Encode accepts as source
        // text. Do not turn a valid result into a red validation error just by
        // changing direction; retain the current, usable conversion instead.
        if (transformResult.value.length > nextInputLimit) {
          setCopied(null);
          setCopyAnnouncement("");
          showFeedback({
            tone: "info",
            message: `Kept ${mode === "decode" ? "Decode" : "Encode"} selected: this ${formatCount(
              transformResult.value.length,
            )}-character result exceeds the ${formatCount(nextInputLimit)}-character ${nextMode === "encode" ? "Encode" : "Decode"} input limit.`,
          });
          return;
        }

        setInput(transformResult.value);
      }

      clearSharedUrlFragment();
      setMode(nextMode);
      setUploadError(null);
      setCopied(null);
      setCopyAnnouncement("");
      clearFeedback();
    },
    [clearFeedback, inputLimitError, isProcessing, mode, showFeedback, transformResult],
  );

  const onSwap = useCallback(() => {
    onModeChange(mode === "encode" ? "decode" : "encode");
  }, [mode, onModeChange]);

  const onFormatChange = useCallback(
    (nextFormat: Base64Format) => {
      if (nextFormat !== format) {
        clearSharedUrlFragment();
      }
      setFormat(nextFormat);
      setUploadError(null);
      setCopied(null);
      setCopyAnnouncement("");
      clearFeedback();
    },
    [clearFeedback, format],
  );

  const onShare = useCallback(async () => {
    // Encoding a 2M-character editor value just to reject it would allocate a
    // multi-megabyte URL. Any raw value over the URL cap cannot fit anyway.
    if (input.length > BASE64_SHARE_URL_MAX_LENGTH) {
      setCopied(null);
      setCopyAnnouncement("");
      showFeedback({
        tone: "error",
        message: `This input is too long for a share link (limit: ${BASE64_SHARE_URL_MAX_LENGTH.toLocaleString()} URL characters).`,
      });
      return;
    }

    const sharedUrl = createBase64ShareUrl({ mode, format, input }, window.location.href);

    if (sharedUrl.length > BASE64_SHARE_URL_MAX_LENGTH) {
      setCopied(null);
      setCopyAnnouncement("");
      showFeedback({
        tone: "error",
        message: `This input is too long for a share link (limit: ${BASE64_SHARE_URL_MAX_LENGTH.toLocaleString()} URL characters).`,
      });
      return;
    }

    // Clipboard access is activation-gated in some browsers. Run it before
    // history work so Share remains reliable under that stricter policy.
    const copiedResult = await copyText(sharedUrl);

    let addressUpdated = true;
    try {
      // Deliberately update only after the user asks to share: input never leaks
      // into the URL during normal editing.
      window.history.replaceState(window.history.state, "", sharedUrl);
    } catch {
      addressUpdated = false;
    }

    if (copiedResult.ok) {
      showCopySuccess("share");
    } else {
      setCopied(null);
      setCopyAnnouncement("");
      showFeedback({
        tone: "error",
        message: addressUpdated
          ? "Couldn’t access your clipboard. The current URL contains this input in its fragment; copy it from the address bar."
          : "Couldn’t access your clipboard. The share link contains this input; please try again.",
      });
    }
  }, [format, input, mode, showCopySuccess, showFeedback]);

  const onUpload = useCallback(async () => {
    const picked = await pickTextFile({
      maxBytes: uploadByteLimit,
      maxChars: inputLimit,
    });

    if (!picked.ok) {
      if (picked.code !== "CANCELLED") {
        setUploadError(picked.message);
        setCopied(null);
        setCopyAnnouncement("");
        clearFeedback();
      }
      // The dynamically-created picker is removed before this promise settles.
      // Return focus to its invoker on both cancellation and failure so keyboard
      // users never lose their place in the editor toolbar.
      window.requestAnimationFrame(() => uploadButtonRef.current?.focus());
      return;
    }

    clearSharedUrlFragment();
    setInput(picked.text);
    setUploadError(null);
    setCopied(null);
    setCopyAnnouncement("");
    clearFeedback();
    inputRef.current?.focus();
  }, [clearFeedback, inputLimit, uploadByteLimit]);

  if (!tool) {
    return (
      <p role="alert" className="tool-alert">
        Tool definition missing from catalog.
      </p>
    );
  }

  const inputDescriptionIds = [inputHelpId, transformError ? inputErrorId : undefined]
    .filter((id): id is string => Boolean(id))
    .join(" ");
  const shareTitle = input
    ? "Includes the current input in the link. Do not share secrets."
    : "Enter input before creating a share link";
  const encodeSwapLimitMessage =
    mode === "decode" &&
    !isProcessing &&
    !inputLimitError &&
    transformResult.ok &&
    transformResult.value.length > BASE64_MAX_INPUT_CHARS
      ? `Decoded result exceeds the ${formatCount(BASE64_MAX_INPUT_CHARS)}-character Encode input limit.`
      : null;
  const swapTarget = mode === "encode" ? "Decode" : "Encode";
  const swapTitle = isProcessing
    ? "Wait for the current result before switching directions"
    : (encodeSwapLimitMessage ?? `Use the result as input and switch to ${swapTarget}`);

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <Binary />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">Encode / Decode</h2>
          <p className="tool-header__subtitle">
            UTF-8 text with Standard or URL-safe Base64 — binary files are not supported.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button type="button" variant="ghost" size="sm" className="tool-btn" onClick={onSample}>
            <FileInput aria-hidden="true" />
            Sample
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn tool-btn--share"
            onClick={() => void onShare()}
            disabled={!input}
            aria-label={copied === "share" ? "Share input link copied" : "Share input link"}
            aria-describedby={shareDescriptionId}
            title={shareTitle}
          >
            {copied === "share" ? <CircleCheck aria-hidden="true" /> : <Link aria-hidden="true" />}
            {copied === "share" ? "Link copied" : "Share input"}
          </Button>
        </div>
      </div>
      <p id={shareDescriptionId} className="tool-share-notice">
        Share links include the current input. Don’t share secrets.
      </p>

      <div className="tool-options">
        <fieldset className="tool-mode">
          <legend className="sr-only">Conversion mode</legend>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={
              mode === "encode" ? "tool-mode__seg tool-mode__seg--active" : "tool-mode__seg"
            }
            aria-pressed={mode === "encode"}
            onClick={() => onModeChange("encode")}
            disabled={isProcessing}
            title={
              isProcessing
                ? "Wait for the current result before switching directions"
                : (encodeSwapLimitMessage ?? "Move the current result into input and encode")
            }
          >
            Encode
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={
              mode === "decode" ? "tool-mode__seg tool-mode__seg--active" : "tool-mode__seg"
            }
            aria-pressed={mode === "decode"}
            onClick={() => onModeChange("decode")}
            disabled={isProcessing}
            title={
              isProcessing
                ? "Wait for the current result before switching directions"
                : "Move the current result into input and decode"
            }
          >
            Decode
          </Button>
        </fieldset>

        <fieldset className="tool-format">
          <legend className="sr-only">Base64 format</legend>
          <span className="tool-format__label">Format</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={
              format === "standard"
                ? "tool-format__seg tool-format__seg--active"
                : "tool-format__seg"
            }
            aria-pressed={format === "standard"}
            onClick={() => onFormatChange("standard")}
            title="Uses + and / with canonical = padding"
          >
            Standard
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={
              format === "url-safe"
                ? "tool-format__seg tool-format__seg--active"
                : "tool-format__seg"
            }
            aria-pressed={format === "url-safe"}
            onClick={() => onFormatChange("url-safe")}
            title="Uses - and _; padding is optional"
          >
            Base64URL
          </Button>
        </fieldset>
      </div>

      <output
        className={feedback ? `tool-feedback tool-feedback--${feedback.tone}` : "tool-feedback"}
        role={feedback?.tone === "error" ? "alert" : undefined}
        aria-live={feedback?.tone === "error" ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {feedback?.message ?? ""}
      </output>
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {copyAnnouncement}
      </output>

      <p id={inputHelpId} className="tool-field-note">
        {inputContractNote}
      </p>

      <div className="tool-editor">
        <EditorCard
          label={inputLabel}
          variant="in"
          copied={copied === "input"}
          canCopy={Boolean(input)}
          onCopy={() => void onCopyInput()}
          onUpload={() => void onUpload()}
          uploadButtonRef={uploadButtonRef}
          onClear={onClear}
          hint={
            inputValidationMessage ? (
              <span
                id={transformError ? inputErrorId : undefined}
                className="tool-card__validation"
                role="alert"
                aria-atomic="true"
                title={inputValidationMessage}
              >
                <CircleAlert aria-hidden="true" />
                <span>{inputValidationMessage}</span>
              </span>
            ) : (
              <span>
                Editable · {formatCount(charCount)} chars · {lineCount} line
                {lineCount === 1 ? "" : "s"}
              </span>
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
            onChange={onInputChange}
            spellCheck={false}
            aria-invalid={transformError ? true : undefined}
            aria-describedby={inputDescriptionIds}
            placeholder={
              mode === "encode"
                ? "Paste UTF-8 text to encode…"
                : `Paste ${formatLabel} text to decode…`
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
              disabled={isProcessing}
              aria-label={swapTitle}
              title={swapTitle}
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
          canCopy={canCopyOutput}
          onCopy={() => void onCopyOutput()}
          canSave={canCopyOutput}
          onSave={onSave}
          hint={
            <span id={outputHelpId}>
              Read-only · {formatCount(output.length)} chars · {byteLabel}
            </span>
          }
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
            aria-describedby={outputHelpId}
            placeholder={isProcessing ? "Processing result…" : "Result appears here…"}
          />
        </EditorCard>
      </div>

      <div className="tool-status">
        <div className="tool-status__left">
          <span
            className={
              input.length === 0
                ? "tool-status__chip tool-status__chip--ready"
                : transformError
                  ? "tool-status__chip tool-status__chip--error"
                  : isProcessing
                    ? "tool-status__chip tool-status__chip--processing"
                    : "tool-status__chip"
            }
          >
            {input.length > 0 && !transformError && !isProcessing ? (
              <CircleCheck aria-hidden="true" />
            ) : null}
            {statusLabel}
          </span>
        </div>
        <span className="tool-status__lang">
          <FileCode aria-hidden="true" />
          {urlSafe ? "B64URL" : "B64"}
        </span>
      </div>
    </>
  );
}

function EditorCard({
  label,
  variant,
  children,
  copied = false,
  canCopy = false,
  onCopy,
  canSave = false,
  onSave,
  onUpload,
  uploadButtonRef,
  onClear,
  hint,
}: {
  label: string;
  variant: "in" | "out";
  children: ReactNode;
  copied?: boolean;
  canCopy?: boolean;
  onCopy?: () => void;
  canSave?: boolean;
  onSave?: () => void;
  onUpload?: () => void;
  uploadButtonRef?: RefObject<HTMLButtonElement | null>;
  onClear?: () => void;
  hint?: ReactNode;
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
          {onCopy ? (
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
          ) : null}
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
          {onUpload ? (
            <Button
              ref={uploadButtonRef}
              type="button"
              variant="ghost"
              size="icon-xs"
              className="tool-card__tb-btn"
              aria-label="Upload UTF-8 text file"
              title="Upload a UTF-8 text file"
              onClick={onUpload}
            >
              <Upload aria-hidden="true" />
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
        {hint ? <div className="tool-card__hint">{hint}</div> : null}
      </div>
    </div>
  );
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

function getCopyAnnouncement(target: CopyTarget): string {
  switch (target) {
    case "input":
      return "Input copied to clipboard.";
    case "output":
      return "Result copied to clipboard.";
    case "share":
      return "Share input link copied to clipboard.";
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Count CRLF, CR, and LF without creating an array for a multi-megabyte input. */
function countTextLines(value: string): number {
  if (!value) return 1;

  let lines = 1;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code === 10) {
      lines += 1;
    } else if (code === 13) {
      lines += 1;
      if (value.charCodeAt(index + 1) === 10) index += 1;
    }
  }
  return lines;
}

function clearSharedUrlFragment(): void {
  if (typeof window === "undefined" || !isBase64ShareHash(window.location.hash)) {
    return;
  }

  try {
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(window.history.state, "", url);
  } catch {
    // A stale fragment is harmless if history access is unavailable.
  }
}

function readSharedBase64State(): SharedBase64State | null {
  if (typeof window === "undefined") return null;
  return readBase64ShareState(window.location.href);
}
