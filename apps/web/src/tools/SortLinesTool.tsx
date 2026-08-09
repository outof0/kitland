import { Button } from "@/components/ui/button";
import { useSortLines } from "@/hooks/useSortLines";
import { TextTransformWorkspace } from "@/tools/text-transform/TextTransformWorkspace";
import { SORT_LINES_MAX_INPUT_CHARS, type SortLinesOptions } from "@kitland/core";
import { ArrowDownAZ } from "lucide-react";
import { useState } from "react";

const SAMPLE = "banana\napple\ncherry";

export function SortLinesTool() {
  const [input, setInput] = useState(SAMPLE);
  const [options, setOptions] = useState<Required<SortLinesOptions>>({
    direction: "ascending",
    caseSensitive: false,
    numeric: false,
  });
  const result = useSortLines(input, options);

  return (
    <TextTransformWorkspace
      title="Sort Lines"
      subtitle="Sort text lines locally with stable ordering."
      icon={ArrowDownAZ}
      sample={SAMPLE}
      input={input}
      setInput={setInput}
      result={result}
      maxInputChars={SORT_LINES_MAX_INPUT_CHARS}
      inputLabel="Lines"
      outputLabel="Sorted"
      languageLabel="SORT"
      options={
        <>
          <fieldset className="tool-mode">
            <legend className="sr-only">Sort direction</legend>
            {(["ascending", "descending"] as const).map((direction) => (
              <Button
                key={direction}
                type="button"
                variant="ghost"
                size="sm"
                className={
                  options.direction === direction
                    ? "tool-mode__seg tool-mode__seg--active"
                    : "tool-mode__seg"
                }
                aria-pressed={options.direction === direction}
                onClick={() => setOptions((current) => ({ ...current, direction }))}
              >
                {direction === "ascending" ? "A → Z" : "Z → A"}
              </Button>
            ))}
          </fieldset>
          <fieldset className="tool-format">
            <legend className="sr-only">Sort comparison options</legend>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={
                options.caseSensitive
                  ? "tool-format__seg tool-format__seg--active"
                  : "tool-format__seg"
              }
              aria-pressed={options.caseSensitive}
              onClick={() =>
                setOptions((current) => ({ ...current, caseSensitive: !current.caseSensitive }))
              }
            >
              Case sensitive
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={
                options.numeric ? "tool-format__seg tool-format__seg--active" : "tool-format__seg"
              }
              aria-pressed={options.numeric}
              onClick={() => setOptions((current) => ({ ...current, numeric: !current.numeric }))}
            >
              Numeric
            </Button>
          </fieldset>
        </>
      }
    />
  );
}
