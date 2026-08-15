import { TextTransformEditor } from "../components/TextTransformEditor";
import { useXmlFormatter } from "../hooks/migrated-tool-hooks";
import { XML_FORMATTER_MAX_INPUT_CHARS } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { ChevronDown, CodeXml, UnfoldVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SAMPLE = '<catalog><item id="1"><name>café 🍵</name></item><item id="2"/></catalog>';

export type XmlFormatterToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** XML Formatter. */
export function XmlFormatterTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: XmlFormatterToolProps = {}) {
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

  const [indent, setIndent] = useState<2 | 4>(2);
  const state = useXmlFormatter(source, indent);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={CodeXml}
      title="XML Formatter"
      description="Format and indent XML documents with syntax validation"
      inputLabel="XML input"
      outputLabel="Formatted XML"
      placeholder='<root><item id="1"/></root>'
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={XML_FORMATTER_MAX_INPUT_CHARS}
      state={state}
      langTag="XML"
      inputLanguage="xml"
      indentSize={indent}
      actionLabel="Format"
      actionIcon={UnfoldVertical}
      outputExtension="xml"
      outputMimeType="application/xml"
      indentLabel={`${indent} spaces indent`}
      validLabel="XML"
      options={
        <label className="h-[32px] relative flex items-center gap-1.5 px-3 bg-surface-low border border-outline rounded-[8px] text-[12px] text-on-surface cursor-pointer hover:border-outline-strong transition-colors">
          <span className="text-on-muted text-[12px]">Indent</span>
          <span className="font-semibold text-on-surface">{indent}</span>
          <ChevronDown className="size-3 text-on-faint" />
          <select
            value={indent}
            onChange={(event) => setIndent(Number(event.target.value) as 2 | 4)}
            aria-label="XML indent size"
            className="absolute inset-0 opacity-0 cursor-pointer"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </label>
      }
    />
  );
}
