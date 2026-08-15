import { TextTransformEditor } from "../components/TextTransformEditor";
import { useSortLines } from "../hooks/migrated-tool-hooks";
import { SORT_LINES_MAX_INPUT_CHARS, type SortLinesOptions } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { ArrowDownAZ } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const SAMPLE = "banana\napple\ncherry";

export type SortLinesToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export function SortLinesTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: SortLinesToolProps = {}) {
  const [source, setSource] = useState(initialInput ?? "");
  const [options, setOptions] = useState<Required<SortLinesOptions>>({
    direction: "ascending",
    caseSensitive: false,
    numeric: false,
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

  const state = useSortLines(source, options);

  const onSample = useCallback(() => {
    setSource(SAMPLE);
  }, []);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={ArrowDownAZ}
      title="Sort Lines"
      description="Sort text lines locally with stable ordering."
      inputLabel="Lines"
      outputLabel="Sorted"
      placeholder="Paste lines to sort…"
      source={source}
      onSourceChange={setSource}
      onSample={onSample}
      maxInputChars={SORT_LINES_MAX_INPUT_CHARS}
      state={state}
      langTag="SORT"
      actionLabel="Sort"
      outputExtension="txt"
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            {(["ascending", "descending"] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  options.direction === direction
                    ? "text-primary-strong"
                    : "text-on-muted hover:text-on-surface"
                }`}
                aria-pressed={options.direction === direction}
                onClick={() => setOptions((current) => ({ ...current, direction }))}
              >
                {direction === "ascending" ? "A → Z" : "Z → A"}
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
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                options.numeric ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
              }`}
              aria-pressed={options.numeric}
              onClick={() => setOptions((current) => ({ ...current, numeric: !current.numeric }))}
            >
              Numeric
            </button>
          </div>
        </div>
      }
    />
  );
}
