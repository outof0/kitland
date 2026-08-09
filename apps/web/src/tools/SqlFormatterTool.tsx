import { TextTransformEditor } from "@/components/tools/TextTransformEditor";
import { useSqlFormatter } from "@/hooks/useSqlFormatter";
import { SQL_FORMATTER_MAX_INPUT_CHARS } from "@kitland/core";
import { Braces } from "lucide-react";
import { useState } from "react";

const SAMPLE = "select id, name from users where active = true and role = 'admin' order by name;";

export function SqlFormatterTool() {
  const [source, setSource] = useState(SAMPLE);
  const [indent, setIndent] = useState<2 | 4>(2);
  const [keywordCase, setKeywordCase] = useState<"upper" | "lower">("upper");
  const state = useSqlFormatter(source, indent, keywordCase);

  return (
    <TextTransformEditor
      icon={Braces}
      title="SQL Formatter"
      description="Format SQL queries locally for readable review without sending them anywhere."
      inputLabel="SQL query"
      outputLabel="Formatted SQL"
      placeholder="Paste a SQL query, for example SELECT * FROM users"
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={SQL_FORMATTER_MAX_INPUT_CHARS}
      state={state}
      options={
        <>
          <label className="tool-options__format">
            Indent
            <select
              value={indent}
              onChange={(event) => setIndent(Number(event.target.value) as 2 | 4)}
              aria-label="SQL indent size"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </label>
          <label className="tool-options__format">
            Keywords
            <select
              value={keywordCase}
              onChange={(event) => setKeywordCase(event.target.value as "upper" | "lower")}
              aria-label="SQL keyword case"
            >
              <option value="upper">Uppercase</option>
              <option value="lower">Lowercase</option>
            </select>
          </label>
        </>
      }
    />
  );
}
