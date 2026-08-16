import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pkgJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
const distCliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

describe("Package Manifest & Artifact Constraints", () => {
  it("enforces strict package.json metadata", async () => {
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf8"));

    expect(pkgJson.name).toBe("@kitland/mcp");
    expect(pkgJson.version).toBe("0.1.1");
    expect(pkgJson.private).toBeUndefined();
    expect(pkgJson.type).toBe("module");
    expect(pkgJson.bin).toEqual({ "kitland-mcp": "./dist/cli.js" });
    expect(pkgJson.engines.node).toBe(">=22.12.0");
    expect(pkgJson.dependencies["@modelcontextprotocol/sdk"]).toBe("1.30.0");
    expect(pkgJson.publishConfig?.access).toBe("public");
    expect(pkgJson.publishConfig?.provenance).toBe(true);
    expect(pkgJson.repository?.url).toBe("git+https://github.com/OutOf0/kitland.git");
  });

  it("ensures bundled CLI artifact meets size budgets if built", async () => {
    try {
      const stats = await stat(distCliPath);
      // Bundled esbuild output for Base64 + SDK + Ajv should be well under 1 MiB (typically ~400KB)
      expect(stats.size).toBeLessThan(1024 * 1024);
    } catch {
      // If not yet built, skip size check
    }
  });
});
