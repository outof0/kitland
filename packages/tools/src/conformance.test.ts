import { describe, expect, it } from "vitest";
import { listTools } from "./registry";
import { evaluateToolConformance, isInventoryToolId } from "./conformance";
import { CANONICAL_TOOL_INVENTORY } from "./inventory";
import { getToolBudget, DEFAULT_TOOL_BUDGET } from "./tool-budgets";

describe("KIT-0004 tool factory / conformance harness", () => {
  it("accepts only committed inventory ids", () => {
    expect(isInventoryToolId("base64")).toBe(true);
    expect(isInventoryToolId("not-a-real-tool")).toBe(false);
    expect(isInventoryToolId("")).toBe(false);
  });

  it("every inventory entry is unique and registrys match count 65", () => {
    const ids = CANONICAL_TOOL_INVENTORY.map((e) => e.id);
    expect(new Set(ids).size).toBe(65);
    expect(listTools()).toHaveLength(65);
  });

  it("available web tools require a renderer slug and every tool has a budget", () => {
    const tools = listTools();
    const webAvailable = tools
      .filter((tool) => tool.platforms.web.status === "available")
      .map((tool) => tool.slug);

    const report = evaluateToolConformance(tools, {
      webRendererSlugs: webAvailable,
      browserExtensionSlugs: tools
        .filter((t) => t.platforms["browser-extension"].status === "available")
        .map((t) => t.slug),
      vscodeExtensionSlugs: tools
        .filter((t) => t.platforms["vscode-extension"].status === "available")
        .map((t) => t.slug),
    });

    expect(report.inventoryCount).toBe(65);
    expect(report.registryCount).toBe(65);
    expect(report.issues.filter((i) => i.code === "MISSING_PLATFORM_ADAPTER")).toEqual([]);
    expect(report.ready).toBe(true);

    for (const tool of tools) {
      const budget = getToolBudget(tool.slug);
      expect(budget.webChunkKb).toBeGreaterThan(0);
      expect(budget.webChunkKb).toBeGreaterThanOrEqual(DEFAULT_TOOL_BUDGET.webChunkKb > 0 ? 1 : 0);
    }
  });

  it("flags missing web renderer for an available tool", () => {
    const tools = listTools();
    const webAvailable = tools
      .filter((tool) => tool.platforms.web.status === "available")
      .map((tool) => tool.slug);
    const missingOne = webAvailable.slice(1);
    const report = evaluateToolConformance(tools, { webRendererSlugs: missingOne });
    expect(report.ready).toBe(false);
    expect(report.issues.some((i) => i.code === "MISSING_PLATFORM_ADAPTER")).toBe(true);
  });
});
