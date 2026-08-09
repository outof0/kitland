import { describe, expect, it } from "vitest";
import { isTransformRequest, isTransformResponse } from "../src/tools/base64/worker-protocol";

describe("worker protocol guards", () => {
  it("accepts a bounded transform request shape", () => {
    expect(
      isTransformRequest({
        type: "transform",
        id: 1,
        mode: "encode",
        format: "standard",
        input: "hello",
      }),
    ).toBe(true);
  });

  it("rejects malformed requests", () => {
    expect(isTransformRequest({ type: "transform", id: 0, mode: "encode", input: "x" })).toBe(
      false,
    );
    expect(
      isTransformRequest({
        type: "transform",
        id: 1,
        mode: "unknown",
        format: "standard",
        input: "x",
      }),
    ).toBe(false);
  });

  it("validates both success and error responses", () => {
    expect(
      isTransformResponse({
        type: "result",
        id: 2,
        result: { ok: true, value: "aGk=" },
        outputByteLength: 4,
      }),
    ).toBe(true);
    expect(
      isTransformResponse({
        type: "result",
        id: 2,
        result: { ok: false, error: { code: "INVALID_BASE64", message: "Invalid" } },
        outputByteLength: 0,
      }),
    ).toBe(true);
    expect(
      isTransformResponse({
        type: "result",
        id: 2,
        result: { ok: true, value: "x" },
        outputByteLength: -1,
      }),
    ).toBe(false);
  });
});
