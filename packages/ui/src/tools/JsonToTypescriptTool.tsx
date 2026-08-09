import { TextTransformEditor } from "../components/TextTransformEditor";
import { useDeferredTextTransform } from "../hooks/useDeferredTextTransform";
import { jsonToTypescript, JSON_TO_TYPESCRIPT_MAX_INPUT_CHARS } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { ArrowRight, ChevronDown, FileCode } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const SAMPLE = `{
  "id": 1,
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "active": true,
  "roles": ["admin", "editor"]
}`;

export type JsonToTypescriptToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export function JsonToTypescriptTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: JsonToTypescriptToolProps = {}) {
  const [source, setSource] = useState(initialInput ?? "");
  const [indent, setIndent] = useState<2 | 4>(2);

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
    () => (value: string) => jsonToTypescript(value, "Root", indent),
    [indent],
  );
  const state = useDeferredTextTransform(source, `indent:${indent}`, transform);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={FileCode}
      title="JSON → TypeScript"
      description="Generate TS interfaces from JSON"
      inputLabel="JSON"
      outputLabel="TypeScript interfaces"
      placeholder="Paste JSON here…"
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={JSON_TO_TYPESCRIPT_MAX_INPUT_CHARS}
      state={state}
      langTag="TYPESCRIPT"
      inputLanguage="json"
      outputLanguage="typescript"
      indentSize={indent}
      actionLabel="Generate"
      actionIcon={ArrowRight}
      outputExtension="ts"
      outputMimeType="text/typescript"
      indentLabel={`${indent} spaces indent`}
      validLabel="JSON"
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <label className="h-[32px] relative flex items-center gap-1.5 px-3 bg-surface-low border border-outline rounded-[8px] text-[12px] text-on-surface cursor-pointer hover:border-outline-strong transition-colors">
            <span className="font-semibold text-on-surface">{indent}</span>
            <ChevronDown className="size-3 text-on-faint" />
            <select
              value={indent}
              onChange={(event) => setIndent(Number(event.target.value) as 2 | 4)}
              aria-label="Indent size"
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </label>
        </div>
      }
    />
  );
}
