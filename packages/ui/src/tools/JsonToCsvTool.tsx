import { TextTransformEditor } from "../components/TextTransformEditor";
import { useJsonToCsv } from "../hooks/migrated-tool-hooks";
import { JSON_TO_CSV_MAX_INPUT_CHARS } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { Table } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SAMPLE =
  '[{"name":"Widget","price":19.99,"inStock":true},{"name":"Gadget","price":9.5,"inStock":false}]';

export type JsonToCsvToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** JSON to CSV renderer. */
export function JsonToCsvTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: JsonToCsvToolProps = {}) {
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

  const [escapeFormulae, setEscapeFormulae] = useState(true);
  const state = useJsonToCsv(source, escapeFormulae);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={Table}
      title="JSON → CSV"
      description="Convert JSON arrays to structured CSV spreadsheets"
      inputLabel="JSON records"
      outputLabel="CSV output"
      placeholder='Paste an array of objects, for example [{"name": "Widget"}]'
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={JSON_TO_CSV_MAX_INPUT_CHARS}
      state={state}
      langTag="CSV"
      inputLanguage="json"
      outputExtension="csv"
      outputMimeType="text/csv"
      options={
        <label className="h-[32px] flex items-center gap-2 px-2.5 bg-surface-low border border-outline rounded-[8px] text-[12px] font-medium text-on-surface cursor-pointer hover:border-outline-strong transition-colors">
          <input
            type="checkbox"
            checked={escapeFormulae}
            onChange={(event) => setEscapeFormulae(event.target.checked)}
            className="size-3.5 rounded border-outline accent-primary cursor-pointer"
          />
          <span>Escape spreadsheet formulas</span>
        </label>
      }
    />
  );
}
