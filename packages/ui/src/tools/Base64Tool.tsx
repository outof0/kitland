import { BASE64_MAX_ENCODED_CHARS, BASE64_MAX_INPUT_CHARS, type Base64Mode } from "@kitland/core";
import { ArrowRight, Binary } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TextTransformEditor } from "../components/TextTransformEditor";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { useSyncBase64Transform, type Base64TransformHook } from "./useSyncBase64Transform";

export type Base64Format = "standard" | "url-safe";

export type Base64ShareState = {
  mode: Base64Mode;
  format: Base64Format;
  input: string;
};

export type Base64ToolProps = {
  /**
   * Host transform engine. Web passes its worker-backed hook; extension hosts
   * may pass their own worker runtime. Defaults to a synchronous core call.
   */
  readonly useTransform?: Base64TransformHook;
  /**
   * Share-link support is a Web-only platform contract. Hosts that must not
   * create share links leave this unset and the share UI stays hidden.
   */
  readonly share?: {
    readonly readState?: () => Base64ShareState | null;
    readonly createUrl: (state: Base64ShareState) => Promise<string | void> | string | void;
  };
  /**
   * Host-declared local powers (file open/save). Defaults to local-only
   * (no file open/save); hosts that enable file I/O pass explicit capabilities.
   */
  readonly capabilities?: ToolCapabilities;
  readonly initialInput?: string;
};

const SAMPLE_INPUT = "Hello, world!\nThis is a secret message.";

/**
 * Base64 conversion tool shared across hosts, matching the
 * standardized TextTransformEditor layout. Supports UTF-8 text encoding and
 * decoding with Standard and URL-safe Base64 variants.
 */
export function Base64Tool({
  useTransform = useSyncBase64Transform,
  share,
  capabilities = LOCAL_ONLY_CAPABILITIES,
  initialInput,
}: Base64ToolProps) {
  const initialShare = useRef(share?.readState ? share.readState() : null);
  const [mode, setMode] = useState<Base64Mode>(() => initialShare.current?.mode ?? "encode");
  const [format, setFormat] = useState<Base64Format>(
    () => initialShare.current?.format ?? "standard",
  );
  const [source, setSource] = useState<string>(() => {
    if (initialInput !== undefined && initialInput !== "") return initialInput;
    if (initialShare.current?.input) return initialShare.current.input;
    return SAMPLE_INPUT;
  });

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setSource(initialInput);
    }
  }, [initialInput]);

  const inputLimit = mode === "encode" ? BASE64_MAX_INPUT_CHARS : BASE64_MAX_ENCODED_CHARS;
  const inputLimitError = source.length > inputLimit;
  const urlSafe = format === "url-safe";

  const state = useTransform(mode, source, {
    enabled: !inputLimitError,
    urlSafe,
  });

  const onSwap = useCallback(() => {
    const nextInput = state.result.ok ? state.result.value : "";
    setSource(nextInput);
    setMode((m) => (m === "encode" ? "decode" : "encode"));
  }, [state.result]);

  const onSample = useCallback(() => {
    setMode("encode");
    setFormat("standard");
    setSource(SAMPLE_INPUT);
  }, []);

  const handleShare = useCallback(async () => {
    if (!share) return;
    return await share.createUrl({ mode, format, input: source });
  }, [format, mode, share, source]);

  const formatLabel = urlSafe ? "Base64URL" : "Standard Base64";
  const validLabel = mode === "encode" ? "UTF-8" : formatLabel;
  const langTag = mode === "encode" ? (urlSafe ? "B64URL" : "B64") : "UTF-8";
  const swapLabel =
    mode === "encode"
      ? "Use the result as input and switch to Decode"
      : "Use the result as input and switch to Encode";
  const copyOutputLabel = `Copy ${mode === "encode" ? `${formatLabel} result` : "UTF-8 text result"}`;

  return (
    <TextTransformEditor
      icon={Binary}
      title="Base64"
      description="UTF-8 text with Standard or URL-safe Base64 — binary files are not supported."
      inputLabel={mode === "encode" ? "UTF-8 text input" : `${formatLabel} input`}
      outputLabel={mode === "encode" ? `${formatLabel} result` : "UTF-8 text result"}
      placeholder={
        mode === "encode" ? "Paste UTF-8 text to encode…" : `Paste ${formatLabel} text to decode…`
      }
      source={source}
      onSourceChange={setSource}
      onSample={onSample}
      maxInputChars={inputLimit}
      state={state}
      langTag={langTag}
      actionLabel={mode === "encode" ? "Encode" : "Decode"}
      actionIcon={ArrowRight}
      outputExtension="txt"
      outputMimeType="text/plain"
      onSwap={onSwap}
      swapLabel={swapLabel}
      validLabel={validLabel}
      showShare={share !== undefined}
      shareDisclosure="Share links include the current input. Don't share secrets."
      {...(share ? { onShare: handleShare } : {})}
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      copyOutputLabel={copyOutputLabel}
      hideActionWhenAuto
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                mode === "encode" ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => setMode("encode")}
            >
              Encode
            </button>
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                mode === "decode" ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => setMode("decode")}
            >
              Decode
            </button>
          </div>

          <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                format === "standard"
                  ? "text-primary-strong"
                  : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => setFormat("standard")}
              title="Uses + and / with canonical = padding"
            >
              Standard
            </button>
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                format === "url-safe"
                  ? "text-primary-strong"
                  : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => setFormat("url-safe")}
              title="Uses - and _; padding is optional"
            >
              Base64URL
            </button>
          </div>
        </div>
      }
    />
  );
}
