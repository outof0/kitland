import { err, ok, type ToolResult } from "../result";

/** The operation exposed by the URL Encode / Decode tool. */
export type UrlTransformMode = "encode" | "decode";

/**
 * `component` is for a single value destined for a path/query fragment.
 * `url` is for a complete URL string, where URI delimiter characters remain
 * readable and structurally meaningful.
 */
export type UrlEncodingScope = "component" | "url";

export type UrlTransformOptions = {
  scope?: UrlEncodingScope;
};

/** Keep browser, extension, and editor adapters bounded to the same payload. */
export const URL_TRANSFORM_MAX_INPUT_CHARS = 2_000_000;

function assertInputSize(input: string): ToolResult<string> {
  if (input.length > URL_TRANSFORM_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `URL input exceeds ${URL_TRANSFORM_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  return ok(input);
}

function getScope(options: UrlTransformOptions): ToolResult<UrlEncodingScope> {
  const scope = options.scope ?? "component";
  if (scope !== "component" && scope !== "url") {
    return err("INVALID_SCOPE", "URL scope must be either component or url.");
  }

  return ok(scope);
}

/**
 * Percent-encode text without ever interpreting `+` as a space.
 *
 * Component mode uses `encodeURIComponent`, so every URI delimiter is escaped.
 * Full-URL mode uses `encodeURI`, retaining URI syntax such as `:`, `/`, `?`,
 * `&`, `=`, and `#`. This is intentionally URI syntax, not HTML form encoding.
 */
export function encodeUrl(input: string, options: UrlTransformOptions = {}): ToolResult<string> {
  const checkedInput = assertInputSize(input);
  if (!checkedInput.ok) return checkedInput;

  const scope = getScope(options);
  if (!scope.ok) return scope;

  try {
    return ok(scope.value === "url" ? encodeURI(input) : encodeURIComponent(input));
  } catch (cause) {
    // Native URI encoders reject unpaired UTF-16 surrogate code units. Surface
    // that data issue instead of replacing it silently and changing the input.
    if (cause instanceof URIError) {
      return err(
        "INVALID_UNICODE",
        "Text contains an unpaired Unicode surrogate and cannot be percent-encoded.",
      );
    }

    return err("ENCODE_FAILED", "Could not percent-encode the supplied text.");
  }
}

/**
 * Decode strict UTF-8 percent escapes without repairing malformed input.
 *
 * Full-URL mode deliberately preserves escaped URI delimiters (for example
 * `%2F` and `%3F`) via `decodeURI`; component mode decodes all valid escapes.
 * A literal `+` remains `+` in both modes; form-url-encoded text is a distinct
 * format and must not be guessed at by this tool.
 */
export function decodeUrl(input: string, options: UrlTransformOptions = {}): ToolResult<string> {
  const checkedInput = assertInputSize(input);
  if (!checkedInput.ok) return checkedInput;

  const scope = getScope(options);
  if (!scope.ok) return scope;

  try {
    return ok(scope.value === "url" ? decodeURI(input) : decodeURIComponent(input));
  } catch (cause) {
    if (cause instanceof URIError) {
      return err(
        "INVALID_PERCENT_ENCODING",
        "Input contains malformed percent escapes or invalid UTF-8 byte sequences.",
      );
    }

    return err("DECODE_FAILED", "Could not percent-decode the supplied text.");
  }
}

/** A host-neutral entry point for catalog adapters. */
export function runUrlTransform(
  mode: UrlTransformMode,
  input: string,
  options: UrlTransformOptions = {},
): ToolResult<string> {
  if (mode === "encode") return encodeUrl(input, options);
  if (mode === "decode") return decodeUrl(input, options);

  return err("INVALID_MODE", "URL mode must be either encode or decode.");
}
