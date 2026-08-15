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
      const name = separator < 0 ? "" : value.slice(0, separator).trim();
      if (!name) return err("INVALID_HEADER", "Each header must have a name and value.");
      headers.push({
        name,
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
      headers.push({
        name: "Authorization",
        value: `Basic ${base64Utf8(value)}`,
      });
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
      if (url !== null) return err("UNEXPECTED_ARGUMENT", `Unexpected argument: ${value}`);
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
      ({ name, value }) => `    [${JSON.stringify(name)}, ${JSON.stringify(value)}]`,
    );
    init.push(`headers: [\n${headerEntries.join(",\n")}\n  ]`);
  }
  if (request.body !== null && request.method !== "GET" && request.method !== "HEAD")
    init.push(`body: ${JSON.stringify(request.body)}`);
  return `const response = await fetch(${JSON.stringify(request.url)}, {\n  ${init.join(",\n  ")}\n});\n\nif (!response.ok) {\n  throw new Error(\`HTTP \${response.status}\`);\n}\n\nconst data = await response.text();`;
}

const MAX_FETCH_CHARS = 100_000;

/**
 * Parse the portable, request-defining subset of a JavaScript Fetch call
 * without ever executing it: `fetch("url")` with an optional init object of
 * `method`, `headers` and `body` string literals. Template literals without
 * interpolation are accepted; dynamic expressions are not converted.
 */
export function parseFetchSource(source: string): ToolResult<CurlRequest> {
  if (source.length > MAX_FETCH_CHARS)
    return err("INPUT_TOO_LARGE", "The Fetch call exceeds the allowed size.");

  const callResult = extractFetchCall(source);
  if (!callResult.ok) return callResult;
  const { args, objectEnd } = callResult.value;

  const parts = splitTopLevel(args, ",");
  const urlPart = parts[0]?.trim() ?? "";
  const url = parseStringLiteral(urlPart);
  if (url === null) return err("INVALID_COMMAND", "Start with fetch('url') and a quoted URL.");
  try {
    const protocol = new URL(url).protocol;
    if (protocol !== "http:" && protocol !== "https:")
      return err("UNSUPPORTED_URL", "Only absolute http and https URLs can be converted to cURL.");
  } catch {
    return err("INVALID_URL", "Enter an absolute http or https request URL.");
  }

  let method: string | null = null;
  let body: string | null = null;
  const headers: CurlHeader[] = [];

  if (parts.length > 1) {
    const initPart = parts.slice(1).join(",").trim();
    if (!initPart.startsWith("{"))
      return err("UNSUPPORTED_SYNTAX", "The second fetch() argument must be an options object.");
    if (objectEnd !== null && !initPart.endsWith("}"))
      return err("UNSUPPORTED_SYNTAX", "Close the options object with }.");
    const initBody = initPart.startsWith("{") ? initPart.slice(1) : initPart;
    const bodyPart =
      objectEnd !== null && initBody.endsWith("}") ? initBody.slice(0, -1) : initBody;
    for (const entry of splitTopLevel(bodyPart, ",")) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(":");
      if (colon < 0) return err("UNSUPPORTED_SYNTAX", `Expected key: value, got ${trimmed}.`);
      const key = trimmed.slice(0, colon).trim();
      const value = trimmed.slice(colon + 1).trim();
      const name = key.replace(/^["'`]|["'`]$/g, "");
      if (name === "method") {
        const literal = parseStringLiteral(value);
        if (literal === null) return err("UNSUPPORTED_SYNTAX", "method must be a quoted string.");
        method = literal.toUpperCase();
      } else if (name === "body") {
        const literal = parseStringLiteral(value);
        if (literal === null) return err("UNSUPPORTED_SYNTAX", "body must be a quoted string.");
        body = literal;
      } else if (name === "headers") {
        const headerResult = parseHeaderObject(value);
        if (!headerResult.ok) return headerResult;
        headers.push(...headerResult.value);
      } else {
        return err("UNSUPPORTED_SYNTAX", `The ${name} option is not converted.`);
      }
    }
  }

  const resolvedMethod = method ?? (body !== null ? "POST" : "GET");
  return ok({ url, method: resolvedMethod, headers, body });
}

function parseHeaderObject(source: string): ToolResult<readonly CurlHeader[]> {
  const trimmed = source.trim();
  if (!trimmed.startsWith("{"))
    return err("UNSUPPORTED_SYNTAX", "headers must be an object literal.");
  if (!trimmed.endsWith("}")) return err("UNSUPPORTED_SYNTAX", "Close the headers object with }.");
  const inner = trimmed.slice(1, -1);
  const headers: CurlHeader[] = [];
  for (const entry of splitTopLevel(inner, ",")) {
    const pair = entry.trim();
    if (!pair) continue;
    const colon = pair.indexOf(":");
    if (colon < 0) return err("INVALID_HEADER", "Each header must have a name and value.");
    const name = pair
      .slice(0, colon)
      .trim()
      .replace(/^["'`]|["'`]$/g, "");
    if (!name) return err("INVALID_HEADER", "Each header must have a name and value.");
    const value = parseStringLiteral(pair.slice(colon + 1).trim());
    if (value === null) return err("INVALID_HEADER", "Header values must be quoted strings.");
    headers.push({ name, value });
  }
  return ok(headers);
}

function extractFetchCall(source: string): ToolResult<{ args: string; objectEnd: number | null }> {
  const trimmed = source.trim();
  let depth = 0;
  let openIndex = -1;
  let closeIndex = -1;
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const character = trimmed[index] ?? "";
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== null) {
      escaped = true;
      continue;
    }
    if (quote !== null) {
      if (character === quote) quote = null;
      else if (character === "$" && trimmed[index + 1] === "{" && quote === "`")
        return err(
          "UNSUPPORTED_SYNTAX",
          "Template literal interpolation is not converted; use a plain string URL.",
        );
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      continue;
    }
    if (character === "(") {
      if (
        depth === 0 &&
        openIndex < 0 &&
        /(^|[^A-Za-z0-9_$])fetch$/.test(trimmed.slice(0, index).trimEnd())
      )
        openIndex = index;
      depth += 1;
      continue;
    }
    if (character === ")") {
      depth -= 1;
      if (depth === 0 && openIndex >= 0) {
        closeIndex = index;
        break;
      }
      if (depth < 0) return err("UNSUPPORTED_SYNTAX", "Unbalanced parentheses in the Fetch call.");
    }
  }

  if (quote !== null) return err("UNTERMINATED_QUOTE", "Close every quote in the Fetch call.");
  if (openIndex < 0) return err("INVALID_COMMAND", "Start with a fetch() call.");
  if (depth !== 0) return err("UNSUPPORTED_SYNTAX", "Close every parenthesis in the Fetch call.");

  const args = trimmed.slice(openIndex + 1, closeIndex);
  const objectEnd = findObjectEnd(args);
  return ok({ args, objectEnd });
}

function findObjectEnd(args: string): number | null {
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;
  for (let index = 0; index < args.length; index += 1) {
    const character = args[index] ?? "";
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== null) {
      escaped = true;
      continue;
    }
    if (quote !== null) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      continue;
    }
    if (character === "}" && args.slice(index + 1).trim().length === 0) return index;
  }
  return null;
}

function parseStringLiteral(part: string): string | null {
  const trimmed = part.trim();
  if (trimmed.length < 2) return null;
  const quote = trimmed[0];
  if (quote !== "'" && quote !== '"' && quote !== "`") return null;
  if (!trimmed.endsWith(quote)) return null;
  const inner = trimmed.slice(1, -1);
  if (quote === "`" && inner.includes("${")) return null;
  let out = "";
  let escaped = false;
  for (const character of inner) {
    if (escaped) {
      out += character;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else {
      out += character;
    }
  }
  if (escaped) return null;
  return out;
}

function splitTopLevel(source: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;
  let current = "";
  for (const character of source) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && quote !== null) {
      current += character;
      escaped = true;
      continue;
    }
    if (quote !== null) {
      current += character;
      if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      current += character;
      quote = character;
      continue;
    }
    if (character === "{" || character === "(" || character === "[") {
      depth += 1;
      current += character;
      continue;
    }
    if (character === "}" || character === ")" || character === "]") {
      depth -= 1;
      current += character;
      continue;
    }
    if (character === separator && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  parts.push(current);
  return parts;
}

export function formatCurlCommand(request: CurlRequest): string {
  const lines: string[] = [];
  const flags: string[] = [];
  if (request.method !== "GET") flags.push(`-X ${request.method}`);
  for (const header of request.headers)
    flags.push(`-H ${shellQuote(`${header.name}: ${header.value}`)}`);
  if (request.body !== null && request.method !== "GET" && request.method !== "HEAD")
    flags.push(`-d ${shellQuote(request.body)}`);
  if (flags.length === 0) return `curl ${shellQuote(request.url)}`;
  lines.push(`curl ${shellQuote(request.url)} \\`);
  const bodyFlag = flags.find((flag) => flag.startsWith("-d "));
  const otherFlags = flags.filter((flag) => !flag.startsWith("-d "));
  const all = [...otherFlags, ...(bodyFlag ? [bodyFlag] : [])];
  for (let index = 0; index < all.length; index += 1) {
    const isLast = index === all.length - 1;
    lines.push(`  ${all[index]}${isLast ? "" : " \\"}`);
  }
  return lines.join("\n");
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
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
  if (token) {
    tokens.push(token);
    if (tokens.length > CURL_CONVERTER_MAX_TOKENS)
      return err("TOO_MANY_TOKENS", "The cURL command has too many arguments.");
  }
  return ok(tokens);
}
