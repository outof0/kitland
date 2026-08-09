import { TextTransformEditor } from "@/components/tools/TextTransformEditor";
import { useJsonToCsv } from "@/hooks/useJsonToCsv";
import { JSON_TO_CSV_MAX_INPUT_CHARS } from "@kitland/core";
import { Table } from "lucide-react";
import { useState } from "react";

const SAMPLE =
  '[{"name":"Widget","price":19.99,"inStock":true},{"name":"Gadget","price":9.5,"inStock":false}]';

export function JsonToCsvTool() {
  const [source, setSource] = useState(SAMPLE);
  const [escapeFormulae, setEscapeFormulae] = useState(true);
  const state = useJsonToCsv(source, escapeFormulae);

  return (
    <TextTransformEditor
      icon={Table}
      title="JSON → CSV"
      description="Convert JSON records to RFC 4180 CSV locally, with spreadsheet formula protection."
      inputLabel="JSON records"
      outputLabel="CSV output"
      placeholder='Paste an array of objects, for example [{"name": "Widget"}]'
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={JSON_TO_CSV_MAX_INPUT_CHARS}
      state={state}
      options={
        <label className="tool-options__format">
          <input
            type="checkbox"
            checked={escapeFormulae}
            onChange={(event) => setEscapeFormulae(event.target.checked)}
          />
          Escape spreadsheet formulas
        </label>
      }
    />
  );
}
