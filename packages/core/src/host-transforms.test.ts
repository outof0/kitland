import { describe, expect, it } from "vitest";
import { createWebCryptoHostRuntime } from "./host-runtime";
import { getHostTransformSpec, HOST_TRANSFORM_SLUGS } from "./host-transforms";

const runtime = createWebCryptoHostRuntime(globalThis.crypto);

describe("host transforms", () => {
  it("covers pure transforms plus remaining suite tools with unique slugs", () => {
    expect(new Set(HOST_TRANSFORM_SLUGS).size).toBe(HOST_TRANSFORM_SLUGS.length);
    // 65 tools total minus specialty base64/curl/json-toolbox.
    expect(HOST_TRANSFORM_SLUGS.length).toBe(62);
    for (const slug of [
      "beautify-minify",
      "url-encode",
      "uuid-id",
      "json-diff",
      "text-stats",
      "sha-hash",
    ]) {
      expect(getHostTransformSpec(slug)).toBeDefined();
    }
  });

  it("beautify, case convert, uuid, and json-diff via specs", async () => {
    const beautify = getHostTransformSpec("beautify-minify");
    const beautifyResult = await beautify!.transform(
      { operationId: "beautify", optionId: "2", input: '{"a":1}' },
      runtime,
    );
    expect(beautifyResult.ok).toBe(true);

    const cases = getHostTransformSpec("case-converter");
    const caseResult = await cases!.transform(
      { operationId: "convert", optionId: "snake", input: "HelloWorld" },
      runtime,
    );
    expect(caseResult).toEqual({ ok: true, value: "hello_world" });

    const uuid = getHostTransformSpec("uuid-id");
    const uuidResult = await uuid!.transform(
      { operationId: "generate", optionId: "v4", input: "" },
      runtime,
    );
    expect(uuidResult.ok).toBe(true);

    const diff = getHostTransformSpec("json-diff");
    const diffResult = await diff!.transform(
      {
        operationId: "run",
        optionId: "default",
        input: '{"a":1}',
        secondaryInput: '{"a":2}',
      },
      runtime,
    );
    expect(diffResult.ok).toBe(true);
  });
});
