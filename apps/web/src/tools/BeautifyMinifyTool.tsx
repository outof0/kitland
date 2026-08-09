import { TextTransformEditor } from "@/components/tools/TextTransformEditor";
import { useBeautifyMinify } from "@/hooks/useBeautifyMinify";
import { BEAUTIFY_MINIFY_MAX_INPUT_CHARS, type JsonFormatMode } from "@kitland/core";
import { Braces } from "lucide-react";
import { useState } from "react";

const SAMPLE = '{"name":"Kitland","features":["local","fast"],"enabled":true}';

/** JSON formatting and compaction renderer. */
export function BeautifyMinifyTool() {
  const [source, setSource] = useState(SAMPLE);
  const [mode, setMode] = useState<JsonFormatMode>("beautify");
  const [indent, setIndent] = useState<2 | 4>(2);
  const state = useBeautifyMinify(source, mode, indent);

  return (
    <TextTransformEditor
      icon={Braces}
      title="Beautify / Minify"
      description="Validate JSON, then format it for review or compact it for transport."
      inputLabel="JSON input"
      outputLabel={mode === "beautify" ? "Formatted JSON" : "Minified JSON"}
      placeholder='Paste JSON, for example {"enabled": true}'
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={BEAUTIFY_MINIFY_MAX_INPUT_CHARS}
      state={state}
      options={
        <>
          <fieldset className="tool-mode">
            <legend className="sr-only">JSON formatting mode</legend>
            {(["beautify", "minify"] as const).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                className={
                  mode === nextMode ? "tool-mode__seg tool-mode__seg--active" : "tool-mode__seg"
                }
                aria-pressed={mode === nextMode}
                onClick={() => setMode(nextMode)}
              >
                {nextMode === "beautify" ? "Beautify" : "Minify"}
              </button>
            ))}
          </fieldset>
          <label className="tool-options__format">
            Indent
            <select
              value={indent}
              onChange={(event) => setIndent(Number(event.target.value) as 2 | 4)}
              aria-label="Indent size"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </label>
        </>
      }
    />
  );
}
