import { Button } from "@/components/ui/button";
import { useTextReverser } from "@/hooks/useTextReverser";
import { TextTransformWorkspace } from "@/tools/text-transform/TextTransformWorkspace";
import {
  TEXT_REVERSER_MAX_INPUT_CHARS,
  type TextReverseCase,
  type TextReverseMode,
} from "@kitland/core";
import { FlipHorizontal2 } from "lucide-react";
import { useMemo, useState } from "react";

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

export function TextReverserTool() {
  const [input, setInput] = useState(SAMPLE);
  const [mode, setMode] = useState<TextReverseMode>("characters");
  const [textCase, setTextCase] = useState<TextReverseCase>("keep");
  const options = useMemo(() => ({ mode, case: textCase }), [mode, textCase]);
  const result = useTextReverser(input, options);

  return (
    <TextTransformWorkspace
      title="Text Reverser"
      subtitle="Reverse text by characters, words, or lines without splitting Unicode emoji."
      icon={FlipHorizontal2}
      sample={SAMPLE}
      input={input}
      setInput={setInput}
      result={result}
      maxInputChars={TEXT_REVERSER_MAX_INPUT_CHARS}
      inputLabel="Text"
      outputLabel="Reversed"
      languageLabel="REV"
      options={
        <>
          <fieldset className="tool-mode">
            <legend className="sr-only">Reverse mode</legend>
            {MODES.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                size="sm"
                className={
                  mode === value ? "tool-mode__seg tool-mode__seg--active" : "tool-mode__seg"
                }
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {label}
              </Button>
            ))}
          </fieldset>
          <fieldset className="tool-format">
            <legend className="sr-only">Output case</legend>
            {CASES.map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                size="sm"
                className={
                  textCase === value
                    ? "tool-format__seg tool-format__seg--active"
                    : "tool-format__seg"
                }
                aria-pressed={textCase === value}
                onClick={() => setTextCase(value)}
              >
                {label}
              </Button>
            ))}
          </fieldset>
        </>
      }
    />
  );
}
