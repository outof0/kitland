import { TextTransformEditor } from "../components/TextTransformEditor";
import { useCaseConverter } from "../hooks/migrated-tool-hooks";
import { CASE_CONVERTER_MAX_INPUT_CHARS, type CaseFormat } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { CaseUpper } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const SAMPLE = "Hello World Example";
const FORMATS: readonly { value: CaseFormat; label: string }[] = [
  { value: "snake", label: "snake_case" },
  { value: "camel", label: "camelCase" },
  { value: "kebab", label: "kebab-case" },
  { value: "pascal", label: "PascalCase" },
];

export type CaseConverterToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export function CaseConverterTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: CaseConverterToolProps = {}) {
  const [source, setSource] = useState(initialInput ?? "");
  const [format, setFormat] = useState<CaseFormat>("snake");

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

  const state = useCaseConverter(source, format);

  const onSample = useCallback(() => {
    setSource(SAMPLE);
  }, []);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={CaseUpper}
      title="Case Converter"
      description="Convert text between common naming conventions."
      inputLabel="Text"
      outputLabel="Converted"
      placeholder="Paste text to convert…"
      source={source}
      onSourceChange={setSource}
      onSample={onSample}
      maxInputChars={CASE_CONVERTER_MAX_INPUT_CHARS}
      state={state}
      langTag="CASE"
      actionLabel="Convert"
      outputExtension="txt"
      options={
        <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
          {FORMATS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                format === value ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
              }`}
              aria-pressed={format === value}
              onClick={() => setFormat(value)}
            >
              {label}
            </button>
          ))}
        </div>
      }
    />
  );
}
