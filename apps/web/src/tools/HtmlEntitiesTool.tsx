import { HTML_ENTITIES_MAX_INPUT_CHARS } from "@kitland/core";
import { EncodingTransformWorkspace } from "./EncodingTransformWorkspace";

export function HtmlEntitiesTool() {
  return (
    <EncodingTransformWorkspace
      tool="html-entities"
      title="HTML Entities"
      subtitle="Encode or decode HTML characters locally, without uploading your text."
      sample={'<p title="tea & cake">🍵</p>'}
      inputLimit={HTML_ENTITIES_MAX_INPUT_CHARS}
      formatLabel="Encode as"
      defaultFormat="named"
      formatChoices={[
        {
          value: "named",
          label: "Named",
          title: "Escapes HTML-significant characters",
        },
        {
          value: "decimal",
          label: "Decimal",
          title: "Writes every character as a decimal entity",
        },
        {
          value: "hexadecimal",
          label: "Hex",
          title: "Writes every character as a hexadecimal entity",
        },
      ]}
      contractNote="Named mode escapes HTML-significant characters. Decode supports common named entities plus strict decimal and hexadecimal numeric entities."
    />
  );
}
