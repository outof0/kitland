import { TextTransformEditor } from "../components/TextTransformEditor";
import { useJsonEscape } from "../hooks/migrated-tool-hooks";
import {
  JSON_ESCAPE_MAX_ENCODED_CHARS,
  JSON_ESCAPE_MAX_INPUT_CHARS,
  type JsonEscapeMode,
} from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { Quote } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const SAMPLE_RAW = 'Hello, "Kitland"!\nPaste this into JSON safely. 🍵';
const SAMPLE_ESCAPED = '"Hello, \\"Kitland\\"!\\nPaste this into JSON safely. 🍵"';

export type JsonEscapeToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** Escape plain text into a quoted JSON string, or decode one back to text. */
export function JsonEscapeTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: JsonEscapeToolProps = {}) {
  const [mode, setMode] = useState<JsonEscapeMode>("encode");
  const [source, setSource] = useState(initialInput ?? SAMPLE_RAW);

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

  const state = useJsonEscape(source, mode);

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
      description="Escape or unescape one JSON string value."
      inputLabel={mode === "encode" ? "Plain text" : "JSON string literal"}
      outputLabel={mode === "encode" ? "JSON string literal" : "Plain text"}
      placeholder={
        mode === "encode"
          ? "Paste plain text to escape into a JSON string…"
          : 'Paste a JSON string literal with surrounding quotes, e.g. "hello\\nworld"…'
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
      outputFileName="escaped-json.txt"
      outputMimeType="text/plain"
      onSwap={onSwap}
      swapLabel="Swap"
      validLabel={mode === "encode" ? "Plain Text" : "JSON String"}
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-[32px] flex items-center gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
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
        </div>
      }
    />
  );
}
