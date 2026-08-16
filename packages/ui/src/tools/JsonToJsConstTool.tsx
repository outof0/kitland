import { TextTransformEditor } from "../components/TextTransformEditor";
import { useDeferredTextTransform } from "../hooks/useDeferredTextTransform";
import { jsonToJsConst, JSON_TO_JS_CONST_MAX_INPUT_CHARS } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { ChevronDown, Code } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const SAMPLE = `{
  "apiEndpoint": "kitland.test/v1",
  "timeoutMs": 5000,
  "retry": true
}`;

export type JsonToJsConstToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export function JsonToJsConstTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: JsonToJsConstToolProps = {}) {
  const [source, setSource] = useState(initialInput ?? "");
  const [declType, setDeclType] = useState<"const" | "let">("const");
  const [indent, setIndent] = useState<2 | 4 | "tab">(2);

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

  const transform = useMemo(
    () => (value: string) => {
      const res = jsonToJsConst(value, "value", indent);
      if (!res.ok) return res;
      if (declType === "let") {
        return { ok: true as const, value: res.value.replace(/^const /, "let ") };
      }
      return res;
    },
    [declType, indent],
  );

  const state = useDeferredTextTransform(source, `${declType}:${indent}`, transform);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={Code}
      title="JSON → JS / const"
      description="Convert JSON to a JS constant"
      inputLabel="JSON"
      outputLabel="JavaScript"
      placeholder="Paste JSON here…"
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={JSON_TO_JS_CONST_MAX_INPUT_CHARS}
      state={state}
      langTag="JAVASCRIPT"
      inputLanguage="json"
      outputLanguage="javascript"
      indentSize={indent}
      actionLabel="Convert"
      outputExtension="js"
      outputMimeType="text/javascript"
      indentLabel={indent === "tab" ? "tab indent" : `${indent} spaces indent`}
      validLabel="JSON"
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-[32px] flex items-center gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
                declType === "const" ? "text-primary" : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => setDeclType("const")}
            >
              const
            </button>
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
                declType === "let" ? "text-primary" : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => setDeclType("let")}
            >
              let
            </button>
          </div>

          <label className="h-[32px] relative flex items-center gap-1.5 px-3 bg-surface-low border border-outline rounded-[8px] text-[12px] text-on-surface cursor-pointer hover:border-outline-strong transition-colors">
            <span className="font-semibold text-on-surface">
              {indent === "tab" ? "Tab" : `${indent} spaces`}
            </span>
            <ChevronDown className="size-3 text-on-faint" />
            <select
              value={indent}
              onChange={(event) => {
                const val = event.target.value;
                setIndent(val === "tab" ? "tab" : (Number(val) as 2 | 4));
              }}
              aria-label="Indent size"
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value="tab">Tab</option>
            </select>
          </label>
        </div>
      }
    />
  );
}
