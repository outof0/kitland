import { describe, expect, it } from "vitest";
import { CASE_CONVERTER_MAX_INPUT_CHARS, convertCase, type CaseFormat } from "./case-converter";

describe("convertCase", () => {
  it.each([
    ["camel", "helloWorldExample"],
    ["pascal", "HelloWorldExample"],
    ["snake", "hello_world_example"],
    ["kebab", "hello-world-example"],
    ["constant", "HELLO_WORLD_EXAMPLE"],
    ["title", "Hello World Example"],
    ["sentence", "Hello world example"],
  ] satisfies readonly [CaseFormat, string][])("converts words to %s", (format, expected) => {
    expect(convertCase("helloWorld_example", format)).toEqual({ ok: true, value: expected });
  });

  it("splits acronyms without breaking their following word", () => {
    expect(convertCase("parseXMLHttpRequest", "snake")).toEqual({
      ok: true,
      value: "parse_xml_http_request",
    });
  });

  it("keeps Unicode letters and combining marks intact", () => {
    expect(convertCase("déjàVu cafe\u0301", "kebab")).toEqual({
      ok: true,
      value: "déjà-vu-cafe\u0301",
    });
  });

  it("returns an empty result for separator-only text", () => {
    expect(convertCase(" -- __ \n ", "camel")).toEqual({ ok: true, value: "" });
  });

  it("rejects unsupported runtime formats", () => {
    expect(convertCase("hello", "unsupported" as CaseFormat)).toEqual({
      ok: false,
      error: { code: "INVALID_FORMAT", message: "Choose a supported case format." },
    });
  });

  it("rejects input over its host-neutral bound", () => {
    const result = convertCase("x".repeat(CASE_CONVERTER_MAX_INPUT_CHARS + 1), "snake");
    expect(result).toEqual({
      ok: false,
      error: {
        code: "INPUT_TOO_LARGE",
        message: `Text input exceeds ${CASE_CONVERTER_MAX_INPUT_CHARS.toLocaleString()} characters.`,
      },
    });
  });
});
