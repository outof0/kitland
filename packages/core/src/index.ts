export { err, ok, type ToolError, type ToolResult } from "./result";
export {
  BASE64_MAX_ENCODED_CHARS,
  BASE64_MAX_INPUT_CHARS,
  BASE64_MAX_UTF8_BYTES,
  decodeBase64,
  encodeBase64,
  runBase64,
  type Base64Mode,
  type Base64Options,
} from "./tools/base64";
export {
  diffJson,
  JSON_DIFF_MAX_DEPTH,
  JSON_DIFF_MAX_ENTRIES,
  JSON_DIFF_MAX_INPUT_CHARS,
  JSON_DIFF_MAX_NODES,
  type JsonDiffEntry,
  type JsonDiffOperation,
  type JsonDiffResult,
  type JsonValue,
} from "./tools/json-diff";
export {
  decodeUrl,
  encodeUrl,
  runUrlTransform,
  URL_TRANSFORM_MAX_INPUT_CHARS,
  type UrlEncodingScope,
  type UrlTransformMode,
  type UrlTransformOptions,
} from "./tools/url-encode";
export {
  formatUuidV4,
  generateUuidV4,
  UUID_V4_BYTE_LENGTH,
  UUID_V4_PATTERN,
  type UuidRandomBytes,
} from "./tools/uuid-id";
export {
  BEAUTIFY_MINIFY_MAX_INPUT_CHARS,
  BEAUTIFY_MINIFY_MAX_OUTPUT_CHARS,
  formatJson,
  type JsonFormatMode,
  type JsonFormatOptions,
} from "./tools/beautify-minify";
export { jsonToYaml, JSON_TO_YAML_MAX_INPUT_CHARS } from "./tools/json-to-yaml";
export { yamlToJson, YAML_TO_JSON_MAX_OUTPUT_CHARS } from "./tools/yaml-to-json";
export { YAML_CODEC_MAX_INPUT_CHARS, YAML_CODEC_MAX_OUTPUT_CHARS } from "./tools/yaml-codec";
export {
  decodeHtmlEntities,
  encodeHtmlEntities,
  runHtmlEntityTransform,
  HTML_ENTITIES_MAX_INPUT_CHARS,
  type HtmlEntityFormat,
  type HtmlEntityMode,
  type HtmlEntityOptions,
} from "./tools/html-entities";
export {
  decodeHexText,
  encodeHexText,
  runHexTextTransform,
  HEX_TEXT_MAX_ENCODED_CHARS,
  HEX_TEXT_MAX_INPUT_CHARS,
  HEX_TEXT_MAX_UTF8_BYTES,
  type HexTextFormat,
  type HexTextMode,
  type HexTextOptions,
} from "./tools/hex-text";
export {
  decodeUnicodeCodePoints,
  encodeUnicodeCodePoints,
  runUnicodeConverter,
  UNICODE_CONVERTER_MAX_CODE_POINTS,
  UNICODE_CONVERTER_MAX_INPUT_CHARS,
  type UnicodeConverterMode,
} from "./tools/unicode-converter";
export {
  decodeBinaryText,
  encodeBinaryText,
  runBinaryTextTransform,
  BINARY_TEXT_MAX_ENCODED_CHARS,
  BINARY_TEXT_MAX_INPUT_CHARS,
  BINARY_TEXT_MAX_UTF8_BYTES,
  type BinaryTextMode,
} from "./tools/binary-text";
export {
  CASE_CONVERTER_MAX_INPUT_CHARS,
  convertCase,
  type CaseFormat,
} from "./tools/case-converter";
export {
  parseLineDocument,
  serializeLineDocument,
  sortLines,
  SORT_LINES_MAX_INPUT_CHARS,
  SORT_LINES_MAX_LINES,
  type SortLinesOptions,
} from "./tools/sort-lines";
export {
  dedupeLines,
  DEDUPE_LINES_MAX_INPUT_CHARS,
  DEDUPE_LINES_MAX_LINES,
  type DedupeLinesOptions,
} from "./tools/dedupe-lines";
export {
  reverseText,
  TEXT_REVERSER_MAX_INPUT_CHARS,
  type TextReverseCase,
  type TextReverseMode,
  type TextReverseOptions,
} from "./tools/text-reverser";
