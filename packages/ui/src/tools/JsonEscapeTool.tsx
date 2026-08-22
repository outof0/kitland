import { TextTransformEditor } from "../components/TextTransformEditor";
import { useJsonEscape } from "../hooks/migrated-tool-hooks";
import {
  JSON_ESCAPE_MAX_ENCODED_CHARS,
  JSON_ESCAPE_MAX_INPUT_CHARS,
  type JsonEscapeMode,
  type JsonEscapeOptions,
} from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { Quote } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SAMPLE_RAW =
  '{\n  "title": "Kitland Tools",\n  "message": "Hello, \\"world\\"!\\nFast & private 🍵",\n  "count": 42\n}';
const SAMPLE_ESCAPED =
  '"{\\n  \\"title\\": \\"Kitland Tools\\",\\n  \\"message\\": \\"Hello, \\\\\\"world\\\\\\"!\\\\nFast & private 🍵\\",\\n  \\"count\\\": 42\\n}"';

export type JsonEscapeToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** Escape plain text or JSON into a quoted/escaped JSON string, or decode one back to text. */
export function JsonEscapeTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: JsonEscapeToolProps = {}) {
  const [mode, setMode] = useState<JsonEscapeMode>("encode");
  const [source, setSource] = useState(initialInput ?? SAMPLE_RAW);
  const [wrapQuotes, setWrapQuotes] = useState(true);
  const [escapeSlashes, setEscapeSlashes] = useState(false);
  const [escapeUnicode, setEscapeUnicode] = useState(false);

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

  const escapeOptions = useMemo<JsonEscapeOptions>(
    () => ({
      wrapQuotes,
      escapeSlashes,
      escapeUnicode,
    }),
    [wrapQuotes, escapeSlashes, escapeUnicode],
  );

  const state = useJsonEscape(source, mode, escapeOptions);

  const inputLimit =
    mode === "encode" ? JSON_ESCAPE_MAX_INPUT_CHARS : JSON_ESCAPE_MAX_ENCODED_CHARS;

  const handleModeChange = useCallback(
    (nextMode: JsonEscapeMode) => {
      if (nextMode === mode) return;
      if (state.result.ok && state.result.value) {
        setSource(state.result.value);
      } else {
        setSource(nextMode === "encode" ? SAMPLE_RAW : SAMPLE_ESCAPED);
      }
      setMode(nextMode);
    },
    [mode, state.result],
  );

  const onSwap = useCallback(() => {
    const nextInput = state.result.ok ? state.result.value : "";
    setSource(nextInput);
    setMode((m) => (m === "encode" ? "decode" : "encode"));
  }, [state.result]);

  const onSample = useCallback(() => {
    setSource(mode === "encode" ? SAMPLE_RAW : SAMPLE_ESCAPED);
  }, [mode]);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={Quote}
      title="JSON Escape"
      description="Escape plain text or raw JSON into a JSON string, or unescape one safely."
      inputLabel={mode === "encode" ? "Plain text / JSON" : "Escaped text / JSON"}
      outputLabel={
        mode === "encode"
          ? wrapQuotes
            ? 'JSON string literal ("...")'
            : "Escaped string"
          : "Unescaped text / JSON"
      }
      placeholder={
        mode === "encode"
          ? "Paste plain text, code, or JSON to escape into a JSON string…"
          : 'Paste escaped JSON or string literal to unescape (e.g. "hello\\nworld" or {\\"a\\": 1})…'
      }
      source={source}
      onSourceChange={setSource}
      onSample={onSample}
      maxInputChars={inputLimit}
      state={state}
      langTag={mode === "encode" ? "JSON" : "Text"}
      inputLanguage="json"
      actionLabel={mode === "encode" ? "Escape" : "Unescape"}
      actionIcon={Quote}
      outputExtension="txt"
      outputFileName={mode === "encode" ? "escaped-json.txt" : "unescaped.json"}
      outputMimeType="text/plain"
      onSwap={onSwap}
      swapLabel="Swap"
      validLabel={mode === "encode" ? "Plain Text / JSON" : "Escaped Input"}
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
                mode === "encode" ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => handleModeChange("encode")}
            >
              Escape
            </button>
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
                mode === "decode" ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => handleModeChange("decode")}
            >
              Unescape
            </button>
          </div>

          {mode === "encode" && (
            <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
              <button
                type="button"
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  wrapQuotes ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
                }`}
                aria-pressed={wrapQuotes}
                onClick={() => setWrapQuotes((prev) => !prev)}
                title="Wrap output in double quotes"
              >
                Quotes (&quot;...&quot;)
              </button>
              <button
                type="button"
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  escapeSlashes ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
                }`}
                aria-pressed={escapeSlashes}
                onClick={() => setEscapeSlashes((prev) => !prev)}
                title="Escape forward slashes (/ -> \/)"
              >
                Escape /
              </button>
              <button
                type="button"
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  escapeUnicode ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
                }`}
                aria-pressed={escapeUnicode}
                onClick={() => setEscapeUnicode((prev) => !prev)}
                title="Escape non-ASCII Unicode characters (\uXXXX)"
              >
                ASCII only (\uXXXX)
              </button>
            </div>
          )}
        </div>
      }
    />
  );
}
