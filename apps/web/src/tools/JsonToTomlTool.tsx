import { TextTransformEditor } from "@/components/tools/TextTransformEditor";
import { useJsonToToml } from "@/hooks/useJsonToToml";
import { JSON_TO_TOML_MAX_INPUT_CHARS } from "@kitland/core";
import { FileJson2 } from "lucide-react";
import { useState } from "react";

const SAMPLE = '{"name":"Kitland","enabled":true,"ports":[3000,5173],"build":{"target":"web"}}';

export function JsonToTomlTool() {
  const [source, setSource] = useState(SAMPLE);
  const state = useJsonToToml(source);

  return (
    <TextTransformEditor
      icon={FileJson2}
      title="JSON → TOML"
      description="Convert a JSON object to TOML tables locally. Nulls and nested array values are rejected clearly."
      inputLabel="JSON object"
      outputLabel="TOML output"
      placeholder='Paste a JSON object, for example {"name": "Kitland"}'
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={JSON_TO_TOML_MAX_INPUT_CHARS}
      state={state}
    />
  );
}
