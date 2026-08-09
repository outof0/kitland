import { Button } from "@/components/ui/button";
import { useCaseConverter } from "@/hooks/useCaseConverter";
import { TextTransformWorkspace } from "@/tools/text-transform/TextTransformWorkspace";
import { CASE_CONVERTER_MAX_INPUT_CHARS, type CaseFormat } from "@kitland/core";
import { CaseUpper } from "lucide-react";
import { useState } from "react";

const SAMPLE = "Hello World Example";
const FORMATS: readonly { value: CaseFormat; label: string }[] = [
  { value: "snake", label: "snake_case" },
  { value: "camel", label: "camelCase" },
  { value: "kebab", label: "kebab-case" },
  { value: "pascal", label: "PascalCase" },
];

export function CaseConverterTool() {
  const [input, setInput] = useState(SAMPLE);
  const [format, setFormat] = useState<CaseFormat>("snake");
  const result = useCaseConverter(input, format);

  return (
    <TextTransformWorkspace
      title="Case Converter"
      subtitle="Convert text between common naming conventions."
      icon={CaseUpper}
      sample={SAMPLE}
      input={input}
      setInput={setInput}
      result={result}
      maxInputChars={CASE_CONVERTER_MAX_INPUT_CHARS}
      inputLabel="Text"
      outputLabel="Converted"
      languageLabel="CASE"
      options={
        <fieldset className="tool-mode">
          <legend className="sr-only">Output case format</legend>
          {FORMATS.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="sm"
              className={
                format === value ? "tool-mode__seg tool-mode__seg--active" : "tool-mode__seg"
              }
              aria-pressed={format === value}
              onClick={() => setFormat(value)}
            >
              {label}
            </Button>
          ))}
        </fieldset>
      }
    />
  );
}
