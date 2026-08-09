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
  rotateCaesar,
  runRot13Caesar,
  ROT13_CAESAR_MAX_INPUT_CHARS,
  type Rot13CaesarMode,
} from "./tools/rot13-caesar";
export {
  hashSha256,
  SHA_HASH_ALGORITHM,
  SHA_HASH_DIGEST_BYTES,
  SHA_HASH_MAX_INPUT_CHARS,
  type ShaDigest,
  type ShaHashEncoding,
  type ShaHashOptions,
  type ShaHashResult,
} from "./tools/sha-hash";
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
export {
  inspectJson,
  JSON_TOOLBOX_MAX_DEPTH,
  JSON_TOOLBOX_MAX_INPUT_CHARS,
  JSON_TOOLBOX_MAX_NODES,
  type JsonInspection,
  type JsonRootType,
} from "./tools/json-toolbox";
export {
  jsonToCsv,
  JSON_TO_CSV_MAX_COLUMNS,
  JSON_TO_CSV_MAX_INPUT_CHARS,
  JSON_TO_CSV_MAX_OUTPUT_CHARS,
  JSON_TO_CSV_MAX_ROWS,
  type JsonToCsvOptions,
} from "./tools/json-to-csv";
export {
  jsonToToml,
  JSON_TO_TOML_MAX_DEPTH,
  JSON_TO_TOML_MAX_INPUT_CHARS,
  JSON_TO_TOML_MAX_NODES,
  JSON_TO_TOML_MAX_OUTPUT_CHARS,
} from "./tools/json-to-toml";
export {
  formatXml,
  XML_FORMATTER_MAX_DEPTH,
  XML_FORMATTER_MAX_INPUT_CHARS,
  XML_FORMATTER_MAX_OUTPUT_CHARS,
  XML_FORMATTER_MAX_TOKENS,
  type XmlFormatResult,
} from "./tools/xml-formatter";
export { getTextStats, TEXT_STATS_MAX_INPUT_CHARS, type TextStats } from "./tools/text-stats";
export {
  diffText,
  TEXT_DIFF_MAX_INPUT_CHARS,
  TEXT_DIFF_MAX_LINES,
  TEXT_DIFF_MAX_MATRIX_CELLS,
  type TextDiffLine,
  type TextDiffResult,
} from "./tools/text-diff";
export {
  testRegex,
  REGEX_TEST_MAX_INPUT_CHARS,
  REGEX_TEST_MAX_MATCHES,
  REGEX_TEST_MAX_PATTERN_CHARS,
  type RegexCapture,
  type RegexMatch,
  type RegexTestOptions,
  type RegexTestResult,
} from "./tools/regex-tester";
export {
  generateLoremIpsum,
  LOREM_MAX_AMOUNT,
  LOREM_MAX_OUTPUT_BYTES,
  type LoremIpsumOptions,
  type LoremUnit,
} from "./tools/lorem-ipsum";
export {
  generateRandomPorts,
  RANDOM_PORT_MAX_COUNT,
  type PortProtocol,
  type PortRange,
  type RandomPortOptions,
  type RandomPortResult,
  type SecureRandomUint32,
} from "./tools/random-port";
export {
  generateRandomNumbers,
  RANDOM_NUMBER_MAX_COUNT,
  RANDOM_NUMBER_MAX_DECIMALS,
  RANDOM_NUMBER_MAX_STEPS,
  type RandomNumberOptions,
  type RandomNumberResult,
} from "./tools/random-number";
export {
  escapeJson,
  unescapeJson,
  runJsonEscape,
  JSON_ESCAPE_MAX_INPUT_CHARS,
  JSON_ESCAPE_MAX_ENCODED_CHARS,
  type JsonEscapeMode,
} from "./tools/json-escape";
export {
  formatSql,
  SQL_FORMATTER_MAX_INPUT_CHARS,
  SQL_FORMATTER_MAX_OUTPUT_CHARS,
  type SqlFormatOptions,
} from "./tools/sql-formatter";
export {
  renderMarkdown,
  MARKDOWN_PREVIEW_MAX_INPUT_CHARS,
  MARKDOWN_PREVIEW_MAX_OUTPUT_CHARS,
  type MarkdownPreview,
} from "./tools/markdown-preview";
