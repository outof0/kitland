import { describe, expect, it } from "vitest";
import { executeExposure } from "../src/contracts.ts";
import {
  kitlandBase64DecodeExposure,
  kitlandBase64EncodeExposure,
} from "../src/exposures/base64.ts";
import {
  kitlandAesDecryptExposure,
  kitlandAesEncryptExposure,
  kitlandHmacGenerateExposure,
  kitlandJwtDecodeExposure,
  kitlandPasswordGenerateExposure,
  kitlandRsaKeyPairExposure,
  kitlandShaHashExposure,
  kitlandTokenGenerateExposure,
} from "../src/exposures/crypto.ts";
import {
  kitlandAgeCalculateExposure,
  kitlandBasicAuthDecodeExposure,
  kitlandBasicAuthEncodeExposure,
  kitlandColorConvertExposure,
  kitlandCronParseExposure,
  kitlandCurlToFetchExposure,
  kitlandDataSizeConvertExposure,
  kitlandDateAddExposure,
  kitlandDateDiffExposure,
  kitlandDurationFormatExposure,
  kitlandHttpStatusLookupExposure,
  kitlandIpSubnetCalculateExposure,
  kitlandMimeTypeLookupExposure,
  kitlandNumberBaseConvertExposure,
  kitlandTemperatureConvertExposure,
  kitlandTimezoneConvertExposure,
  kitlandUnixTimestampParseExposure,
  kitlandUrlParseExposure,
  kitlandUserAgentParseExposure,
} from "../src/exposures/datetime-utility.ts";
import {
  kitlandBinaryTextDecodeExposure,
  kitlandBinaryTextEncodeExposure,
  kitlandHexTextDecodeExposure,
  kitlandHexTextEncodeExposure,
  kitlandHtmlEntitiesDecodeExposure,
  kitlandHtmlEntitiesEncodeExposure,
  kitlandMorseCodeDecodeExposure,
  kitlandMorseCodeEncodeExposure,
  kitlandRot13CaesarExposure,
  kitlandUnicodeDecodeExposure,
  kitlandUnicodeEncodeExposure,
  kitlandUrlDecodeExposure,
  kitlandUrlEncodeExposure,
} from "../src/exposures/encoding.ts";
import {
  kitlandLoremIpsumGenerateExposure,
  kitlandMockDataGenerateExposure,
  kitlandNanoidGenerateExposure,
  kitlandObjectIdGenerateExposure,
  kitlandQrCodeValidateExposure,
  kitlandRandomNumberGenerateExposure,
  kitlandRandomPortGenerateExposure,
  kitlandUlidGenerateExposure,
  kitlandUuidGenerateExposure,
} from "../src/exposures/generators.ts";
import {
  kitlandBeautifyCodeExposure,
  kitlandHtmlToJsxExposure,
  kitlandJsonDiffExposure,
  kitlandJsonEscapeExposure,
  kitlandJsonInspectExposure,
  kitlandJsonRepairExposure,
  kitlandJsonToCsvExposure,
  kitlandJsonToJsConstExposure,
  kitlandJsonToTomlExposure,
  kitlandJsonToTypescriptExposure,
  kitlandJsonToYamlExposure,
  kitlandJsonUnescapeExposure,
  kitlandMarkdownRenderExposure,
  kitlandMinifyCodeExposure,
  kitlandSqlFormatExposure,
  kitlandXmlFormatExposure,
  kitlandYamlToJsonExposure,
} from "../src/exposures/json-markup.ts";
import {
  kitlandCaseConvertExposure,
  kitlandDedupeLinesExposure,
  kitlandRegexTestExposure,
  kitlandSortLinesExposure,
  kitlandJoinLinesExposure,
  kitlandSplitToNewlinesExposure,
  kitlandTextDiffExposure,
  kitlandTextReverseExposure,
  kitlandTextStatsExposure,
} from "../src/exposures/text-regex.ts";

describe("Base64 Vector Parity", () => {
  it("encodes and decodes standard Base64", async () => {
    const enc = await executeExposure(kitlandBase64EncodeExposure, { input: "hello" });
    expect(enc.isError).toBeUndefined();
    expect(enc.structuredContent).toEqual({ output: "aGVsbG8=", format: "standard" });

    const dec = await executeExposure(kitlandBase64DecodeExposure, { input: "aGVsbG8=" });
    expect(dec.isError).toBeUndefined();
    expect(dec.structuredContent).toEqual({ output: "hello", format: "standard" });
  });

  it("handles URL-safe Base64 roundtrip", async () => {
    const enc = await executeExposure(kitlandBase64EncodeExposure, {
      input: "subjects?_d",
      urlSafe: true,
    });
    expect(enc.structuredContent).toEqual({ output: "c3ViamVjdHM_X2Q", format: "url-safe" });

    const dec = await executeExposure(kitlandBase64DecodeExposure, {
      input: "c3ViamVjdHM_X2Q",
      urlSafe: true,
    });
    expect(dec.structuredContent).toEqual({ output: "subjects?_d", format: "url-safe" });
  });
});

describe("Encoding Exposures Parity", () => {
  it("URL encode and decode", async () => {
    const enc = await executeExposure(kitlandUrlEncodeExposure, { input: "hello world & foo=bar" });
    expect(enc.structuredContent).toEqual({
      output: "hello%20world%20%26%20foo%3Dbar",
      scope: "component",
    });

    const dec = await executeExposure(kitlandUrlDecodeExposure, {
      input: "hello%20world%20%26%20foo%3Dbar",
    });
    expect(dec.structuredContent).toEqual({
      output: "hello world & foo=bar",
      scope: "component",
    });
  });

  it("HTML entities encode and decode", async () => {
    const enc = await executeExposure(kitlandHtmlEntitiesEncodeExposure, {
      input: '<script>alert("xss")</script>',
    });
    expect(enc.structuredContent).toEqual({
      output: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
      format: "named",
    });

    const dec = await executeExposure(kitlandHtmlEntitiesDecodeExposure, {
      input: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    });
    expect(dec.structuredContent).toEqual({ output: '<script>alert("xss")</script>' });
  });

  it("Hex text encode and decode", async () => {
    const enc = await executeExposure(kitlandHexTextEncodeExposure, { input: "Kitland" });
    expect(enc.structuredContent).toEqual({ output: "4b 69 74 6c 61 6e 64", format: "spaced" });

    const dec = await executeExposure(kitlandHexTextDecodeExposure, { input: "4b69746c616e64" });
    expect(dec.structuredContent).toEqual({ output: "Kitland" });
  });

  it("Unicode escape encode and decode", async () => {
    const enc = await executeExposure(kitlandUnicodeEncodeExposure, { input: "Kitland 🚀" });
    expect((enc.structuredContent as { output: string }).output).toContain("U+");

    const dec = await executeExposure(kitlandUnicodeDecodeExposure, {
      input: "U+004B U+0069 U+0074 U+006C U+0061 U+006E U+0064",
    });
    expect(dec.structuredContent).toEqual({ output: "Kitland" });
  });

  it("Binary text encode and decode", async () => {
    const enc = await executeExposure(kitlandBinaryTextEncodeExposure, { input: "ABC" });
    expect(enc.structuredContent).toEqual({ output: "01000001 01000010 01000011" });

    const dec = await executeExposure(kitlandBinaryTextDecodeExposure, {
      input: "01000001 01000010 01000011",
    });
    expect(dec.structuredContent).toEqual({ output: "ABC" });
  });

  it("ROT13 / Caesar cipher", async () => {
    const res = await executeExposure(kitlandRot13CaesarExposure, { input: "Hello World!" });
    expect(res.structuredContent).toEqual({ output: "Uryyb Jbeyq!", shift: 13 });
  });

  it("Morse code encode and decode", async () => {
    const enc = await executeExposure(kitlandMorseCodeEncodeExposure, { input: "SOS" });
    expect(enc.structuredContent).toEqual({ output: "... --- ..." });

    const dec = await executeExposure(kitlandMorseCodeDecodeExposure, { input: "... --- ..." });
    expect(dec.structuredContent).toEqual({ output: "SOS" });
  });
});

describe("JSON & Markup Exposures Parity", () => {
  it("beautify and minify code", async () => {
    const beau = await executeExposure(kitlandBeautifyCodeExposure, {
      input: '{"a":1,"b":2}',
      language: "json",
    });
    expect((beau.structuredContent as { output: string }).output).toBe('{\n  "a": 1,\n  "b": 2\n}');

    const mini = await executeExposure(kitlandMinifyCodeExposure, {
      input: '{\n  "a": 1,\n  "b": 2\n}',
      language: "json",
    });
    expect(mini.structuredContent).toEqual({
      output: '{"a":1,"b":2}',
      detectedLanguage: "json",
    });
  });

  it("JSON diff", async () => {
    const diff = await executeExposure(kitlandJsonDiffExposure, {
      original: '{"a":1,"b":2}',
      modified: '{"a":1,"b":3}',
    });
    expect(diff.isError).toBeUndefined();
    expect((diff.structuredContent as { summary: { total: number } }).summary.total).toBe(1);
  });

  it("JSON inspect and repair", async () => {
    const insp = await executeExposure(kitlandJsonInspectExposure, {
      input: '{"name": "Kitland", "count": 42}',
    });
    expect((insp.structuredContent as { rootType: string }).rootType).toBe("object");

    const rep = await executeExposure(kitlandJsonRepairExposure, {
      input: "{name: 'Kitland', count: 42,}",
    });
    expect(rep.isError).toBeUndefined();
    expect(JSON.parse((rep.structuredContent as { output: string }).output)).toEqual({
      name: "Kitland",
      count: 42,
    });
  });

  it("JSON / YAML conversions", async () => {
    const yml = await executeExposure(kitlandJsonToYamlExposure, { input: '{"hello":"world"}' });
    expect(yml.isError).toBeUndefined();
    expect((yml.structuredContent as { output: string }).output).toContain("hello");

    const json = await executeExposure(kitlandYamlToJsonExposure, { input: "hello: world" });
    expect(JSON.parse((json.structuredContent as { output: string }).output)).toEqual({
      hello: "world",
    });
  });

  it("JSON to CSV and TOML", async () => {
    const csv = await executeExposure(kitlandJsonToCsvExposure, {
      input: '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]',
    });
    expect((csv.structuredContent as { output: string }).output).toContain("id,name");

    const toml = await executeExposure(kitlandJsonToTomlExposure, {
      input: '{"title":"Test","count":10}',
    });
    expect((toml.structuredContent as { output: string }).output).toContain('"title" = "Test"');
  });

  it("XML and SQL format", async () => {
    const xml = await executeExposure(kitlandXmlFormatExposure, {
      input: "<root><child>value</child></root>",
    });
    expect((xml.structuredContent as { output: string }).output).toContain("<root>\n  <child>");

    const sql = await executeExposure(kitlandSqlFormatExposure, {
      input: "select id, name from users where active = 1",
    });
    expect((sql.structuredContent as { output: string }).output).toContain("SELECT");
  });

  it("Markdown render", async () => {
    const md = await executeExposure(kitlandMarkdownRenderExposure, {
      input: "# Title\n\nHello **world**",
    });
    expect((md.structuredContent as { html: string }).html).toContain("<h1>Title</h1>");
    expect((md.structuredContent as { html: string }).html).toContain("<strong>world</strong>");
  });

  it("JSON to TypeScript & JS Const", async () => {
    const ts = await executeExposure(kitlandJsonToTypescriptExposure, {
      input: '{"id":1,"name":"Alice"}',
      typeName: "User",
    });
    expect((ts.structuredContent as { output: string }).output).toContain("export type User =");

    const js = await executeExposure(kitlandJsonToJsConstExposure, {
      input: '{"id":1,"name":"Alice"}',
      name: "USER_DATA",
    });
    expect((js.structuredContent as { output: string }).output).toContain("const USER_DATA =");
  });

  it("HTML to JSX", async () => {
    const jsx = await executeExposure(kitlandHtmlToJsxExposure, {
      input: '<div class="card" onclick="alert(1)"><input type="text"></div>',
    });
    expect((jsx.structuredContent as { output: string }).output).toContain("className=");
    expect((jsx.structuredContent as { output: string }).output).toContain("<input");
  });

  it("JSON escape and unescape", async () => {
    const esc = await executeExposure(kitlandJsonEscapeExposure, { input: 'hello\n"world"' });
    expect((esc.structuredContent as { output: string }).output).toContain("hello");

    const unesc = await executeExposure(kitlandJsonUnescapeExposure, {
      input: '"hello\\n\\"world\\""',
    });
    expect(unesc.structuredContent).toEqual({ output: 'hello\n"world"' });
  });
});

describe("Crypto Exposures Parity", () => {
  it("SHA-256 hash", async () => {
    const res = await executeExposure(kitlandShaHashExposure, { input: "hello" });
    expect(res.structuredContent).toEqual({
      digest: "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      algorithm: "SHA-256",
      encoding: "hex",
    });
  });

  it("HMAC-SHA-256 generation", async () => {
    const res = await executeExposure(kitlandHmacGenerateExposure, {
      message: "hello",
      secret: "secret-key",
    });
    expect(res.structuredContent).toEqual({
      digest: "98e7ffb964bb5a3f902db1fc101a5baa98b6f2cd56858210c9d70f26ac762fc7",
      algorithm: "HMAC-SHA-256",
    });
  });

  it("AES-256-GCM encrypt and decrypt roundtrip", async () => {
    const keyHex = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    const plaintext = "Top secret kitland message 🔒";

    const enc = await executeExposure(kitlandAesEncryptExposure, { plaintext, keyHex });
    expect(enc.isError).toBeUndefined();
    const packet = (enc.structuredContent as { packet: string }).packet;

    const dec = await executeExposure(kitlandAesDecryptExposure, { packet, keyHex });
    expect(dec.isError).toBeUndefined();
    expect(dec.structuredContent).toEqual({ plaintext });
  });

  it("JWT decode", async () => {
    const sampleJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const res = await executeExposure(kitlandJwtDecodeExposure, { token: sampleJwt });
    expect(res.isError).toBeUndefined();
    expect((res.structuredContent as { payload: Record<string, unknown> }).payload.name).toBe(
      "John Doe",
    );
  });

  it("Token and Password generation", async () => {
    const tok = await executeExposure(kitlandTokenGenerateExposure, { length: 24, format: "hex" });
    expect((tok.structuredContent as { token: string }).token).toHaveLength(24);

    const pwd = await executeExposure(kitlandPasswordGenerateExposure, { length: 20 });
    expect((pwd.structuredContent as { password: string }).password).toHaveLength(20);
  });

  it("RSA Key Pair generation", async () => {
    const rsa = await executeExposure(kitlandRsaKeyPairExposure, { modulusLength: 2048 });
    expect(rsa.isError).toBeUndefined();
    expect((rsa.structuredContent as { publicKey: string }).publicKey).toContain(
      "BEGIN PUBLIC KEY",
    );
    expect((rsa.structuredContent as { privateKey: string }).privateKey).toContain(
      "BEGIN PRIVATE KEY",
    );
  });
});

describe("Generator Exposures Parity", () => {
  it("UUID, NanoID, ULID, ObjectID", async () => {
    const uuid = await executeExposure(kitlandUuidGenerateExposure, {});
    expect((uuid.structuredContent as { uuid: string }).uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );

    const nanoid = await executeExposure(kitlandNanoidGenerateExposure, { length: 16 });
    expect((nanoid.structuredContent as { id: string }).id).toHaveLength(16);

    const ulid = await executeExposure(kitlandUlidGenerateExposure, {});
    expect((ulid.structuredContent as { ulid: string }).ulid).toHaveLength(26);

    const objId = await executeExposure(kitlandObjectIdGenerateExposure, {});
    expect((objId.structuredContent as { id: string }).id).toMatch(/^[0-9a-f]{24}$/);
  });

  it("Mock Data, QR Code, Lorem Ipsum", async () => {
    const mock = await executeExposure(kitlandMockDataGenerateExposure, { count: 3 });
    expect((mock.structuredContent as { records: unknown[] }).records).toHaveLength(3);

    const qr = await executeExposure(kitlandQrCodeValidateExposure, {
      payload: "https://example.com",
    });
    expect((qr.structuredContent as { isValid: boolean }).isValid).toBe(true);

    const lorem = await executeExposure(kitlandLoremIpsumGenerateExposure, {
      amount: 2,
      unit: "paragraphs",
    });
    expect((lorem.structuredContent as { output: string }).output).toContain("Lorem ipsum");
  });

  it("Random Port and Random Number", async () => {
    const ports = await executeExposure(kitlandRandomPortGenerateExposure, { count: 3 });
    expect((ports.structuredContent as { ports: number[] }).ports).toHaveLength(3);

    const nums = await executeExposure(kitlandRandomNumberGenerateExposure, {
      from: 1,
      to: 10,
      count: 5,
    });
    expect((nums.structuredContent as { values: number[] }).values).toHaveLength(5);
  });
});

describe("Text & Regex Exposures Parity", () => {
  it("Case conversion", async () => {
    const res = await executeExposure(kitlandCaseConvertExposure, {
      input: "hello_world_text",
      targetCase: "pascal",
    });
    expect(res.structuredContent).toEqual({ output: "HelloWorldText", targetCase: "pascal" });
  });

  it("Sort and Dedupe lines", async () => {
    const sort = await executeExposure(kitlandSortLinesExposure, { input: "c\na\nb" });
    expect(sort.structuredContent).toEqual({ output: "a\nb\nc" });

    const dedupe = await executeExposure(kitlandDedupeLinesExposure, { input: "a\nb\na\nc" });
    expect(dedupe.structuredContent).toEqual({ output: "a\nb\nc" });
  });

  it("Text Reverse, Stats, and Diff", async () => {
    const rev = await executeExposure(kitlandTextReverseExposure, { input: "hello 🚀" });
    expect((rev.structuredContent as { output: string }).output).toBe("🚀 olleh");

    const stats = await executeExposure(kitlandTextStatsExposure, { input: "Hello world\nLine 2" });
    expect((stats.structuredContent as { lines: number }).lines).toBe(2);
    expect((stats.structuredContent as { words: number }).words).toBe(4);

    const diff = await executeExposure(kitlandTextDiffExposure, {
      original: "a\nb\nc",
      modified: "a\nx\nc",
    });
    expect((diff.structuredContent as { equal: boolean }).equal).toBe(false);
  });

  it("Regex test plus Split and Join Lines", async () => {
    const regex = await executeExposure(kitlandRegexTestExposure, {
      pattern: "\\d+",
      text: "abc 123 def 456",
    });
    expect((regex.structuredContent as { matches: unknown[] }).matches).toHaveLength(2);

    const split = await executeExposure(kitlandSplitToNewlinesExposure, {
      input: "apple, banana, orange",
      delimiter: "comma",
    });
    expect(split.structuredContent).toEqual({ output: "apple\nbanana\norange" });

    const joined = await executeExposure(kitlandJoinLinesExposure, {
      input: "apple\n banana\n\norange",
      delimiter: "pipe",
    });
    expect(joined.structuredContent).toEqual({ output: "apple | banana | orange" });
  });
});

describe("Datetime & Utility Exposures Parity", () => {
  it("Unix timestamp parse", async () => {
    const res = await executeExposure(kitlandUnixTimestampParseExposure, { input: "1700000000" });
    expect((res.structuredContent as { iso: string }).iso).toBe("2023-11-14T22:13:20.000Z");
  });

  it("Date diff and Date add", async () => {
    const diff = await executeExposure(kitlandDateDiffExposure, {
      fromDate: "2026-01-01",
      toDate: "2026-01-11",
    });
    expect((diff.structuredContent as { days: number }).days).toBe(10);

    const add = await executeExposure(kitlandDateAddExposure, { date: "2026-01-01", days: 10 });
    expect((add.structuredContent as { date: string }).date).toBe("2026-01-11");
  });

  it("Age calculate and Duration format", async () => {
    const age = await executeExposure(kitlandAgeCalculateExposure, {
      birthDate: "2000-01-01",
      referenceDate: "2026-01-01",
    });
    expect((age.structuredContent as { years: number }).years).toBe(26);

    const dur = await executeExposure(kitlandDurationFormatExposure, { seconds: 3665 });
    expect((dur.structuredContent as { formatted: string }).formatted).toBe("1h 1m 5s");
  });

  it("Timezone convert", async () => {
    const tz = await executeExposure(kitlandTimezoneConvertExposure, {
      datetime: "2026-08-20T12:00:00",
      sourceZone: "UTC",
      targetZone: "Asia/Tokyo",
    });
    expect((tz.structuredContent as { targetIso: string }).targetIso).toBe("2026-08-20T21:00:00");
  });

  it("Number Base, Temperature, Data Size, Color convert", async () => {
    const base = await executeExposure(kitlandNumberBaseConvertExposure, {
      input: "255",
      fromBase: 10,
      toBase: 16,
    });
    expect((base.structuredContent as { value: string }).value).toBe("FF");

    const temp = await executeExposure(kitlandTemperatureConvertExposure, {
      value: 100,
      fromUnit: "C",
    });
    expect((temp.structuredContent as { fahrenheit: number }).fahrenheit).toBe(212);

    const size = await executeExposure(kitlandDataSizeConvertExposure, {
      value: 1024,
      fromUnit: "MiB",
    });
    expect((size.structuredContent as { bytes: number }).bytes).toBe(1073741824);

    const col = await executeExposure(kitlandColorConvertExposure, { input: "#ff0000" });
    expect((col.structuredContent as { rgb: string }).rgb).toBe("rgb(255, 0, 0)");
  });

  it("URL parse, HTTP status, MIME type, User Agent", async () => {
    const url = await executeExposure(kitlandUrlParseExposure, {
      input: "https://api.example.com:8080/v1/users?active=true#section",
    });
    expect((url.structuredContent as { hostname: string }).hostname).toBe("api.example.com");

    const http = await executeExposure(kitlandHttpStatusLookupExposure, { query: "404" });
    expect(
      (http.structuredContent as { matches: unknown[] }).matches.length,
    ).toBeGreaterThanOrEqual(1);

    const mime = await executeExposure(kitlandMimeTypeLookupExposure, { query: "json" });
    expect((mime.structuredContent as { matches: unknown[] }).matches.length).toBeGreaterThan(0);

    const ua = await executeExposure(kitlandUserAgentParseExposure, {
      input:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    expect((ua.structuredContent as { browser: { name: string } }).browser.name).toBe("Chrome");
  });

  it("Basic Auth, cURL, Cron, and IP Subnet", async () => {
    const encAuth = await executeExposure(kitlandBasicAuthEncodeExposure, {
      username: "aladdin",
      password: "opensesame",
    });
    expect((encAuth.structuredContent as { header: string }).header).toBe(
      "Basic YWxhZGRpbjpvcGVuc2VzYW1l",
    );

    const decAuth = await executeExposure(kitlandBasicAuthDecodeExposure, {
      input: "Basic YWxhZGRpbjpvcGVuc2VzYW1l",
    });
    expect(decAuth.structuredContent).toEqual({ username: "aladdin", password: "opensesame" });

    const curl = await executeExposure(kitlandCurlToFetchExposure, {
      input: "curl https://api.example.com/users",
    });
    expect((curl.structuredContent as { output: string }).output).toContain(
      'fetch("https://api.example.com/users"',
    );

    const cron = await executeExposure(kitlandCronParseExposure, { expression: "*/15 * * * *" });
    expect((cron.structuredContent as { nextRuns: string[] }).nextRuns).toHaveLength(5);

    const subnet = await executeExposure(kitlandIpSubnetCalculateExposure, {
      input: "192.168.1.0/24",
    });
    expect((subnet.structuredContent as { subnetMask: string }).subnetMask).toBe("255.255.255.0");
    expect((subnet.structuredContent as { totalAddresses: string }).totalAddresses).toBe("256");
  });
});
