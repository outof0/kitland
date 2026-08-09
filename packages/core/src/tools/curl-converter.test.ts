import { describe, expect, it } from "vitest";
import {
  CURL_CONVERTER_MAX_INPUT_CHARS,
  CURL_CONVERTER_MAX_TOKENS,
  formatCurlCommand,
  formatFetchRequest,
  parseCurlCommand,
  parseFetchSource,
} from "./curl-converter";

const exactError = (code: string, message: string) => ({
  ok: false,
  error: { code, message },
});

describe("cURL converter", () => {
  it("handles empty input and canonical GET, POST, and HEAD commands", () => {
    expect(parseCurlCommand("")).toEqual(
      exactError("INVALID_COMMAND", "Start the command with curl."),
    );
    expect(parseCurlCommand("   \n ")).toEqual(
      exactError("INVALID_COMMAND", "Start the command with curl."),
    );
    expect(parseCurlCommand("curl https://example.test")).toEqual({
      ok: true,
      value: {
        url: "https://example.test",
        method: "GET",
        headers: [],
        body: null,
      },
    });
    expect(parseCurlCommand("curl -d x=1 https://example.test")).toMatchObject({
      ok: true,
      value: { method: "POST", body: "x=1" },
    });
    expect(parseCurlCommand("curl --head -d x=1 https://example.test")).toMatchObject({
      ok: true,
      value: { method: "HEAD", body: "x=1" },
    });
  });

  it("supports every short and long request-defining option", () => {
    for (const option of ["-X", "--request"]) {
      expect(parseCurlCommand(`curl ${option} custom https://example.test`)).toMatchObject({
        ok: true,
        value: { method: "CUSTOM" },
      });
    }
    for (const option of ["-H", "--header"]) {
      expect(parseCurlCommand(`curl ${option} ' X-Test : ' https://example.test`)).toMatchObject({
        ok: true,
        value: { headers: [{ name: "X-Test", value: "" }] },
      });
    }
    for (const option of ["-d", "--data", "--data-raw", "--data-binary"]) {
      expect(parseCurlCommand(`curl ${option} value https://example.test`)).toMatchObject({
        ok: true,
        value: { body: "value", method: "POST" },
      });
    }
    for (const option of ["-u", "--user"]) {
      expect(parseCurlCommand(`curl ${option} 'é:✓' https://example.test`)).toMatchObject({
        ok: true,
        value: {
          headers: [{ name: "Authorization", value: "Basic w6k64pyT" }],
        },
      });
    }
    for (const option of ["-I", "--head"]) {
      expect(parseCurlCommand(`curl ${option} https://example.test`)).toMatchObject({
        ok: true,
        value: { method: "HEAD" },
      });
    }
    for (const option of ["-G", "--get"]) {
      expect(parseCurlCommand(`curl ${option} -d q=x https://example.test?a=1`)).toMatchObject({
        ok: true,
        value: {
          url: "https://example.test?a=1&q=x",
          method: "GET",
          body: null,
        },
      });
    }
    expect(parseCurlCommand("curl --url https://example.test")).toMatchObject({
      ok: true,
    });
  });

  it("preserves repeated data and ordered duplicate headers", () => {
    const parsed = parseCurlCommand(
      "curl -H 'X-A: 1' -H 'X-A: 2' -d a=1 --data-raw b=2 https://example.test",
    );
    expect(parsed).toMatchObject({
      ok: true,
      value: {
        headers: [
          { name: "X-A", value: "1" },
          { name: "X-A", value: "2" },
        ],
        body: "a=1&b=2",
      },
    });
    if (!parsed.ok) return;
    expect(formatFetchRequest(parsed.value)).toContain(
      'headers: [\n    ["X-A", "1"],\n    ["X-A", "2"]\n  ]',
    );
  });

  it("accepts ignored transport flags and rejects unsupported options", () => {
    expect(
      parseCurlCommand(
        "curl -s -S -L -k -v --silent --show-error --location --insecure --compressed --fail https://example.test",
      ),
    ).toMatchObject({ ok: true });
    expect(parseCurlCommand("curl -o payload.txt https://example.test")).toEqual(
      exactError("UNSUPPORTED_OPTION", "-o is not supported by this local converter."),
    );
  });

  it("reports exact missing option values and invalid headers", () => {
    const vectors = [
      ["curl -X", "-X needs an HTTP method."],
      ["curl --request", "--request needs an HTTP method."],
      ["curl -H", "-H needs a header."],
      ["curl -d", "-d needs a request body."],
      ["curl -u", "-u needs credentials."],
      ["curl --url", "--url needs a URL."],
    ] as const;
    for (const [source, message] of vectors) {
      expect(parseCurlCommand(source)).toEqual(exactError("MISSING_OPTION_VALUE", message));
    }
    for (const header of ["missing-colon", ": value", "   : value"]) {
      expect(parseCurlCommand(`curl -H '${header}' https://example.test`)).toEqual(
        exactError("INVALID_HEADER", "Each header must have a name and value."),
      );
    }
  });

  it("rejects every file-backed body spelling", () => {
    for (const option of ["-d", "--data", "--data-raw", "--data-binary"]) {
      expect(parseCurlCommand(`curl ${option} @body.json https://example.test`)).toEqual(
        exactError(
          "UNSUPPORTED_FILE_BODY",
          "File-backed request bodies cannot be converted because the local file is not available here.",
        ),
      );
    }
  });

  it("rejects duplicate URL declarations instead of overwriting", () => {
    expect(parseCurlCommand("curl https://one.test --url https://two.test")).toEqual(
      exactError("UNEXPECTED_ARGUMENT", "Unexpected argument: https://two.test"),
    );
    expect(parseCurlCommand("curl --url https://one.test --url https://two.test")).toEqual(
      exactError("UNEXPECTED_ARGUMENT", "Unexpected argument: https://two.test"),
    );
    expect(parseCurlCommand("curl --url https://one.test https://two.test")).toEqual(
      exactError("UNEXPECTED_ARGUMENT", "Unexpected argument: https://two.test"),
    );
  });

  it("distinguishes missing, invalid, and unsupported URLs", () => {
    expect(parseCurlCommand("curl")).toEqual(
      exactError("MISSING_URL", "Include a request URL in the cURL command."),
    );
    expect(parseCurlCommand("curl relative/path")).toEqual(
      exactError("INVALID_URL", "Enter an absolute http or https request URL."),
    );
    expect(parseCurlCommand("curl file:///tmp/x")).toEqual(
      exactError("UNSUPPORTED_URL", "Only absolute http and https URLs can be converted to Fetch."),
    );
  });

  it("handles quoting, escaping, continuations, and quote failures", () => {
    expect(parseCurlCommand('curl "https://example.test/a b"')).toMatchObject({
      ok: true,
      value: { url: "https://example.test/a b" },
    });
    expect(
      parseCurlCommand("curl https://example.test \\\n -H 'Accept: application/json'"),
    ).toMatchObject({
      ok: true,
      value: { headers: [{ name: "Accept", value: "application/json" }] },
    });
    expect(parseCurlCommand("curl 'https://example.test")).toEqual(
      exactError("UNTERMINATED_QUOTE", "Close every quote in the cURL command."),
    );
    expect(parseCurlCommand("curl https://example.test\\")).toEqual(
      exactError("UNTERMINATED_QUOTE", "Close every quote in the cURL command."),
    );
  });

  it("uses UTF-8 Basic auth including lone-surrogate replacement", () => {
    expect(parseCurlCommand("curl -u '\ud800:x' https://example.test")).toMatchObject({
      ok: true,
      value: { headers: [{ name: "Authorization", value: "Basic 77+9Ong=" }] },
    });
  });

  it("JSON-escapes all user-derived values and is deterministic", () => {
    const parsed = parseCurlCommand(
      `curl -X weird -H 'X-Quote: a"b' -d 'line\\nvalue' 'https://example.test/a?x="y"'`,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const first = formatFetchRequest(parsed.value);
    expect(first).toBe(formatFetchRequest(parsed.value));
    expect(first).toContain('method: "WEIRD"');
    expect(first).toContain('["X-Quote", "a\\"b"]');
    expect(first).toContain("if (!response.ok)");
    expect(first).toContain("await response.text()");
  });

  it("counts exactly 100,000 UTF-16 code units including astral characters", () => {
    const prefix = "curl https://example.test/#";
    expect(
      parseCurlCommand(prefix + "x".repeat(CURL_CONVERTER_MAX_INPUT_CHARS - prefix.length)).ok,
    ).toBe(true);
    expect(
      parseCurlCommand(prefix + "x".repeat(CURL_CONVERTER_MAX_INPUT_CHARS - prefix.length + 1)),
    ).toEqual(exactError("INPUT_TOO_LARGE", "The cURL command exceeds the allowed size."));
    const astral = "😀";
    const remaining = CURL_CONVERTER_MAX_INPUT_CHARS - prefix.length;
    const astralBoundary =
      prefix + astral.repeat(Math.floor(remaining / 2)) + "x".repeat(remaining % 2);
    expect(astralBoundary.length).toBe(CURL_CONVERTER_MAX_INPUT_CHARS);
    expect(parseCurlCommand(astralBoundary).ok).toBe(true);
    expect(parseCurlCommand(`${astralBoundary}x`)).toEqual(
      exactError("INPUT_TOO_LARGE", "The cURL command exceeds the allowed size."),
    );
  });

  it("counts the final token at the exact 1,000/1,001 boundary", () => {
    const valid = [
      "curl",
      "https://example.test",
      ...Array(CURL_CONVERTER_MAX_TOKENS - 2).fill("-s"),
    ];
    expect(valid).toHaveLength(CURL_CONVERTER_MAX_TOKENS);
    expect(parseCurlCommand(valid.join(" ")).ok).toBe(true);
    expect(parseCurlCommand([...valid, "-s"].join(" "))).toEqual(
      exactError("TOO_MANY_TOKENS", "The cURL command has too many arguments."),
    );
  });

  it("suppresses bodies for explicit GET and HEAD output", () => {
    for (const method of ["GET", "HEAD"]) {
      const parsed = parseCurlCommand(`curl -X ${method} -d x=1 https://example.test`);
      if (!parsed.ok) throw new Error(parsed.error.message);
      expect(formatFetchRequest(parsed.value)).not.toContain("body:");
    }
  });

  it("parses plain fetch() calls into GET requests", () => {
    expect(parseFetchSource('fetch("https://example.test")')).toEqual({
      ok: true,
      value: { url: "https://example.test", method: "GET", headers: [], body: null },
    });
    expect(parseFetchSource("await fetch('https://example.test')").ok).toBe(true);
    expect(parseFetchSource("const r = fetch(`https://example.test`);").ok).toBe(true);
  });

  it("parses fetch() init objects with method, headers, and body", () => {
    expect(
      parseFetchSource(
        "fetch('https://example.test/v1/users', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', 'X-Trace': 'abc' },\n  body: '{\"name\":\"Ada\"}',\n});",
      ),
    ).toEqual({
      ok: true,
      value: {
        url: "https://example.test/v1/users",
        method: "POST",
        headers: [
          { name: "Content-Type", value: "application/json" },
          { name: "X-Trace", value: "abc" },
        ],
        body: '{"name":"Ada"}',
      },
    });
    expect(parseFetchSource('fetch("https://example.test", { method: "get" })').ok).toBe(true);
  });

  it("rejects non-fetch, relative, interpolated, and unbalanced input", () => {
    expect(parseFetchSource("hello()")).toEqual(
      exactError("INVALID_COMMAND", "Start with a fetch() call."),
    );
    expect(parseFetchSource('myfetch("https://example.test")')).toEqual(
      exactError("INVALID_COMMAND", "Start with a fetch() call."),
    );
    expect(parseFetchSource('fetch("/relative")')).toEqual(
      exactError("INVALID_URL", "Enter an absolute http or https request URL."),
    );
    expect(parseFetchSource("fetch(`https://x/${id}`)")).toEqual(
      exactError(
        "UNSUPPORTED_SYNTAX",
        "Template literal interpolation is not converted; use a plain string URL.",
      ),
    );
    expect(parseFetchSource('fetch("https://example.test"')).toEqual(
      exactError("UNSUPPORTED_SYNTAX", "Close every parenthesis in the Fetch call."),
    );
    expect(parseFetchSource("fetch('https://example.test)")).toEqual(
      exactError("UNTERMINATED_QUOTE", "Close every quote in the Fetch call."),
    );
    expect(parseFetchSource('fetch("https://example.test", { mode: "cors" })')).toEqual(
      exactError("UNSUPPORTED_SYNTAX", "The mode option is not converted."),
    );
    expect(parseFetchSource('fetch("https://example.test", { headers: { A: 1 } })')).toEqual(
      exactError("INVALID_HEADER", "Header values must be quoted strings."),
    );
  });

  it("formats requests back to portable curl commands", () => {
    const parsed = parseCurlCommand(
      "curl -X POST 'https://example.test/v1/users' -H 'Content-Type: application/json' -d '{\"name\":\"Ada\"}'",
    );
    if (!parsed.ok) throw new Error(parsed.error.message);
    expect(formatCurlCommand(parsed.value)).toBe(
      "curl 'https://example.test/v1/users' \\\n  -X POST \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\":\"Ada\"}'",
    );
    const plain = parseCurlCommand("curl https://example.test");
    if (!plain.ok) throw new Error(plain.error.message);
    expect(formatCurlCommand(plain.value)).toBe("curl 'https://example.test'");
  });

  it("round-trips fetch and curl conversions", () => {
    const fetchSource =
      "fetch('https://example.test/api', {\n  method: 'PUT',\n  headers: { 'X-A': \"1\" },\n  body: 'a=1&b=2',\n});";
    const fetched = parseFetchSource(fetchSource);
    if (!fetched.ok) throw new Error(fetched.error.message);
    const curl = formatCurlCommand(fetched.value);
    const reParsed = parseCurlCommand(curl);
    if (!reParsed.ok) throw new Error(reParsed.error.message);
    expect(reParsed.value).toEqual(fetched.value);
    expect(formatFetchRequest(reParsed.value)).toContain("fetch(");
  });

  it("quotes single quotes inside curl output", () => {
    const parsed = parseFetchSource("fetch('https://example.test', { body: \"it's here\" })");
    if (!parsed.ok) throw new Error(parsed.error.message);
    const curl = formatCurlCommand(parsed.value);
    expect(curl).toContain("-d 'it'\\''s here'");
    expect(parseCurlCommand(curl).ok).toBe(true);
  });
});
