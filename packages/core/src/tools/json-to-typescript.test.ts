import { describe, expect, it } from "vitest";
import { jsonToTypescript, JSON_TO_TYPESCRIPT_MAX_INPUT_CHARS } from "./json-to-typescript";

describe("jsonToTypescript", () => {
  it("emits an object type", () => {
    const result = jsonToTypescript('{"name":"Ada","ok":true}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("name: string");
    expect(result.value).toContain("ok: boolean");
  });
  it("rejects empty and oversize", () => {
    expect(jsonToTypescript("").ok).toBe(false);
    expect(jsonToTypescript("x".repeat(JSON_TO_TYPESCRIPT_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });
  it("honors a 4-space indent", () => {
    const result = jsonToTypescript('{"user":{"id":1}}', "Root", 4);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("    user: {");
    expect(result.value).toContain("        id: number;");
  });
  it("rejects an invalid indent", () => {
    const result = jsonToTypescript("{}", "Root", 3 as 2 | 4);
    expect(result).toMatchObject({ ok: false, error: { code: "INVALID_INDENT" } });
  });
});
