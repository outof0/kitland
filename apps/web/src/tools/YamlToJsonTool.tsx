import { TextTransformEditor } from "@/components/tools/TextTransformEditor";
import { useYamlToJson } from "@/hooks/useYamlToJson";
import { YAML_CODEC_MAX_INPUT_CHARS } from "@kitland/core";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

const SAMPLE = 'name: "Widget"\nprice: 19.99\ninStock: true\ntags:\n  - "new"\n  - "local"\n';

/** YAML subset to readable JSON renderer. */
export function YamlToJsonTool() {
  const [source, setSource] = useState(SAMPLE);
  const [indent, setIndent] = useState<2 | 4>(2);
  const state = useYamlToJson(source, indent);

  return (
    <TextTransformEditor
      icon={ArrowUpDown}
      title="YAML → JSON"
      description="Convert a safe YAML document to readable JSON without uploading it."
      inputLabel="YAML input"
      outputLabel="JSON output"
      placeholder={'Paste YAML, for example\nname: "Widget"'}
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={YAML_CODEC_MAX_INPUT_CHARS}
      state={state}
      options={
        <label className="tool-options__format">
          Indent
          <select
            value={indent}
            onChange={(event) => setIndent(Number(event.target.value) as 2 | 4)}
            aria-label="JSON indent size"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </label>
      }
    />
  );
}
