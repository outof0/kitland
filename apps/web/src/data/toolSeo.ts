import type { ToolDefinition } from "@kitland/tools";

export type ToolSeoContent = {
  heading: string;
  introduction: string;
  steps: readonly string[];
  useCases: readonly string[];
  faqs: readonly {
    question: string;
    answer: string;
  }[];
};

function localTransformSeo(toolName: string, detail: string): ToolSeoContent {
  return {
    heading: `${toolName} — keep data local, tools out and work on`,
    introduction: `${detail} Kitland processes all data locally on your device with no account, no uploads, and zero payload telemetry.`,
    steps: [
      "Paste or type a value in the input editor.",
      "Choose the available format or direction options when the tool offers them.",
      "Review the derived result, then copy it when it is ready.",
    ],
    useCases: [
      "Quickly inspect or transform developer text without opening a project.",
      "Keep configuration, snippets, and notes in the browser while working locally.",
      "Validate a result before moving it into another editor or terminal.",
    ],
    faqs: [
      {
        question: "Does Kitland upload my input?",
        answer:
          "No. These transformations run locally on your device. Avoid sharing screenshots or copied results that contain secrets.",
      },
      {
        question: "What happens when the input is invalid?",
        answer:
          "The tool keeps the input visible and reports a typed validation message instead of producing a misleading result.",
      },
    ],
  };
}

/**
 * Indexable tool copy lives beside the catalog rather than inside a client
 * component. A new public tool must supply real explanatory content; this
 * prevents 64 thin, near-duplicate landing pages from entering the sitemap.
 */
export const TOOL_SEO_CONTENT: Readonly<Record<string, ToolSeoContent>> = {
  "json-diff": localTransformSeo(
    "JSON Diff",
    "Compare two JSON documents and inspect bounded structural changes.",
  ),
  "sql-formatter": localTransformSeo(
    "SQL Formatter",
    "Format common SQL queries while preserving strings and comments.",
  ),
  "markdown-preview": localTransformSeo(
    "Markdown Preview",
    "Preview a safe Markdown subset locally without executing raw HTML.",
  ),
  "json-escape": localTransformSeo(
    "JSON Escape",
    "Escape plain text into JSON string literals or decode them safely.",
  ),
  "url-encode": localTransformSeo(
    "URL Encode",
    "Encode or decode URL components locally with explicit scope controls.",
  ),
  "uuid-id": localTransformSeo(
    "UUID / ID",
    "Generate UUID identifiers with secure host-provided entropy.",
  ),
  base64: {
    heading: "Encode and decode Base64 without sending your text anywhere",
    introduction:
      "Base64 represents bytes with text characters. It is useful for transport and embedding, but it is not encryption. Kitland converts UTF-8 text locally in your browser and never uploads the text you paste.",
    steps: [
      "Choose Encode for UTF-8 text or Decode for an existing Base64 value.",
      "Paste or upload a UTF-8 text file in the input editor.",
      "Copy or download the result from the output editor when it is valid.",
    ],
    useCases: [
      "Prepare a UTF-8 value for a header, configuration file, or data URL.",
      "Inspect a Base64 or Base64URL value while keeping the source text local.",
      "Switch directions to use a valid result as the next input.",
    ],
    faqs: [
      {
        question: "Is Base64 encryption?",
        answer:
          "No. Base64 is an encoding, so anyone with the value can decode it. Do not use it to protect passwords, tokens, or other secrets.",
      },
      {
        question: "What is Base64URL?",
        answer:
          "Base64URL uses URL-safe characters instead of + and /. It is commonly used in URLs and token formats, and padding may be omitted.",
      },
      {
        question: "Does Kitland upload my text?",
        answer:
          "No. This tool runs in the browser. Share links are optional and put the current input in the URL fragment, so never share a link containing secrets.",
      },
    ],
  },
  "beautify-minify": localTransformSeo(
    "JSON Beautify / Minify",
    "Format JSON for review or compact it for transport while preserving its data.",
  ),
  "json-to-yaml": localTransformSeo(
    "JSON to YAML",
    "Convert JSON documents into a predictable, readable YAML subset.",
  ),
  "yaml-to-json": localTransformSeo(
    "YAML to JSON",
    "Convert supported YAML mappings and sequences into formatted JSON.",
  ),
  "json-formatter": {
    heading: "Format and inspect JSON locally with clear structural statistics",
    introduction:
      "JSON Formatter validates one JSON document—including object, array, string, number, boolean, and null roots—then beautifies it with exactly 2 or 4 spaces or minifies it, and reports value-type counts and maximum depth. Work stays in your browser, with a 1,000,000 UTF-16 code-unit input and output limit.",
    steps: [
      "Paste a single JSON document or load the built-in sample.",
      "Choose Beautify or Minify; indentation applies to Beautify, then let the local worker inspect the current source.",
      "Review the root type, total values, object, array, string, number, boolean, null, and depth statistics before copying the current JSON output.",
    ],
    useCases: [
      "Confirm that an API payload or configuration snippet has valid JSON syntax before using it.",
      "Reformat compact JSON for code review while preserving native JavaScript JSON behavior.",
      "Minify a validated JSON payload for transport without uploading it.",
      "Estimate document structure and nesting from bounded local statistics without uploading data.",
    ],
    faqs: [
      {
        question: "Does JSON validation prove that the data matches a schema?",
        answer:
          "No. This inspector proves JSON syntax only. It does not validate a schema, repair input, sort keys, or establish that values are trustworthy.",
      },
      {
        question: "How are duplicate keys, large numbers, and integer-like keys handled?",
        answer:
          "The tool uses native JSON parsing: the last duplicate key wins, numbers use JavaScript binary64 and may be respelled, and integer-like object keys may appear in native enumeration order.",
      },
      {
        question: "Does JSON Formatter upload or retain my document?",
        answer:
          "No. Inspection runs in a dedicated browser worker, no network request is made, and the current payload is kept only in memory for the open tool session.",
      },
    ],
  },
  "json-to-csv": localTransformSeo(
    "JSON to CSV",
    "Convert JSON records into escaped RFC 4180 CSV while keeping the conversion local.",
  ),
  "json-to-toml": localTransformSeo(
    "JSON to TOML",
    "Convert JSON configuration objects into readable TOML tables and values.",
  ),
  "xml-formatter": localTransformSeo(
    "XML Formatter",
    "Validate and format XML locally with external entities disabled.",
  ),
  "html-entities": localTransformSeo(
    "HTML Entities",
    "Encode reserved characters or decode common named and numeric HTML entities.",
  ),
  "hex-text": localTransformSeo(
    "Hex Text",
    "Represent UTF-8 text as hexadecimal bytes or decode hexadecimal bytes back to text.",
  ),
  "unicode-converter": localTransformSeo(
    "Unicode Converter",
    "Inspect Unicode code points and turn explicit U+ notation back into text.",
  ),
  "binary-text": localTransformSeo(
    "Binary Text",
    "Represent UTF-8 text as binary bytes or decode binary bytes back into text.",
  ),
  "rot13-caesar": localTransformSeo(
    "ROT13 Caesar",
    "Apply the fixed ROT13 Caesar shift to ASCII letters while preserving all other characters.",
  ),
  "sha-hash": localTransformSeo(
    "SHA-256 Hash",
    "Create SHA-256 digests locally from UTF-8 text in hex, Base64, or Base64URL output.",
  ),
  "hmac-generator": localTransformSeo(
    "HMAC-SHA-256 Generator",
    "Create a keyed HMAC-SHA-256 signature locally from UTF-8 secret and message text.",
  ),
  "aes-cipher": localTransformSeo(
    "AES-256-GCM Cipher",
    "Encrypt and decrypt local UTF-8 text with an explicit AES-256 key and nonce packet.",
  ),
  "bcrypt-hash": localTransformSeo(
    "Bcrypt Hash",
    "Create and verify bcrypt password hashes locally in your browser.",
  ),
  "jwt-decoder": localTransformSeo(
    "JWT Decoder",
    "Decode JWT header and claims locally without claiming signature verification.",
  ),
  "token-generator": localTransformSeo(
    "Token Generator",
    "Create cryptographically secure random tokens locally with Web Crypto.",
  ),
  "rsa-key-pair": localTransformSeo(
    "RSA Key Pair",
    "Generate RSA-OAEP public and private PEM keys locally with Web Crypto.",
  ),
  "url-parser": localTransformSeo(
    "URL Parser",
    "Inspect URL components and query parameters locally without making a network request.",
  ),
  "http-status-codes": localTransformSeo(
    "HTTP Status Codes",
    "Look up common HTTP response status codes locally.",
  ),
  "mime-types": localTransformSeo(
    "MIME Types",
    "Look up media types from an extension, filename, or Content-Type value locally.",
  ),
  "user-agent-parser": localTransformSeo(
    "User Agent Parser",
    "Inspect the browser, engine, operating system, and device signals in a user-agent string locally.",
  ),
  "basic-auth-header": localTransformSeo(
    "Basic Auth Header",
    "Build and decode Basic Authorization headers locally; use HTTPS for credentials.",
  ),
  "curl-converter": {
    heading: "Convert cURL commands to Fetch without sending a request",
    introduction:
      "Turn a bounded, portable cURL command into readable JavaScript Fetch source entirely in your browser. Kitland parses the command but never executes it, sends a network request, reads a local file, stores the payload, or adds it to the URL.",
    steps: [
      "Paste a cURL command that starts with curl and contains one absolute HTTP or HTTPS URL.",
      "Review the live Fetch result, including its method, ordered headers, query data, and optional body.",
      "Copy the generated JavaScript after checking credentials and request data for secrets.",
    ],
    useCases: [
      "Translate an API documentation example into Fetch code for a browser or JavaScript project.",
      "Preserve repeated headers and body fragments while reviewing how a request maps to Fetch.",
      "Inspect a request locally before moving a sanitized version into source code or a test fixture.",
    ],
    faqs: [
      {
        question: "Which cURL options are supported?",
        answer:
          "The converter supports request method, headers, inline data, Basic authentication, HEAD, GET query transfer, --url, and one positional HTTP or HTTPS URL. Common transport-only flags such as --silent, --location, and --compressed are ignored; other options are rejected.",
      },
      {
        question: "Will the converter read @file request bodies?",
        answer:
          "No. File-backed -d, --data, --data-raw, and --data-binary values are rejected because this local converter cannot and should not read the referenced file.",
      },
      {
        question: "Does converting a cURL command send the request?",
        answer:
          "No. Parsing and formatting are synchronous and local. The generated Fetch source is displayed as text and is never executed by Kitland.",
      },
      {
        question: "Are Basic authentication credentials safe to paste?",
        answer:
          "The conversion stays on this device, but Basic authentication is only encoding, not encryption. Treat the generated Authorization header as sensitive and use HTTPS when you eventually send it elsewhere.",
      },
      {
        question: "What are the cURL converter limits?",
        answer:
          "Input is limited to 100,000 JavaScript UTF-16 code units and 1,000 parsed tokens so conversion remains predictable and responsive.",
      },
    ],
  },
  "cron-parser": localTransformSeo(
    "Cron Parser",
    "Explain a standard five-field Unix cron expression and preview its upcoming local-time runs.",
  ),
  "ip-subnet-calculator": localTransformSeo(
    "IP Subnet Calculator",
    "Calculate IPv4 CIDR network ranges, masks, and usable host counts locally.",
  ),
  "password-generator": localTransformSeo(
    "Password Generator",
    "Generate a policy-controlled password locally with browser-provided secure randomness.",
  ),
  "nanoid-generator": localTransformSeo(
    "NanoID Generator",
    "Generate compact custom-alphabet NanoID-style identifiers locally with secure browser randomness.",
  ),
  "ulid-generator": localTransformSeo(
    "ULID Generator",
    "Generate time-sortable ULID identifiers locally with secure browser entropy.",
  ),
  "objectid-generator": localTransformSeo(
    "ObjectID Generator",
    "Generate MongoDB-compatible ObjectID values locally with secure browser entropy.",
  ),
  "mock-data": localTransformSeo(
    "Mock Data",
    "Generate bounded fixture records and JSON previews locally.",
  ),
  "qr-code": localTransformSeo(
    "QR Code",
    "Generate downloadable QR codes locally from text or URLs.",
  ),
  "unix-timestamp": localTransformSeo(
    "Unix Timestamp",
    "Convert Unix seconds or milliseconds to ISO time locally.",
  ),
  "case-converter": localTransformSeo(
    "Case Converter",
    "Move identifiers and phrases between camel, snake, kebab, title, and sentence case.",
  ),
  "sort-lines": localTransformSeo(
    "Sort Lines",
    "Order line-oriented text with stable, deterministic comparison rules.",
  ),
  "dedupe-lines": localTransformSeo(
    "Dedupe Lines",
    "Remove repeated lines while retaining the first occurrence and original order.",
  ),
  "text-reverser": localTransformSeo(
    "Text Reverser",
    "Reverse characters, words, or lines with Unicode-aware handling.",
  ),
  "text-stats": localTransformSeo(
    "Text Stats",
    "Count characters, words, lines, and reading metrics without uploading your text.",
  ),
  "text-diff": localTransformSeo(
    "Text Diff",
    "Compare two text values and review bounded line-level changes locally.",
  ),
  "lorem-ipsum": localTransformSeo(
    "Lorem Ipsum",
    "Generate placeholder paragraphs and sentences for prototypes and layout tests.",
  ),
  "regex-tester": localTransformSeo(
    "Regex Tester",
    "Test a regular expression against sample text and inspect bounded matches and captures.",
  ),
  "random-port": localTransformSeo(
    "Random Port",
    "Generate valid random network ports for local development and configuration examples.",
  ),
  "random-number": localTransformSeo(
    "Random Number",
    "Generate cryptographically secure random numbers within a chosen range locally.",
  ),
  "morse-code": localTransformSeo(
    "Morse Code",
    "Encode or decode ITU Morse for Latin letters and digits without leaving the browser.",
  ),
  "split-to-newlines": localTransformSeo(
    "Split to Newlines",
    "Split comma, semicolon, whitespace, or custom-delimited text into one value per line.",
  ),
  "json-to-typescript": localTransformSeo(
    "JSON to TypeScript",
    "Infer a TypeScript type declaration from a JSON sample locally.",
  ),
  "json-to-js-const": localTransformSeo(
    "JSON to JS const",
    "Turn a JSON value into a pretty-printed JavaScript const declaration.",
  ),
  "html-to-jsx": localTransformSeo(
    "HTML to JSX",
    "Convert HTML attribute names into JSX-friendly form without executing markup.",
  ),
  "number-base": localTransformSeo(
    "Number Base",
    "Convert integers between bases 2–36 for debugging and encoding work.",
  ),
  temperature: localTransformSeo(
    "Temperature",
    "Convert Celsius, Fahrenheit, and Kelvin values with absolute-zero checks.",
  ),
  "data-size": localTransformSeo(
    "Data Size",
    "Convert SI and binary data sizes such as MB and MiB locally.",
  ),
  "color-converter": localTransformSeo(
    "Color Converter",
    "Convert colors between hex, RGB, and HSL without uploading design tokens.",
  ),
  "duration-formatter": localTransformSeo(
    "Duration Formatter",
    "Format second counts into day, hour, minute, and second labels.",
  ),
  "timezone-converter": localTransformSeo(
    "Timezone Converter",
    "Convert wall times between a fixed local IANA offset set without network lookups.",
  ),
  "date-calculator": localTransformSeo(
    "Date Calculator",
    "Diff ISO dates and apply day offsets using UTC calendar rules.",
  ),
  "age-calculator": localTransformSeo(
    "Age Calculator",
    "Compute years, months, and days between two ISO dates locally.",
  ),
};

export function getToolSeoContent(slug: string): ToolSeoContent | undefined {
  return TOOL_SEO_CONTENT[slug];
}

/** Fail static generation if a catalog entry would create a thin SEO page. */
export function requireToolSeoContent(tool: ToolDefinition): ToolSeoContent {
  const content = getToolSeoContent(tool.slug);
  if (!content) {
    throw new Error(
      `Available tool "${tool.slug}" needs tool SEO content before it can be published.`,
    );
  }
  return content;
}
