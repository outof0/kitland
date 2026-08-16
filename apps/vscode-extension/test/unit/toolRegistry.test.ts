import { PROTOCOL_MAX_TEXT_CHARS } from "../../src/constants";
import { listSelectionCommands, listToolAdapters } from "../../src/toolRegistry";
import { getToolById, listToolsByPlatform } from "@kitland/tools";

describe("tool registry", () => {
  it("keeps tool and command identifiers unique", () => {
    const adapters = listToolAdapters();
    const toolIds = adapters.map((adapter) => adapter.descriptor.id);
    const commandIds = listSelectionCommands().map((command) => command.commandId);
    expect(new Set(toolIds).size).toBe(toolIds.length);
    expect(new Set(commandIds).size).toBe(commandIds.length);
  });

  it("derives public identity from the shared product registry", () => {
    const adapters = listToolAdapters();
    expect(adapters.map((adapter) => adapter.registryTool)).toEqual(
      adapters.map((adapter) => getToolById(adapter.descriptor.id)),
    );
    expect(adapters.map((adapter) => adapter.descriptor.title)).toEqual(
      adapters.map((adapter) => adapter.registryTool.shortName),
    );
    expect(adapters.map((adapter) => adapter.descriptor.description)).toEqual(
      adapters.map((adapter) => adapter.registryTool.description),
    );
    expect(adapters.map((adapter) => adapter.registryTool.id).sort()).toEqual(
      listToolsByPlatform("vscode-extension")
        .map((tool) => tool.id)
        .sort(),
    );
  });

  it("requires every renderer to have bounded input and output contracts", () => {
    const adapters = listToolAdapters();
    expect(adapters.every((adapter) => adapter.maxOutputChars > 0)).toBe(true);
    expect(adapters.every((adapter) => adapter.maxOutputChars <= PROTOCOL_MAX_TEXT_CHARS)).toBe(
      true,
    );
    expect(adapters.every((adapter) => adapter.maxSelectionChars > 0)).toBe(true);
    expect(
      adapters.every((adapter) =>
        adapter.descriptor.renderer.options.some(
          (item) => item.id === adapter.descriptor.renderer.defaultOptionId,
        ),
      ),
    ).toBe(true);

    const transforms = adapters.filter((adapter) => "transform" in adapter);
    expect(
      transforms.every((adapter) => adapter.descriptor.renderer.kind === "text-transform"),
    ).toBe(true);
    expect(
      transforms.every((adapter) =>
        adapter.descriptor.renderer.operations.every((operation) => {
          const limit = adapter.inputLimit(operation.id);
          return limit !== undefined && limit > 0 && limit <= PROTOCOL_MAX_TEXT_CHARS;
        }),
      ),
    ).toBe(true);

    const inspectors = adapters.filter((adapter) => "inspect" in adapter);
    expect(inspectors.map((adapter) => adapter.descriptor.renderer.kind)).toEqual(["text-inspect"]);
    expect(inspectors.map((adapter) => adapter.maxInputChars)).toEqual([100_000]);
    expect(inspectors.map((adapter) => adapter.selectionCommands)).toEqual([[]]);
    expect(
      inspectors.every((adapter) =>
        adapter.descriptor.renderer.operations.some(
          (item) => item.id === adapter.descriptor.renderer.defaultOperationId,
        ),
      ),
    ).toBe(true);
  });

  it("ships JSON Formatter as inspect and pure transforms via host adapters", () => {
    const ids = listToolAdapters().map((adapter) => adapter.descriptor.id);
    expect(ids).toEqual(
      expect.arrayContaining(["json-formatter", "base64", "curl-converter", "beautify-minify"]),
    );
    expect(ids.length).toBe(listToolsByPlatform("vscode-extension").length);
    expect(ids.length).toBe(65);

    const json = listToolAdapters().find((adapter) => adapter.descriptor.id === "json-formatter");
    expect(json?.descriptor.renderer).toMatchObject({
      kind: "text-inspect",
      operations: [
        { id: "beautify", label: "Beautify", actionLabel: "Beautify JSON" },
        { id: "minify", label: "Minify", actionLabel: "Minify JSON" },
      ],
      defaultOperationId: "beautify",
      options: [
        { id: "indent-2", label: "2 spaces" },
        { id: "indent-4", label: "4 spaces" },
        { id: "indent-tab", label: "Tab" },
      ],
    });
    // Selection replace stays limited to hand-reviewed specialty commands.
    expect(listSelectionCommands().map(({ adapter }) => adapter.descriptor.id)).not.toContain(
      "json-formatter",
    );
    expect(
      listSelectionCommands()
        .map(({ adapter }) => adapter.descriptor.id)
        .sort(),
    ).toEqual(["base64", "base64", "curl-converter"].sort());
  });
});
