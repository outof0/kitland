import { TextTransformEditor } from "../components/TextTransformEditor";
import { useSqlFormatter } from "../hooks/migrated-tool-hooks";
import { SQL_FORMATTER_MAX_INPUT_CHARS } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { ChevronDown, Database, UnfoldVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SAMPLE = "select id, name from users where active = true and role = 'admin' order by name;";

export type SqlFormatterToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** SQL Formatter. */
export function SqlFormatterTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: SqlFormatterToolProps = {}) {
  const [source, setSource] = useState(initialInput ?? "");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [keywordCase, setKeywordCase] = useState<"upper" | "lower">("upper");

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

  const state = useSqlFormatter(source, indent, keywordCase);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={Database}
      title="SQL Formatter"
      description="Format and beautify SQL queries with custom dialect syntax"
      inputLabel="SQL query"
      outputLabel="Formatted SQL"
      placeholder="Paste a SQL query, for example SELECT * FROM users"
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={SQL_FORMATTER_MAX_INPUT_CHARS}
      state={state}
      langTag="SQL"
      inputLanguage="sql"
      indentSize={indent}
      actionLabel="Format"
      actionIcon={UnfoldVertical}
      outputExtension="sql"
      outputMimeType="application/sql"
      indentLabel={`${indent} spaces indent`}
      validLabel="SQL"
      options={
        <div className="flex items-center gap-2 flex-wrap">
          <label className="h-[32px] relative flex items-center gap-1.5 px-3 bg-surface-low border border-outline rounded-[8px] text-[12px] text-on-surface cursor-pointer hover:border-outline-strong transition-colors">
            <span className="text-on-muted text-[12px]">Indent</span>
            <span className="font-semibold text-on-surface">{indent}</span>
            <ChevronDown className="size-3 text-on-faint" />
            <select
              value={indent}
              onChange={(event) => setIndent(Number(event.target.value) as 2 | 4)}
              aria-label="SQL indent size"
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </label>
          <label className="h-[32px] relative flex items-center gap-1.5 px-3 bg-surface-low border border-outline rounded-[8px] text-[12px] text-on-surface cursor-pointer hover:border-outline-strong transition-colors">
            <span className="text-on-muted text-[12px]">Keywords</span>
            <span className="font-semibold text-on-surface">
              {keywordCase === "upper" ? "Uppercase" : "Lowercase"}
            </span>
            <ChevronDown className="size-3 text-on-faint" />
            <select
              value={keywordCase}
              onChange={(event) => setKeywordCase(event.target.value as "upper" | "lower")}
              aria-label="SQL keyword case"
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="upper">Uppercase</option>
              <option value="lower">Lowercase</option>
            </select>
          </label>
        </div>
      }
    />
  );
}
