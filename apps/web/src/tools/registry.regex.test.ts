import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(new URL("./registry.tsx", import.meta.url)),
  "utf8",
);

/**
 * The shared RegexTesterTool runs user patterns on the UI thread by default.
 * The web host must inject the worker-backed hook instead so a catastrophic
 * pattern cannot freeze the page.
 */
describe("web tool registry regex entry", () => {
  it("runs the regex tester in a worker-backed hook, not the UI-thread hook", () => {
    expect(source).toContain("@/hooks/useRegexTester");
    expect(source).not.toContain("useInspectHooks");
    expect(source).not.toContain("@kitland/ui/hooks/useInspectHooks");
  });
});
