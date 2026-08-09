import { err, ok, type ToolResult } from "../result";

export const CURL_CONVERTER_MAX_INPUT_CHARS = 100_000;
export const CURL_CONVERTER_MAX_TOKENS = 1_000;

export type CurlHeader = { name: string; value: string };
export type CurlRequest = {
  url: string;
  method: string;
  headers: readonly CurlHeader[];
  body: string | null;
};

const IGNORED_FLAGS = new Set([
  "-s",
  "-S",
  "-L",
  "-k",
  "-v",
  "--silent",
  "--show-error",
  "--location",
  "--insecure",
  "--compressed",
  "--fail",
]);

/**
 * Parse the portable, request-defining subset of a cURL command without ever
 * executing it. Transport, proxy, cookie-jar and filesystem options are not
 * copied into the generated browser request.
 */
export function parseCurlCommand(source: string): ToolResult<CurlRequest> {
  if (source.length > CURL_CONVERTER_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "The cURL command exceeds the allowed size.");

  const tokenResult = tokenize(source);
  if (!tokenResult.ok) return tokenResult;
  const tokens = tokenResult.value;
  if (tokens.length === 0 || tokens[0]?.toLowerCase() !== "curl")
    return err("INVALID_COMMAND", "Start the command with curl.");

  let method: string | null = null;
  let url: string | null = null;
  let body: string | null = null;
  let sendAsQuery = false;
  const headers: CurlHeader[] = [];

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index] ?? "";
    const next = () => {
      const value = tokens[index + 1];
      if (value === undefined) return null;
      index += 1;
      return value;
    };

    if (IGNORED_FLAGS.has(token)) continue;
    if (token === "-X" || token === "--request") {
      const value = next();
      if (!value) return err("MISSING_OPTION_VALUE", `${token} needs an HTTP method.`);
      method = value.toUpperCase();
      continue;
    }
    if (token === "-H" || token === "--header") {
      const value = next();
      if (value === null) return err("MISSING_OPTION_VALUE", `${token} needs a header.`);
      const separator = value.indexOf(":");
      if (separator < 1) return err("INVALID_HEADER", "Each header must have a name and value.");
      headers.push({
        name: value.slice(0, separator).trim(),
        value: value.slice(separator + 1).trim(),
      });
      continue;
    }
    if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary"
    ) {
      const value = next();
      if (value === null) return err("MISSING_OPTION_VALUE", `${token} needs a request body.`);
      if (value.startsWith("@"))
        return err(
          "UNSUPPORTED_FILE_BODY",
          "File-backed request bodies cannot be converted because the local file is not available here.",
        );
      body = body === null ? value : `${body}&${value}`;
      continue;
    }
    if (token === "-u" || token === "--user") {
      const value = next();
      if (value === null) return err("MISSING_OPTION_VALUE", `${token} needs credentials.`);
      headers.push({ name: "Authorization", value: `Basic ${base64Utf8(value)}` });
      continue;
    }
    if (token === "-I" || token === "--head") {
      method = "HEAD";
      continue;
    }
    if (token === "-G" || token === "--get") {
      sendAsQuery = true;
      continue;
    }
    if (token === "--url") {
      const value = next();
      if (value === null) return err("MISSING_OPTION_VALUE", "--url needs a URL.");
      url = value;
      continue;
    }
    if (token.startsWith("-")) {
      return err("UNSUPPORTED_OPTION", `${token} is not supported by this local converter.`);
    }
    if (url === null) {
      url = token;
      continue;
    }
    return err("UNEXPECTED_ARGUMENT", `Unexpected argument: ${token}`);
  }

  if (!url) return err("MISSING_URL", "Include a request URL in the cURL command.");
  try {
    const protocol = new URL(url).protocol;
    if (protocol !== "http:" && protocol !== "https:")
      return err("UNSUPPORTED_URL", "Only absolute http and https URLs can be converted to Fetch.");
  } catch {
    return err("INVALID_URL", "Enter an absolute http or https request URL.");
  }
  const normalizedUrl = appendQuery(url, body, sendAsQuery);
  const resolvedMethod = method ?? (body !== null && !sendAsQuery ? "POST" : "GET");
  return ok({
    url: normalizedUrl,
    method: resolvedMethod,
    headers,
    body: sendAsQuery ? null : body,
  });
}

export function formatFetchRequest(request: CurlRequest): string {
  const init: string[] = [`method: ${JSON.stringify(request.method)}`];
  if (request.headers.length > 0) {
    const headerEntries = request.headers.map(
      ({ name, value }) => `    ${JSON.stringify(name)}: ${JSON.stringify(value)}`,
    );
    init.push(`headers: {\n${headerEntries.join(",\n")}\n  }`);
  }
  if (request.body !== null && request.method !== "GET" && request.method !== "HEAD")
    init.push(`body: ${JSON.stringify(request.body)}`);
  return `const response = await fetch(${JSON.stringify(request.url)}, {\n  ${init.join(",\n  ")}\n});\n\nif (!response.ok) {\n  throw new Error(\`HTTP \${response.status}\`);\n}\n\nconst data = await response.text();`;
}

function appendQuery(url: string, body: string | null, enabled: boolean): string {
  if (!enabled || !body) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${body}`;
}

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function tokenize(source: string): ToolResult<readonly string[]> {
  const tokens: string[] = [];
  let token = "";
  let quote: "'" | '"' | null = null;
  let escaped = false;

  for (const character of source.trim()) {
    if (escaped) {
      if (character !== "\n") token += character;
      escaped = false;
    } else if (character === "\\" && quote !== "'") {
      escaped = true;
    } else if (quote !== null) {
      if (character === quote) quote = null;
      else token += character;
    } else if (character === "'" || character === '"') {
      quote = character;
    } else if (/\s/.test(character)) {
      if (token) {
        tokens.push(token);
        token = "";
      }
    } else {
      token += character;
    }
    if (tokens.length > CURL_CONVERTER_MAX_TOKENS)
      return err("TOO_MANY_TOKENS", "The cURL command has too many arguments.");
  }
  if (escaped || quote !== null)
    return err("UNTERMINATED_QUOTE", "Close every quote in the cURL command.");
  if (token) tokens.push(token);
  return ok(tokens);
}
