import { describe, expect, it } from "vitest";
import { createBase64ShareUrl, readBase64ShareState } from "./base64-share";
import { resolveLiveTransformOutput } from "./transform-output";

/**
 * KIT-0006 web pure-path certification for Share (Base64 only) and live
 * transform output recovery used by the shared shells in this batch.
 */
describe("KIT-0006 web pure-path certification", () => {
  it("Base64 share is fragment-only and strips query; restore rejects oversize", () => {
    const href = "https://kitland.dev/explore/base64?utm=leak";
    const url = createBase64ShareUrl(
      { mode: "encode", format: "standard", input: "certify" },
      href,
    );
    const parsed = new URL(url);
    expect(parsed.search).toBe("");
    expect(parsed.hash.startsWith("#base64?")).toBe(true);
    expect(readBase64ShareState(url)).toEqual({
      mode: "encode",
      format: "standard",
      input: "certify",
    });
    const huge = "x".repeat(20_000);
    expect(
      readBase64ShareState(
        `https://kitland.dev/explore/base64#base64?mode=encode&format=standard&input=${huge}`,
      ),
    ).toBe(null);
  });

  it("live transform output never keeps stale success while processing or invalid", () => {
    expect(resolveLiveTransformOutput("next", true, { ok: true, value: "previous" })).toMatchObject(
      { output: "", reason: "processing" },
    );
    expect(
      resolveLiveTransformOutput("bad", false, {
        ok: false,
        error: { code: "INVALID", message: "fix" },
      }),
    ).toMatchObject({ output: "", reason: "error" });
    expect(resolveLiveTransformOutput('{"a":1}', false, { ok: true, value: "out" })).toMatchObject({
      output: "out",
      reason: "success",
    });
  });
});
