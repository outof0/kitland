import { err, ok, type ToolResult } from "../result";
import { parseYaml, YAML_CODEC_MAX_INPUT_CHARS, YAML_CODEC_MAX_OUTPUT_CHARS } from "./yaml-codec";

export {
  YAML_CODEC_MAX_INPUT_CHARS as YAML_TO_JSON_MAX_INPUT_CHARS,
  YAML_CODEC_MAX_OUTPUT_CHARS as YAML_TO_JSON_MAX_OUTPUT_CHARS,
};

/** Convert a safe YAML subset document to readable JSON. */
export function yamlToJson(source: string, indent: 2 | 4 = 2): ToolResult<string> {
  const parsed = parseYaml(source);
  if (!parsed.ok) return parsed;
  const output = JSON.stringify(parsed.value, null, indent);
  if (output.length > YAML_CODEC_MAX_OUTPUT_CHARS) {
    return err(
      "OUTPUT_TOO_LARGE",
      `JSON output exceeds the ${YAML_CODEC_MAX_OUTPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  return ok(output);
}
