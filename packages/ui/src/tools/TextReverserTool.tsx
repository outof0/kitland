import { TextTransformEditor } from "../components/TextTransformEditor";
import { useTextReverser } from "../hooks/migrated-tool-hooks";
import {
  TEXT_REVERSER_MAX_INPUT_CHARS,
  type TextReverseCase,
  type TextReverseMode,
} from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { FlipHorizontal2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SAMPLE = "The quick brown fox jumps over the lazy dog";
const MODES: readonly { value: TextReverseMode; label: string }[] = [
  { value: "characters", label: "Characters" },
  { value: "word-order", label: "Word order" },
  { value: "word-characters", label: "Each word" },
  { value: "line-order", label: "Line order" },
];
const CASES: readonly { value: TextReverseCase; label: string }[] = [
  { value: "keep", label: "Keep case" },
  { value: "upper", label: "UPPER" },
  { value: "lower", label: "lower" },
];

export type TextReverserToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export function TextReverserTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: TextReverserToolProps = {}) {
  const [source, setSource] = useState(initialInput ?? "");
  const [mode, setMode] = useState<TextReverseMode>("characters");
  const [textCase, setTextCase] = useState<TextReverseCase>("keep");

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

  const options = useMemo(() => ({ mode, case: textCase }), [mode, textCase]);
  const state = useTextReverser(source, options);

  const onSample = useCallback(() => {
    setSource(SAMPLE);
  }, []);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={FlipHorizontal2}
      title="Text Reverser"
      description="Reverse text by characters, words, or lines without splitting Unicode emoji."
      inputLabel="Text"
      outputLabel="Reversed"
      placeholder="Paste text to reverse…"
      source={source}
      onSourceChange={setSource}
      onSample={onSample}
      maxInputChars={TEXT_REVERSER_MAX_INPUT_CHARS}
      state={state}
      langTag="REV"
      actionLabel="Reverse"
      outputExtension="txt"
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <div
            role="group"
            aria-label="Reverse mode"
            className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]"
          >
            {MODES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  mode === value ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
                }`}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label="Output case"
            className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]"
          >
            {CASES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  textCase === value ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
                }`}
                aria-pressed={textCase === value}
                onClick={() => setTextCase(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
