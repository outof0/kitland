/**
 * KIT-0007–0014 certification: real core entry points for shipping tools.
 */
import { describe, expect, it } from "vitest";
import { convertCase, CASE_CONVERTER_MAX_INPUT_CHARS } from "./case-converter";
import { sortLines, SORT_LINES_MAX_INPUT_CHARS } from "./sort-lines";
import { dedupeLines, DEDUPE_LINES_MAX_INPUT_CHARS } from "./dedupe-lines";
import { reverseText, TEXT_REVERSER_MAX_INPUT_CHARS } from "./text-reverser";
import { runUnicodeConverter, UNICODE_CONVERTER_MAX_INPUT_CHARS } from "./unicode-converter";
import { runBinaryTextTransform, BINARY_TEXT_MAX_INPUT_CHARS } from "./binary-text";
import { jsonToCsv, JSON_TO_CSV_MAX_INPUT_CHARS } from "./json-to-csv";
import { jsonToToml, JSON_TO_TOML_MAX_INPUT_CHARS } from "./json-to-toml";
import { formatXml, XML_FORMATTER_MAX_INPUT_CHARS } from "./xml-formatter";
import { formatSql, SQL_FORMATTER_MAX_INPUT_CHARS } from "./sql-formatter";
import { runRot13Caesar, ROT13_CAESAR_MAX_INPUT_CHARS } from "./rot13-caesar";
import { parseCurlCommand, CURL_CONVERTER_MAX_INPUT_CHARS } from "./curl-converter";
import { inspectJson, JSON_FORMATTER_MAX_INPUT_CHARS } from "./json-formatter";
import { generateLoremIpsum } from "./lorem-ipsum";
import { generateRandomPorts } from "./random-port";
import { generateRandomNumbers } from "./random-number";
import { diffJson } from "./json-diff";
import { renderMarkdown } from "./markdown-preview";
import { getTextStats } from "./text-stats";
import { diffText } from "./text-diff";
import { testRegex } from "./regex-tester";
import { generateUuidV4 } from "./uuid-id";
import { runUrlTransform, URL_TRANSFORM_MAX_INPUT_CHARS } from "./url-encode";
import { runJsonEscape, JSON_ESCAPE_MAX_INPUT_CHARS } from "./json-escape";
import { parseUnixTimestamp } from "./unix-timestamp";
import { hashSha256 } from "./sha-hash";
import { signHmacSha256 } from "./hmac-generator";
import { parseUrl } from "./url-parser";
import { findHttpStatuses } from "./http-status-codes";
import { lookupMimeTypes } from "./mime-types";
import { parseUserAgent } from "./user-agent-parser";
import { parseCronExpression } from "./cron-parser";
import { calculateIpv4Subnet } from "./ip-subnet-calculator";
import { generatePassword } from "./password-generator";
import { generateNanoid, NANOID_DEFAULT_ALPHABET } from "./nanoid-generator";
import { generateUlid } from "./ulid-generator";
import { generateObjectId } from "./objectid-generator";
import { generateMockData } from "./mock-data";

const fill = (n: number) => new Uint8Array(n).fill(7);
const rand32 = () => 0x12345678;

describe("KIT-0007 transform batch B", () => {
  it("case/sort/dedupe/reverse/unicode/binary have valid and oversize paths", () => {
    expect(convertCase("HelloWorld", "snake")).toEqual({ ok: true, value: "hello_world" });
    expect(convertCase("x".repeat(CASE_CONVERTER_MAX_INPUT_CHARS + 1), "snake").ok).toBe(false);
    expect(sortLines("b\na\n").ok).toBe(true);
    expect(sortLines("x".repeat(SORT_LINES_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(dedupeLines("a\na\nb\n").ok).toBe(true);
    expect(dedupeLines("x".repeat(DEDUPE_LINES_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(reverseText("ab").ok).toBe(true);
    expect(reverseText("x".repeat(TEXT_REVERSER_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(runUnicodeConverter("encode", "A").ok).toBe(true);
    expect(
      runUnicodeConverter("encode", "x".repeat(UNICODE_CONVERTER_MAX_INPUT_CHARS + 1)).ok,
    ).toBe(false);
    expect(runBinaryTextTransform("encode", "Hi").ok).toBe(true);
    expect(runBinaryTextTransform("encode", "x".repeat(BINARY_TEXT_MAX_INPUT_CHARS + 1)).ok).toBe(
      false,
    );
  });
});

describe("KIT-0008 structured + generators", () => {
  it("json formatters and generators respond", () => {
    expect(inspectJson('{"a":1}', 2, "beautify").ok).toBe(true);
    expect(inspectJson("{", 2, "beautify").ok).toBe(false);
    expect(inspectJson("x".repeat(JSON_FORMATTER_MAX_INPUT_CHARS + 1), 2, "beautify").ok).toBe(
      false,
    );
    expect(jsonToCsv('[{"a":1}]').ok).toBe(true);
    expect(jsonToCsv("x".repeat(JSON_TO_CSV_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(jsonToToml('{"a":1}').ok).toBe(true);
    expect(jsonToToml("x".repeat(JSON_TO_TOML_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(formatXml("<a/>").ok).toBe(true);
    expect(formatXml("x".repeat(XML_FORMATTER_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(generateLoremIpsum({ amount: 1, unit: "words" }).ok).toBe(true);
    expect(generateRandomPorts({ range: "dynamic", protocol: "tcp", count: 1 }, rand32).ok).toBe(
      true,
    );
    expect(generateRandomNumbers({ from: 1, to: 3, decimals: 0, count: 1 }, rand32).ok).toBe(true);
  });
});

describe("KIT-0009 specialists", () => {
  it("sql/rot13/curl have valid and limit paths", () => {
    expect(formatSql("select 1").ok).toBe(true);
    expect(formatSql("x".repeat(SQL_FORMATTER_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(runRot13Caesar("encode", "ab").ok).toBe(true);
    expect(runRot13Caesar("encode", "x".repeat(ROT13_CAESAR_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(parseCurlCommand("curl https://example.com").ok).toBe(true);
    expect(parseCurlCommand("x".repeat(CURL_CONVERTER_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });
});

describe("KIT-0010 inspectors and diff", () => {
  it("diff/markdown/stats/regex entry points work", () => {
    expect(diffJson("{}", '{"a":1}').ok).toBe(true);
    expect(renderMarkdown("# Hi").ok).toBe(true);
    expect(getTextStats("hello").ok).toBe(true);
    expect(diffText("a", "b").ok).toBe(true);
    expect(testRegex("a+", "aaa").ok).toBe(true);
  });
});

describe("KIT-0011 encoding and identifiers", () => {
  it("uuid/url/json-escape/timestamp work", () => {
    expect(generateUuidV4(() => fill(16)).ok).toBe(true);
    expect(runUrlTransform("encode", "a b").ok).toBe(true);
    expect(runUrlTransform("encode", "x".repeat(URL_TRANSFORM_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(runJsonEscape("encode", "hi").ok).toBe(true);
    expect(runJsonEscape("encode", "x".repeat(JSON_ESCAPE_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    // mode alias: encode maps to escapeJson
    expect(parseUnixTimestamp("0").ok).toBe(true);
  });
});

describe("KIT-0012 crypto (local)", () => {
  it("hash and hmac run with injected primitives", async () => {
    const digest = async () => fill(32);
    const sha = await hashSha256("abc", digest, { encoding: "hex" });
    expect(sha.ok).toBe(true);
    const signer = async () => fill(32);
    const hmac = await signHmacSha256("secret", "msg", signer);
    expect(hmac.ok).toBe(true);
  });
});

describe("KIT-0013 network/schedule inspectors", () => {
  it("url/status/mime/ua/cron/ip stay local", () => {
    expect(parseUrl("https://kitland.dev/path").ok).toBe(true);
    expect(findHttpStatuses("404").length).toBeGreaterThan(0);
    expect(lookupMimeTypes("json").ok).toBe(true);
    expect(parseUserAgent("Mozilla/5.0 (Macintosh) Chrome/120.0.0.0").ok).toBe(true);
    expect(parseCronExpression("0 * * * *").ok).toBe(true);
    expect(calculateIpv4Subnet("192.168.0.1/24").ok).toBe(true);
  });
});

describe("KIT-0014 generators", () => {
  it("password/nanoid/ulid/objectid/mock generate", () => {
    expect(
      generatePassword(
        {
          length: 12,
          lowercase: true,
          uppercase: true,
          numbers: true,
          symbols: false,
          excludeAmbiguous: true,
        },
        fill,
      ).ok,
    ).toBe(true);
    expect(generateNanoid({ length: 10, alphabet: NANOID_DEFAULT_ALPHABET }, fill).ok).toBe(true);
    expect(generateUlid(0, fill).ok).toBe(true);
    expect(generateObjectId(0, 1, fill).ok).toBe(true);
    expect(
      generateMockData(
        {
          count: 1,
          includeId: true,
          includeName: true,
          includeEmail: false,
          includeRole: false,
        },
        fill,
      ).ok,
    ).toBe(true);
  });
});
