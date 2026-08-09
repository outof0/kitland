/**
 * KIT-0006 batch certification: shipped entry points for Web transform batch A.
 * These tests drive real core exports only — no re-implementations.
 */
import { describe, expect, it } from "vitest";
import { formatJson, BEAUTIFY_MINIFY_MAX_INPUT_CHARS } from "./beautify-minify";
import { runBase64, BASE64_MAX_INPUT_CHARS } from "./base64";
import {
  runHexTextTransform,
  HEX_TEXT_MAX_INPUT_CHARS,
  encodeHexText,
  decodeHexText,
} from "./hex-text";
import {
  runHtmlEntityTransform,
  HTML_ENTITIES_MAX_INPUT_CHARS,
  encodeHtmlEntities,
} from "./html-entities";
import { jsonToYaml, JSON_TO_YAML_MAX_INPUT_CHARS } from "./json-to-yaml";
import { yamlToJson } from "./yaml-to-json";
import { YAML_CODEC_MAX_INPUT_CHARS } from "./yaml-codec";

const BATCH = [
  "base64",
  "beautify-minify",
  "json-to-yaml",
  "yaml-to-json",
  "html-entities",
  "hex-text",
] as const;

describe("KIT-0006 core certification batch", () => {
  it("covers exactly the six declared batch slugs", () => {
    expect(BATCH).toEqual([
      "base64",
      "beautify-minify",
      "json-to-yaml",
      "yaml-to-json",
      "html-entities",
      "hex-text",
    ]);
  });

  it("base64: valid Unicode round-trip and oversize failure on runBase64", () => {
    const encoded = runBase64("encode", "café 🍵", { urlSafe: false });
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    const decoded = runBase64("decode", encoded.value, { urlSafe: false });
    expect(decoded).toEqual({ ok: true, value: "café 🍵" });
    expect(runBase64("encode", "x".repeat(BASE64_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });

  it("beautify-minify: valid, empty, malformed, and oversize on formatJson", () => {
    expect(formatJson('{"a":1}', "beautify", { indent: 2 })).toEqual({
      ok: true,
      value: '{\n  "a": 1\n}',
    });
    expect(formatJson("", "beautify")).toMatchObject({ ok: false, error: { code: "EMPTY_INPUT" } });
    expect(formatJson("{", "minify")).toMatchObject({ ok: false, error: { code: "INVALID_JSON" } });
    expect(formatJson("0".repeat(BEAUTIFY_MINIFY_MAX_INPUT_CHARS + 1), "beautify")).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });

  it("json-to-yaml: valid Unicode, empty, malformed, oversize on jsonToYaml", () => {
    const yaml = jsonToYaml('{"title":"café"}');
    expect(yaml.ok).toBe(true);
    if (!yaml.ok) return;
    expect(yaml.value).toContain("café");
    expect(jsonToYaml("")).toMatchObject({ ok: false, error: { code: "EMPTY_INPUT" } });
    expect(jsonToYaml("{")).toMatchObject({ ok: false, error: { code: "INVALID_JSON" } });
    expect(jsonToYaml("0".repeat(JSON_TO_YAML_MAX_INPUT_CHARS + 1))).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });

  it("yaml-to-json: valid, empty, malformed, oversize on yamlToJson", () => {
    expect(yamlToJson("name: Widget\n")).toEqual({
      ok: true,
      value: '{\n  "name": "Widget"\n}',
    });
    expect(yamlToJson("")).toMatchObject({ ok: false, error: { code: "EMPTY_INPUT" } });
    expect(yamlToJson("name: one\nname: two")).toMatchObject({
      ok: false,
      error: { code: "INVALID_YAML" },
    });
    expect(yamlToJson("a".repeat(YAML_CODEC_MAX_INPUT_CHARS + 1))).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });

  it("html-entities: valid encode/decode, oversize on runHtmlEntityTransform", () => {
    const encoded = runHtmlEntityTransform("encode", `<a href="x">1 & 2</a>`, { format: "named" });
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(runHtmlEntityTransform("decode", encoded.value)).toEqual({
      ok: true,
      value: `<a href="x">1 & 2</a>`,
    });
    expect(encodeHtmlEntities("x".repeat(HTML_ENTITIES_MAX_INPUT_CHARS + 1))).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
  });

  it("hex-text: valid UTF-8 encode/decode and oversize on runHexTextTransform", () => {
    const encoded = encodeHexText("Hi 🍵");
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(decodeHexText(encoded.value)).toEqual({ ok: true, value: "Hi 🍵" });
    expect(runHexTextTransform("encode", "x".repeat(HEX_TEXT_MAX_INPUT_CHARS + 1))).toMatchObject({
      ok: false,
      error: { code: "INPUT_TOO_LARGE" },
    });
    expect(runHexTextTransform("decode", "gg").ok).toBe(false);
  });
});
