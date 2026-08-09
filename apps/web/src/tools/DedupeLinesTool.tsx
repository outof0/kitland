import { Button } from "@/components/ui/button";
import { useDedupeLines } from "@/hooks/useDedupeLines";
import { TextTransformWorkspace } from "@/tools/text-transform/TextTransformWorkspace";
import { DEDUPE_LINES_MAX_INPUT_CHARS, type DedupeLinesOptions } from "@kitland/core";
import { Rows3 } from "lucide-react";
import { useState } from "react";

const SAMPLE = "red\ngreen\nred\nblue\ngreen";

export function DedupeLinesTool() {
  const [input, setInput] = useState(SAMPLE);
  const [options, setOptions] = useState<Required<DedupeLinesOptions>>({
    mode: "exact",
    caseSensitive: true,
  });
  const result = useDedupeLines(input, options);

  return (
    <TextTransformWorkspace
      title="Dedupe Lines"
      subtitle="Remove repeated lines while keeping the first occurrence."
      icon={Rows3}
      sample={SAMPLE}
      input={input}
      setInput={setInput}
      result={result}
      maxInputChars={DEDUPE_LINES_MAX_INPUT_CHARS}
      inputLabel="Lines"
      outputLabel="Unique"
      languageLabel="UNIQUE"
      options={
        <>
          <fieldset className="tool-mode">
            <legend className="sr-only">Duplicate matching mode</legend>
            {(["exact", "trim"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                variant="ghost"
                size="sm"
                className={
                  options.mode === mode ? "tool-mode__seg tool-mode__seg--active" : "tool-mode__seg"
                }
                aria-pressed={options.mode === mode}
                onClick={() => setOptions((current) => ({ ...current, mode }))}
              >
                {mode === "exact" ? "Exact" : "Trim whitespace"}
              </Button>
            ))}
          </fieldset>
          <fieldset className="tool-format">
            <legend className="sr-only">Case matching option</legend>
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
          </fieldset>
        </>
      }
    />
  );
}
