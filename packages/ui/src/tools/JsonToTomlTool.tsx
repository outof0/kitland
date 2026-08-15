import { TextTransformEditor } from "../components/TextTransformEditor";
import { useJsonToToml } from "../hooks/migrated-tool-hooks";
import { JSON_TO_TOML_MAX_INPUT_CHARS } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { FileJson2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SAMPLE = '{"name":"Kitland","enabled":true,"ports":[3000,5173],"build":{"target":"web"}}';

export type JsonToTomlToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** JSON to TOML renderer. */
export function JsonToTomlTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: JsonToTomlToolProps = {}) {
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

  const state = useJsonToToml(source);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={FileJson2}
      title="JSON → TOML"
      description="Convert JSON configuration files to TOML syntax"
      inputLabel="JSON object"
      outputLabel="TOML output"
      placeholder='Paste a JSON object, for example {"name": "Kitland"}'
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={JSON_TO_TOML_MAX_INPUT_CHARS}
      state={state}
      langTag="TOML"
      inputLanguage="json"
      outputExtension="toml"
      outputMimeType="application/toml"
    />
  );
}
