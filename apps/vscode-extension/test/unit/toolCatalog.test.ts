import { PROTOCOL_MAX_TEXT_CHARS } from "../../src/constants";
import { listSelectionCommands, listToolAdapters } from "../../src/toolCatalog";
import { getToolById, listToolsByPlatform } from "@kitland/tool-catalog";

describe("tool catalog", () => {
  it("keeps tool and command identifiers unique", () => {
    const adapters = listToolAdapters();
    const toolIds = adapters.map((adapter) => adapter.descriptor.id);
    const commandIds = listSelectionCommands().map((command) => command.commandId);

    expect(new Set(toolIds).size).toBe(toolIds.length);
    expect(new Set(commandIds).size).toBe(commandIds.length);
  });

  it("derives public identity from the shared product catalog", () => {
    for (const adapter of listToolAdapters()) {
      expect(adapter.catalogTool).toBe(getToolById(adapter.descriptor.id));
      expect(adapter.descriptor.title).toBe(adapter.catalogTool.shortName);
      expect(adapter.descriptor.description).toBe(adapter.catalogTool.description);
    }
    expect(listToolAdapters().map((adapter) => adapter.catalogTool.id)).toEqual(
      listToolsByPlatform("vscode-extension").map((tool) => tool.id),
    );
  });

  it("requires every text-transform operation to have a bounded input contract", () => {
    for (const adapter of listToolAdapters()) {
      expect(adapter.maxOutputChars).toBeGreaterThan(0);
      expect(adapter.maxOutputChars).toBeLessThanOrEqual(PROTOCOL_MAX_TEXT_CHARS);
      expect(adapter.maxSelectionChars).toBeGreaterThan(0);

      const renderer = adapter.descriptor.renderer;
      expect(renderer.operations.some((item) => item.id === renderer.defaultOperationId)).toBe(
        true,
      );
      expect(renderer.options.some((item) => item.id === renderer.defaultOptionId)).toBe(true);
      for (const operation of renderer.operations) {
        expect(adapter.inputLimit(operation.id)).toBeGreaterThan(0);
        expect(adapter.inputLimit(operation.id)).toBeLessThanOrEqual(PROTOCOL_MAX_TEXT_CHARS);
      }
    }
  });

  it("ships Base64 only as the first registered reference adapter", () => {
    expect(listToolAdapters().map((adapter) => adapter.descriptor.id)).toEqual(["base64"]);
  });
});
