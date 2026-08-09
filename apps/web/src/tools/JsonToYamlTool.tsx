import { TextTransformEditor } from "@/components/tools/TextTransformEditor";
import { useJsonToYaml } from "@/hooks/useJsonToYaml";
import { JSON_TO_YAML_MAX_INPUT_CHARS } from "@kitland/core";
import { ArrowDownUp } from "lucide-react";
import { useState } from "react";

const SAMPLE = '{"name":"Widget","price":19.99,"inStock":true,"tags":["new","local"]}';

/** JSON to safe YAML renderer. */
export function JsonToYamlTool() {
  const [source, setSource] = useState(SAMPLE);
  const [indent, setIndent] = useState<2 | 4>(2);
  const state = useJsonToYaml(source, indent);

  return (
    <TextTransformEditor
      icon={ArrowDownUp}
      title="JSON → YAML"
      description="Convert JSON data to deterministic, human-readable YAML locally."
      inputLabel="JSON input"
      outputLabel="YAML output"
      placeholder='Paste JSON, for example {"name": "Widget"}'
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={JSON_TO_YAML_MAX_INPUT_CHARS}
      state={state}
      options={<IndentControl indent={indent} onChange={setIndent} />}
    />
  );
}

function IndentControl({ indent, onChange }: { indent: 2 | 4; onChange: (indent: 2 | 4) => void }) {
  return (
    <label className="tool-options__format">
      Indent
      <select
        value={indent}
        onChange={(event) => onChange(Number(event.target.value) as 2 | 4)}
        aria-label="YAML indent size"
      >
        <option value={2}>2 spaces</option>
        <option value={4}>4 spaces</option>
      </select>
    </label>
  );
}
