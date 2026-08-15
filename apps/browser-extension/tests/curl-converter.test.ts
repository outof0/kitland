import { formatFetchRequest, parseCurlCommand } from "@kitland/core";
import { CurlConverterTool } from "@kitland/ui/tools/CurlConverterTool";
import { describe, expect, it } from "vitest";
import { getToolRegistration } from "../src/registry";

describe("cURL converter extension adapter contract", () => {
  it("mounts the shared @kitland/ui tool with no host-local markup", async () => {
    const registration = getToolRegistration("curl-converter");
    const module = await registration?.load();
    expect(module?.default).toBe(CurlConverterTool);
  });

  it("derives deterministic ordered Fetch output through the shared core", () => {
    const parsed = parseCurlCommand(
      "curl -H 'X-A: 1' -H 'X-A: 2' -d a=1 -d b=2 https://example.test",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const output = formatFetchRequest(parsed.value);
    expect(output).toContain('["X-A", "1"],\n    ["X-A", "2"]');
    expect(output).toContain('body: "a=1&b=2"');
    expect(output).toBe(formatFetchRequest(parsed.value));
  });
});
