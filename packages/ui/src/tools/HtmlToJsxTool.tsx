import { TextTransformEditor } from "../components/TextTransformEditor";
import { useDeferredTextTransform } from "../hooks/useDeferredTextTransform";
import { htmlToJsx, HTML_TO_JSX_MAX_INPUT_CHARS } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { Code } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const SAMPLE = `<div class="container" tabindex="0">
  <label for="username">Username</label>
  <input type="text" id="username" readonly />
</div>`;

export type HtmlToJsxToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export function HtmlToJsxTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: HtmlToJsxToolProps = {}) {
  const [source, setSource] = useState(initialInput ?? "");
  const [componentMode, setComponentMode] = useState<"raw" | "component">("raw");

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
      const res = htmlToJsx(value);
      if (!res.ok) return res;
      if (componentMode === "component") {
        const indented = res.value
          .split("\n")
          .map((l: string) => `    ${l}`)
          .join("\n");
        return {
          ok: true as const,
          value: `export function Component() {\n  return (\n${indented}\n  );\n}`,
        };
      }
      return res;
    },
    [componentMode],
  );

  const state = useDeferredTextTransform(source, componentMode, transform);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={Code}
      title="HTML → JSX"
      description="Convert HTML to JSX; unsupported markup is flagged."
      inputLabel="HTML markup"
      outputLabel={componentMode === "raw" ? "JSX" : "React Component"}
      placeholder="Paste HTML markup here…"
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={HTML_TO_JSX_MAX_INPUT_CHARS}
      state={state}
      langTag="JSX"
      inputLanguage="html"
      actionLabel="Convert"
      outputExtension="jsx"
      outputMimeType="text/javascript"
      validLabel="HTML"
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-[32px] flex items-center gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
                componentMode === "raw"
                  ? "text-primary-strong"
                  : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => setComponentMode("raw")}
            >
              Raw JSX
            </button>
            <button
              type="button"
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
                componentMode === "component"
                  ? "text-primary-strong"
                  : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => setComponentMode("component")}
            >
              React Component
            </button>
          </div>
        </div>
      }
    />
  );
}
