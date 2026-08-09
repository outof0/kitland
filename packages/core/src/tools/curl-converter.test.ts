import { describe, expect, it } from "vitest";
import { formatFetchRequest, parseCurlCommand } from "./curl-converter";

describe("cURL converter", () => {
  it("converts a JSON POST command into a local fetch representation", () => {
    const result = parseCurlCommand(
      `curl -X POST 'https://api.example.test/users' -H 'Content-Type: application/json' -d '{"name":"Ada"}'`,
    );
    expect(result).toEqual({
      ok: true,
      value: {
        url: "https://api.example.test/users",
        method: "POST",
        headers: [{ name: "Content-Type", value: "application/json" }],
        body: '{"name":"Ada"}',
      },
    });
    if (!result.ok) return;
    expect(formatFetchRequest(result.value)).toContain('body: "{\\"name\\":\\"Ada\\"}"');
  });

  it("infers a GET request and preserves quoted URLs", () => {
    expect(parseCurlCommand(`curl "https://kitland.dev/tools?q=hello world"`)).toEqual({
      ok: true,
      value: {
        url: "https://kitland.dev/tools?q=hello world",
        method: "GET",
        headers: [],
        body: null,
      },
    });
  });

  it("turns --get data into a query string", () => {
    expect(parseCurlCommand("curl -G https://example.test/search -d 'q=kitland'")).toMatchObject({
      ok: true,
      value: { url: "https://example.test/search?q=kitland", method: "GET", body: null },
    });
  });

  it("accepts shell line continuations but rejects unreadable file bodies", () => {
    expect(
      parseCurlCommand(
        ["curl https://example.test \\", "  -H 'Accept: application/json'"].join("\n"),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        url: "https://example.test",
        headers: [{ name: "Accept", value: "application/json" }],
      },
    });
    expect(parseCurlCommand("curl https://example.test --data-binary @body.json")).toMatchObject({
      ok: false,
      error: { code: "UNSUPPORTED_FILE_BODY" },
    });
  });

  it("reports malformed and unsupported commands", () => {
    expect(parseCurlCommand("wget https://example.test")).toMatchObject({
      ok: false,
      error: { code: "INVALID_COMMAND" },
    });
    expect(parseCurlCommand("curl -o payload.txt https://example.test")).toMatchObject({
      ok: false,
      error: { code: "UNSUPPORTED_OPTION" },
    });
  });
});
