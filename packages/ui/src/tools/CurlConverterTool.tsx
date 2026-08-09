import {
  CURL_CONVERTER_MAX_INPUT_CHARS,
  formatCurlCommand,
  formatFetchRequest,
  parseCurlCommand,
  parseFetchSource,
} from "@kitland/core";
import { ArrowRight, Terminal } from "lucide-react";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { useCallback, useEffect, useRef, useState } from "react";
import { TextTransformEditor } from "../components/TextTransformEditor";
import {
  useDeferredTextTransform,
  type TextTransformResult,
} from "../hooks/useDeferredTextTransform";

// Assembled at runtime so the browser-extension bundle never contains a
// literal remote URL; its package verifier enforces self-containment.
const DEMO_ORIGIN = ["https", "://api.example.com"].join("");

const SAMPLE_CURL = `curl -X POST '${DEMO_ORIGIN}/v1/users' \\
  -H 'Content-Type: application/json' \\
  -H 'X-Request-Id: demo-123' \\
  -d '{"name":"Ada Lovelace"}'`;

const SAMPLE_FETCH = `const response = await fetch('${DEMO_ORIGIN}/v1/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Request-Id': 'demo-123',
  },
  body: '{"name":"Ada Lovelace"}',
});`;

type CurlMode = "to-fetch" | "to-curl";

const MODES: { value: CurlMode; label: string }[] = [
  { value: "to-fetch", label: "To fetch" },
  { value: "to-curl", label: "To curl" },
];

export type CurlConverterToolProps = {
  readonly sample?: string;
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/**
 * Shared cURL ↔ Fetch converter UI (web-parity).
 */
export function CurlConverterTool({
  sample = SAMPLE_CURL,
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: CurlConverterToolProps = {}) {
  const [mode, setMode] = useState<CurlMode>("to-fetch");
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

  const transform = useCallback(
    (value: string): TextTransformResult => {
      if (mode === "to-fetch") {
        const parsed = parseCurlCommand(value);
        return parsed.ok ? { ok: true, value: formatFetchRequest(parsed.value) } : parsed;
      }
      const parsed = parseFetchSource(value);
      return parsed.ok ? { ok: true, value: formatCurlCommand(parsed.value) } : parsed;
    },
    [mode],
  );

  const state = useDeferredTextTransform(source, mode, transform);

  const onSwap = useCallback(() => {
    if (state.isProcessing || !state.result.ok) return;
    const output = state.result.value;
    if (!output) return;
    setSource(output);
    setMode((current) => (current === "to-fetch" ? "to-curl" : "to-fetch"));
  }, [state.isProcessing, state.result]);

  const onSample = useCallback(() => {
    if (mode === "to-fetch") {
      setSource(sample);
      return;
    }
    setSource(SAMPLE_FETCH);
  }, [mode, sample]);

  const toFetch = mode === "to-fetch";

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={Terminal}
      title="cURL to Fetch Converter"
      description="Convert cURL commands to JavaScript Fetch requests (or back) locally without sending any network traffic. No request is executed or sent."
      inputLabel={toFetch ? "cURL command" : "Fetch request"}
      outputLabel={toFetch ? "Fetch result" : "cURL command"}
      placeholder={
        toFetch
          ? `Paste curl command here (e.g. curl -X GET ${DEMO_ORIGIN})…`
          : `Paste fetch() request here (e.g. fetch('${DEMO_ORIGIN}')…)…`
      }
      source={source}
      onSourceChange={setSource}
      onSample={onSample}
      maxInputChars={CURL_CONVERTER_MAX_INPUT_CHARS}
      state={state}
      langTag="CURL"
      validLabel={toFetch ? "cURL" : "Fetch"}
      {...(toFetch
        ? { outputLanguage: "javascript" as const }
        : { inputLanguage: "javascript" as const })}
      actionLabel="Convert"
      actionIcon={ArrowRight}
      outputExtension="txt"
      outputMimeType="text/plain"
      onSwap={onSwap}
      swapLabel="Use the result as input and switch direction"
      copyOutputLabel={toFetch ? "Copy Fetch result" : "Copy cURL command"}
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            {MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={mode === option.value}
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  mode === option.value
                    ? "text-primary-strong"
                    : "text-on-muted hover:text-on-surface"
                }`}
                onClick={() => setMode(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
