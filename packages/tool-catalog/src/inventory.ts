/**
 * Stable identity supplied by the product inventory. This is intentionally an
 * identity-only manifest: name, family, pattern, platform, and capability data
 * live once in the matching ToolDefinition so two metadata sources cannot
 * drift. This manifest answers which identities belong to the first
 * coordinated product release.
 */
export type CanonicalToolInventoryEntry = {
  readonly id: string;
  readonly slug: string;
};

/**
 * Product inventory approved in `design/design.pen`.
 *
 * Each entry corresponds to one 1440×900 tool artboard in that Pencil file.
 * It is intentionally identity-only: names, descriptions, family, patterns,
 * and platform contracts are defined once in the matching ToolDefinition.
 * Adding an artboard is not enough to add a product tool: the matching
 * definition, adapters, core behaviour, and release evidence are required.
 */
export const CANONICAL_TOOL_INVENTORY = [
  { id: "beautify-minify", slug: "beautify-minify" },
  { id: "json-diff", slug: "json-diff" },
  { id: "json-toolbox", slug: "json-toolbox" },
  { id: "json-to-yaml", slug: "json-to-yaml" },
  { id: "yaml-to-json", slug: "yaml-to-json" },
  { id: "json-to-csv", slug: "json-to-csv" },
  { id: "json-to-toml", slug: "json-to-toml" },
  { id: "xml-formatter", slug: "xml-formatter" },
  { id: "sql-formatter", slug: "sql-formatter" },
  { id: "markdown-preview", slug: "markdown-preview" },
  { id: "base64", slug: "base64" },
  { id: "url-encode", slug: "url-encode" },
  { id: "html-entities", slug: "html-entities" },
  { id: "hex-text", slug: "hex-text" },
  { id: "unicode-converter", slug: "unicode-converter" },
  { id: "binary-text", slug: "binary-text" },
  { id: "rot13-caesar", slug: "rot13-caesar" },
  { id: "morse-code", slug: "morse-code" },
  { id: "sha-hash", slug: "sha-hash" },
  { id: "hmac-generator", slug: "hmac-generator" },
  { id: "aes-cipher", slug: "aes-cipher" },
  { id: "bcrypt-hash", slug: "bcrypt-hash" },
  { id: "jwt-decoder", slug: "jwt-decoder" },
  { id: "token-generator", slug: "token-generator" },
  { id: "rsa-key-pair", slug: "rsa-key-pair" },
  { id: "uuid-id", slug: "uuid-id" },
  { id: "url-parser", slug: "url-parser" },
  { id: "http-status-codes", slug: "http-status-codes" },
  { id: "mime-types", slug: "mime-types" },
  { id: "user-agent-parser", slug: "user-agent-parser" },
  { id: "basic-auth-header", slug: "basic-auth-header" },
  { id: "curl-converter", slug: "curl-converter" },
  { id: "cron-parser", slug: "cron-parser" },
  { id: "ip-subnet-calculator", slug: "ip-subnet-calculator" },
  { id: "text-stats", slug: "text-stats" },
  { id: "text-diff", slug: "text-diff" },
  { id: "case-converter", slug: "case-converter" },
  { id: "sort-lines", slug: "sort-lines" },
  { id: "dedupe-lines", slug: "dedupe-lines" },
  { id: "lorem-ipsum", slug: "lorem-ipsum" },
  { id: "text-reverser", slug: "text-reverser" },
  { id: "regex-tester", slug: "regex-tester" },
  { id: "password-generator", slug: "password-generator" },
  { id: "nanoid-generator", slug: "nanoid-generator" },
  { id: "ulid-generator", slug: "ulid-generator" },
  { id: "objectid-generator", slug: "objectid-generator" },
  { id: "mock-data", slug: "mock-data" },
  { id: "random-port", slug: "random-port" },
  { id: "random-number", slug: "random-number" },
  { id: "qr-code", slug: "qr-code" },
  { id: "unix-timestamp", slug: "unix-timestamp" },
  { id: "date-calculator", slug: "date-calculator" },
  { id: "timezone-converter", slug: "timezone-converter" },
  { id: "duration-formatter", slug: "duration-formatter" },
  { id: "number-base", slug: "number-base" },
  { id: "color-converter", slug: "color-converter" },
  { id: "temperature", slug: "temperature" },
  { id: "data-size", slug: "data-size" },
  { id: "age-calculator", slug: "age-calculator" },
  { id: "json-to-typescript", slug: "json-to-typescript" },
  { id: "json-to-js-const", slug: "json-to-js-const" },
  { id: "html-to-jsx", slug: "html-to-jsx" },
  { id: "json-escape", slug: "json-escape" },
  { id: "split-to-newlines", slug: "split-to-newlines" },
] as const satisfies readonly CanonicalToolInventoryEntry[];
