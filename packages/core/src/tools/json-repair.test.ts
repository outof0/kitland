import { describe, expect, it } from "vitest";
import { repairJson } from "./json-repair";

describe("repairJson", () => {
  it("returns valid JSON unchanged", () => {
    expect(repairJson('{"a":1,"b":[true,null]}')).toBe('{"a":1,"b":[true,null]}');
    expect(repairJson('{\n  "a": 1\n}')).toBe('{\n  "a": 1\n}');
  });

  it("keeps apostrophes inside double-quoted strings", () => {
    const source = '{"msg":"it\'s fine"}';
    expect(repairJson(source)).toBe(source);
  });

  it("removes trailing commas in objects and arrays", () => {
    expect(repairJson('{"a":1,}')).toBe('{"a":1}');
    expect(repairJson("[1, 2, ]")).toBe("[1, 2]");
    expect(repairJson('{"a":1,\n}')).toBe('{"a":1}');
  });

  it("strips line and block comments", () => {
    expect(repairJson('{// line\n"a":1}')).toBe('{"a":1}');
    expect(repairJson('{/* block */"a":1}')).toBe('{"a":1}');
    expect(repairJson('{"a":"// not a comment"}')).toBe('{"a":"// not a comment"}');
  });

  it("converts single-quoted strings and unquoted keys", () => {
    expect(repairJson("{'a':'x'}")).toBe('{"a":"x"}');
    expect(repairJson('{a:"x"}')).toBe('{"a":"x"}');
    expect(repairJson("{name: 'dev', active: true}")).toBe('{"name": "dev", "active": true}');
  });

  it("combines repairs in one pass", () => {
    const source = "{name: 'dev', // whoami\n tags: ['a', 'b',], count: 3,}";
    const repaired = repairJson(source);
    expect(repaired).not.toBeNull();
    expect(JSON.parse(repaired as string)).toEqual({ name: "dev", tags: ["a", "b"], count: 3 });
  });

  it("returns null when the input cannot be repaired", () => {
    expect(repairJson('{"a": }')).toBeNull();
    expect(repairJson("not json at all")).toBeNull();
    expect(repairJson("")).toBeNull();
  });
});
