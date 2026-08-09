import { TextTransformEditor } from "../components/TextTransformEditor";
import { useDedupeLines } from "../hooks/migrated-tool-hooks";
import { DEDUPE_LINES_MAX_INPUT_CHARS, type DedupeLinesOptions } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { Rows3 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const SAMPLE = "red\ngreen\nred\nblue\ngreen";

export type DedupeLinesToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export function DedupeLinesTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: DedupeLinesToolProps = {}) {
  const [source, setSource] = useState(initialInput ?? "");

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

  const [options, setOptions] = useState<Required<DedupeLinesOptions>>({
    mode: "exact",
    caseSensitive: true,
  });
  const state = useDedupeLines(source, options);

  const onSample = useCallback(() => {
    setSource(SAMPLE);
  }, []);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={Rows3}
      title="Dedupe Lines"
      description="Remove repeated lines while keeping the first occurrence."
      inputLabel="Lines"
      outputLabel="Unique"
      placeholder="Paste lines to dedupe…"
      source={source}
      onSourceChange={setSource}
      onSample={onSample}
      maxInputChars={DEDUPE_LINES_MAX_INPUT_CHARS}
      state={state}
      langTag="UNIQUE"
      actionLabel="Dedupe"
      outputExtension="txt"
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            {(["exact", "trim"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  options.mode === mode
                    ? "text-primary-strong"
                    : "text-on-muted hover:text-on-surface"
                }`}
                aria-pressed={options.mode === mode}
                onClick={() => setOptions((current) => ({ ...current, mode }))}
              >
                {mode === "exact" ? "Exact" : "Trim whitespace"}
              </button>
            ))}
          </div>
          <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                options.caseSensitive
                  ? "text-primary-strong"
                  : "text-on-muted hover:text-on-surface"
              }`}
              aria-pressed={options.caseSensitive}
              onClick={() =>
                setOptions((current) => ({ ...current, caseSensitive: !current.caseSensitive }))
              }
            >
              Case sensitive
            </button>
          </div>
        </div>
      }
    />
  );
}
