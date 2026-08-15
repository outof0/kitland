import { TextTransformEditor } from "../components/TextTransformEditor";
import { useDeferredTextTransform } from "../hooks/useDeferredTextTransform";
import { splitToNewlines, SPLIT_TO_NEWLINES_MAX_INPUT_CHARS } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { Split } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const SAMPLE = "a, b, c";

export type SplitToNewlinesToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export function SplitToNewlinesTool({
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: SplitToNewlinesToolProps = {}) {
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

  const transform = useMemo(() => (value: string) => splitToNewlines(value), []);
  const state = useDeferredTextTransform(source, "default", transform);

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={Split}
      title="Split → Newlines"
      description="Split delimited text into one value per line."
      inputLabel="Delimited text"
      outputLabel="Lines"
      placeholder="Paste input…"
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(SAMPLE)}
      maxInputChars={SPLIT_TO_NEWLINES_MAX_INPUT_CHARS}
      state={state}
    />
  );
}
