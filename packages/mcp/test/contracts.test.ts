import { describe, expect, it } from "vitest";
import { executeExposure } from "../src/contracts.ts";
import {
  kitlandBase64DecodeExposure,
  kitlandBase64EncodeExposure,
} from "../src/exposures/base64.ts";

describe("executeExposure", () => {
  it("executes kitland_base64_encode successfully", async () => {
    const res = await executeExposure(kitlandBase64EncodeExposure, {
      input: "Hello World",
      urlSafe: false,
    });

    expect(res.isError).toBeUndefined();
    expect(res.structuredContent).toEqual({
      output: "SGVsbG8gV29ybGQ=",
      format: "standard",
    });
    expect(res.content).toHaveLength(1);
    expect(JSON.parse(res.content[0]!.text)).toEqual(res.structuredContent);
  });

  it("executes kitland_base64_encode in url-safe mode", async () => {
    const res = await executeExposure(kitlandBase64EncodeExposure, {
      input: "Hello?World+Testing",
      urlSafe: true,
    });

    expect(res.isError).toBeUndefined();
    expect(res.structuredContent).toEqual({
      output: "SGVsbG8_V29ybGQrVGVzdGluZw",
      format: "url-safe",
    });
  });

  it("executes kitland_base64_decode successfully", async () => {
    const res = await executeExposure(kitlandBase64DecodeExposure, {
      input: "SGVsbG8gV29ybGQ=",
    });

    expect(res.isError).toBeUndefined();
    expect(res.structuredContent).toEqual({
      output: "Hello World",
      format: "standard",
    });
  });

  it("returns INVALID_INPUT for non-canonical or malformed base64 input", async () => {
    const res = await executeExposure(kitlandBase64DecodeExposure, {
      input: "invalid!@#$%",
    });

    expect(res.isError).toBe(true);
    expect(res.structuredContent).toMatchObject({
      ok: false,
      error: {
        code: "INVALID_INPUT",
      },
    });
    expect(JSON.parse(res.content[0]!.text)).toEqual(res.structuredContent);
  });

  it("returns INVALID_INPUT when required schema properties are missing", async () => {
    const res = await executeExposure(kitlandBase64EncodeExposure, {});

    expect(res.isError).toBe(true);
    expect(res.structuredContent).toMatchObject({
      ok: false,
      error: {
        code: "INVALID_INPUT",
      },
    });
  });

  it("returns INVALID_INPUT when additional unknown properties are provided", async () => {
    const res = await executeExposure(kitlandBase64EncodeExposure, {
      input: "test",
      unknownProperty: 123,
    });

    expect(res.isError).toBe(true);
    expect(res.structuredContent).toMatchObject({
      ok: false,
      error: {
        code: "INVALID_INPUT",
      },
    });
  });

  it("returns INPUT_TOO_LARGE when argument exceeds maxInputUtf8Bytes", async () => {
    const customExposure = {
      ...kitlandBase64EncodeExposure,
      limits: {
        ...kitlandBase64EncodeExposure.limits,
        maxInputUtf8Bytes: 50,
      },
    };

    const res = await executeExposure(customExposure, {
      input: "This is a very long string that will definitely exceed the fifty byte input limit.",
    });

    expect(res.isError).toBe(true);
    expect(res.structuredContent).toMatchObject({
      ok: false,
      error: {
        code: "INPUT_TOO_LARGE",
      },
    });
  });

  it("returns DEADLINE_EXCEEDED when execution takes longer than timeoutMs", async () => {
    const timeoutExposure = {
      ...kitlandBase64EncodeExposure,
      limits: {
        ...kitlandBase64EncodeExposure.limits,
        timeoutMs: 10,
      },
      invoke: async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { ok: true as const, value: { output: "", format: "standard" as const } };
      },
    };

    const res = await executeExposure(timeoutExposure, { input: "test" });

    expect(res.isError).toBe(true);
    expect(res.structuredContent).toMatchObject({
      ok: false,
      error: {
        code: "DEADLINE_EXCEEDED",
      },
    });
  });
});
