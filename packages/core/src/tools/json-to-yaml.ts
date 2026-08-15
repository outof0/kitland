import { err, type ToolResult } from "../result";
import { stringifyYaml, YAML_CODEC_MAX_INPUT_CHARS, type YamlValue } from "./yaml-codec";

export { YAML_CODEC_MAX_INPUT_CHARS as JSON_TO_YAML_MAX_INPUT_CHARS };

/** Convert a JSON document to deterministic, safe YAML 1.2. */
export function jsonToYaml(source: string, indent: 2 | 4 = 2): ToolResult<string> {
  if (source.length > YAML_CODEC_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `JSON input exceeds the ${YAML_CODEC_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (source.trim().length === 0) return err("EMPTY_INPUT", "Enter a JSON document to convert.");
  try {
    const parsed = JSON.parse(source) as YamlValue;
    return stringifyYaml(parsed, indent);
  } catch (cause) {
    const detail = cause instanceof SyntaxError && cause.message ? ` ${cause.message}` : "";
    return err("INVALID_JSON", `JSON is invalid.${detail}`);
  }
}
