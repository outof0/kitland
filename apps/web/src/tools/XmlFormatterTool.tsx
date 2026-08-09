import { TextTransformEditor } from "@/components/tools/TextTransformEditor";
import { useXmlFormatter } from "@/hooks/useXmlFormatter";
import { XML_FORMATTER_MAX_INPUT_CHARS } from "@kitland/core";
import { CodeXml } from "lucide-react";
import { useState } from "react";

const SAMPLE = '<catalog><item id="1"><name>café 🍵</name></item><item id="2"/></catalog>';

export function XmlFormatterTool() {
  const [source, setSource] = useState(SAMPLE);
  const [indent, setIndent] = useState<2 | 4>(2);
  const state = useXmlFormatter(source, indent);

  return (
    <TextTransformEditor
      icon={CodeXml}
      title="XML Formatter"
      description="Validate and format XML locally; external entities and DOCTYPE are never resolved."
      inputLabel="XML input"
      outputLabel="Formatted XML"
      placeholder='<root><item id="1"/></root>'
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={XML_FORMATTER_MAX_INPUT_CHARS}
      state={state}
      options={
        <label className="tool-options__format">
          Indent
          <select
            value={indent}
            onChange={(event) => setIndent(Number(event.target.value) as 2 | 4)}
            aria-label="XML indent size"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </label>
      }
    />
  );
}
