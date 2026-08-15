import { describe, expect, it } from "vitest";
import { McpRegistry } from "../src/registry.ts";
import { kitlandBase64EncodeExposure } from "../src/exposures/base64.ts";

describe("McpRegistry", () => {
  it("constructs default registry with sorted exposures", () => {
    const registry = new McpRegistry();
    const list = registry.list();

    expect(list.length).toBe(79);
    expect(list[0]!.mcpName).toBe("kitland_aes_decrypt");
    expect(list[1]!.mcpName).toBe("kitland_aes_encrypt");
  });

  it("retrieves exposures by name", () => {
    const registry = new McpRegistry();
    expect(registry.has("kitland_base64_encode")).toBe(true);
    expect(registry.get("kitland_base64_encode")?.operationId).toBe("base64_encode");
    expect(registry.has("unknown_tool")).toBe(false);
  });

  it("produces compliant tool definitions for tools/list", () => {
    const registry = new McpRegistry();
    const defs = registry.toToolDefinitions();

    expect(defs.length).toBe(79);
    expect(defs[0]!.name).toBe("kitland_aes_decrypt");
    expect(defs[0]!.inputSchema).toHaveProperty("type", "object");
    expect(defs[0]!.annotations).toEqual({
      readOnly: true,
      idempotent: true,
    });
  });

  it("rejects duplicate operation names", () => {
    expect(
      () =>
        new McpRegistry([
          kitlandBase64EncodeExposure,
          {
            ...kitlandBase64EncodeExposure,
            operationId: "different_op_id",
          },
        ]),
    ).toThrow(/Duplicate MCP operation name/);
  });

  it("rejects duplicate operationIds", () => {
    expect(
      () =>
        new McpRegistry([
          kitlandBase64EncodeExposure,
          {
            ...kitlandBase64EncodeExposure,
            mcpName: "kitland_base64_encode_2",
          },
        ]),
    ).toThrow(/Duplicate internal operationId/);
  });

  it("rejects invalid operation naming pattern", () => {
    expect(
      () =>
        new McpRegistry([
          {
            ...kitlandBase64EncodeExposure,
            mcpName: "invalid-name",
          },
        ]),
    ).toThrow(/Invalid MCP operation name/);
  });

  it("supports synthetic registries for pagination testing", () => {
    const syntheticExposures = Array.from({ length: 5 }, (_, i) => ({
      ...kitlandBase64EncodeExposure,
      mcpName: `kitland_tool_${i}`,
      operationId: `tool_op_${i}`,
    }));

    const registry = new McpRegistry(syntheticExposures);
    expect(registry.list().length).toBe(5);
  });

  it("matches the immutable tool-contracts.json snapshot", async () => {
    const { readFile, writeFile } = await import("node:fs/promises");
    const { fileURLToPath } = await import("node:url");
    const snapshotPath = fileURLToPath(new URL("./snapshots/tool-contracts.json", import.meta.url));
    const registry = new McpRegistry();
    if (process.env.UPDATE_SNAPSHOTS) {
      await writeFile(snapshotPath, JSON.stringify(registry.toToolDefinitions(), null, 2) + "\n");
    }
    const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
    expect(registry.toToolDefinitions()).toEqual(snapshot);
  });
});
