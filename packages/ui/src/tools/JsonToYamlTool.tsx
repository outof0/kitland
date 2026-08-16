import { TextTransformEditor } from "../components/TextTransformEditor";
import { useJsonToYaml } from "../hooks/migrated-tool-hooks";
import { useYamlToJson } from "../hooks/migrated-tool-hooks";
import { JSON_TO_YAML_MAX_INPUT_CHARS, YAML_TO_JSON_MAX_INPUT_CHARS } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { ArrowRight, ChevronDown, Repeat2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const JSON_SAMPLE = `{
  "name": "Widget",
  "price": 19.99,
  "inStock": true,
  "tags": [
    "new",
    "local"
  ]
}`;

const YAML_SAMPLE = `name: Widget
price: 19.99
inStock: true
tags:
  - new
  - local`;

export type JsonToYamlToolProps = {
  readonly initialMode?: "json-to-yaml" | "yaml-to-json" | undefined;
  readonly onModeNavigate?: ((slug: "json-to-yaml" | "yaml-to-json") => void) | undefined;
  readonly initialInput?: string | undefined;
  readonly capabilities?: ToolCapabilities | undefined;
};

/** JSON <-> YAML bidirectional tool. */
export function JsonToYamlTool({
  initialMode = "json-to-yaml",
  onModeNavigate,
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: JsonToYamlToolProps = {}) {
  const [mode, setMode] = useState<"json-to-yaml" | "yaml-to-json">(initialMode);
  const [source, setSource] = useState(initialInput ?? "");
  const [yamlIndent, setYamlIndent] = useState<2 | 4>(2);
  const [jsonIndent, setJsonIndent] = useState<2 | 4 | "tab">(2);

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

  const jsonToYamlState = useJsonToYaml(source, yamlIndent);
  const yamlToJsonState = useYamlToJson(source, jsonIndent);
  const state = mode === "json-to-yaml" ? jsonToYamlState : yamlToJsonState;

  const isJsonToYaml = mode === "json-to-yaml";
  const indent = isJsonToYaml ? yamlIndent : jsonIndent;

  const onSwap = useCallback(() => {
    const output = state.result.ok ? state.result.value : "";
    setSource(output);
    const nextMode = isJsonToYaml ? "yaml-to-json" : "json-to-yaml";
    setMode(nextMode);
    onModeNavigate?.(nextMode);
  }, [isJsonToYaml, onModeNavigate, state.result]);

  const switchMode = useCallback(
    (nextMode: "json-to-yaml" | "yaml-to-json") => {
      if (nextMode === mode) return;
      const output = state.result.ok ? state.result.value : "";
      if (output) {
        setSource(output);
      }
      setMode(nextMode);
      onModeNavigate?.(nextMode);
    },
    [mode, onModeNavigate, state.result],
  );

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={Repeat2}
      title={isJsonToYaml ? "JSON → YAML" : "YAML → JSON"}
      description={
        isJsonToYaml
          ? "Convert JSON data to human-readable YAML"
          : "Parse YAML documents and convert to readable JSON"
      }
      inputLabel={isJsonToYaml ? "JSON input" : "YAML input"}
      outputLabel={isJsonToYaml ? "YAML output" : "JSON output"}
      placeholder={
        isJsonToYaml
          ? 'Paste JSON, for example {"name": "Widget"}'
          : "Paste YAML, for example name: Widget"
      }
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(isJsonToYaml ? JSON_SAMPLE : YAML_SAMPLE)}
      maxInputChars={isJsonToYaml ? JSON_TO_YAML_MAX_INPUT_CHARS : YAML_TO_JSON_MAX_INPUT_CHARS}
      state={state}
      langTag={isJsonToYaml ? "YAML" : "JSON"}
      inputLanguage={isJsonToYaml ? "json" : "yaml"}
      indentSize={indent}
      actionLabel="Convert"
      actionIcon={ArrowRight}
      outputExtension={isJsonToYaml ? "yaml" : "json"}
      outputMimeType={isJsonToYaml ? "application/yaml" : "application/json"}
      onSwap={onSwap}
      swapLabel="Swap"
      indentLabel={
        indent === "tab"
          ? "tab indent"
          : isJsonToYaml
            ? `${indent} spaces indent`
            : `${indent} spaces`
      }
      validLabel={isJsonToYaml ? "JSON" : "YAML"}
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-[32px] flex items-center gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            <button
              type="button"
              onClick={() => switchMode("json-to-yaml")}
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors flex items-center cursor-pointer ${
                isJsonToYaml ? "text-primary" : "text-on-faint hover:text-on-surface"
              }`}
            >
              JSON → YAML
            </button>
            <button
              type="button"
              onClick={() => switchMode("yaml-to-json")}
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors flex items-center cursor-pointer ${
                !isJsonToYaml ? "text-primary" : "text-on-faint hover:text-on-surface"
              }`}
            >
              YAML → JSON
            </button>
          </div>

          <label className="h-[32px] relative flex items-center gap-1.5 px-3 bg-surface-low border border-outline rounded-[8px] text-[12px] text-on-surface cursor-pointer hover:border-outline-strong transition-colors">
            <span className="font-normal text-on-surface">
              {indent === "tab" ? "Tab" : `${indent} spaces`}
            </span>
            <ChevronDown className="size-3 text-on-faint" />
            <select
              value={indent}
              onChange={(event) => {
                const val = event.target.value;
                if (isJsonToYaml) {
                  setYamlIndent(Number(val) as 2 | 4);
                  return;
                }
                setJsonIndent(val === "tab" ? "tab" : (Number(val) as 2 | 4));
              }}
              aria-label="YAML indent size"
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              {!isJsonToYaml && <option value="tab">Tab</option>}
            </select>
          </label>
        </div>
      }
    />
  );
}
