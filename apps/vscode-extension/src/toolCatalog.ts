import { listToolsByPlatform } from "@kitland/tool-catalog";
import { base64Adapter } from "./adapters/base64";
import type { SelectionCommand, ToolAdapter } from "./toolAdapter";

const ADAPTERS: readonly ToolAdapter[] = [base64Adapter];
assertAdapterRegistryComplete();

export type RegisteredSelectionCommand = SelectionCommand & {
  adapter: ToolAdapter;
};

export function listToolAdapters(): readonly ToolAdapter[] {
  return ADAPTERS;
}

export function getToolAdapter(toolId: string): ToolAdapter | undefined {
  return ADAPTERS.find((adapter) => adapter.descriptor.id === toolId);
}

export function listSelectionCommands(): readonly RegisteredSelectionCommand[] {
  return ADAPTERS.flatMap((adapter) =>
    adapter.selectionCommands.map((command) => ({ ...command, adapter })),
  );
}

function assertAdapterRegistryComplete(): void {
  const expected = listToolsByPlatform("vscode-extension").map((tool) => tool.id);
  const registered = ADAPTERS.map((adapter) => adapter.catalogTool.id);
  const unique = new Set(registered);
  const complete =
    unique.size === registered.length &&
    expected.length === registered.length &&
    expected.every((id) => unique.has(id)) &&
    ADAPTERS.every(
      (adapter) =>
        adapter.catalogTool.id === adapter.descriptor.id &&
        adapter.catalogTool.platforms["vscode-extension"].status === "available",
    );

  if (!complete) {
    throw new Error(
      `VS Code adapter registry mismatch: expected [${expected.join(", ")}], received [${registered.join(", ")}].`,
    );
  }
}
