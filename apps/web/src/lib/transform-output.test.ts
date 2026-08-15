import { describe, expect, it } from "vitest";
import { resolveLiveTransformOutput } from "./transform-output";

describe("resolveLiveTransformOutput", () => {
  it("keeps empty input authoritative with no output", () => {
    expect(resolveLiveTransformOutput("", false, { ok: true, value: "stale" })).toEqual({
      output: "",
      isAuthoritative: true,
      reason: "empty",
    });
  });

  it("clears the pane while processing so stale success is not current", () => {
    expect(
      resolveLiveTransformOutput("next", true, { ok: true, value: "previous-success" }),
    ).toEqual({
      output: "",
      isAuthoritative: false,
      reason: "processing",
    });
  });

  it("clears output on invalid results", () => {
    expect(
      resolveLiveTransformOutput("bad", false, {
        ok: false,
        error: { code: "INVALID", message: "fix me" },
      }),
    ).toEqual({
      output: "",
      isAuthoritative: true,
      reason: "error",
    });
  });

  it("returns the success value only when authoritative", () => {
    expect(resolveLiveTransformOutput('{"a":1}', false, { ok: true, value: "{\n  a\n}" })).toEqual({
      output: "{\n  a\n}",
      isAuthoritative: true,
      reason: "success",
    });
  });

  it("supports whitespace-as-empty for formatters that ignore blank paste", () => {
    expect(
      resolveLiveTransformOutput(
        "   ",
        false,
        { ok: true, value: "x" },
        { treatWhitespaceAsEmpty: true },
      ),
    ).toEqual({
      output: "",
      isAuthoritative: true,
      reason: "empty",
    });
  });
});
