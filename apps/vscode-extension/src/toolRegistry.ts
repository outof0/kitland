import { listToolsByPlatform } from "@kitland/tools";
import { base64Adapter } from "./adapters/base64";
import { curlConverterAdapter } from "./adapters/curl-converter";
import { hostTransformAdapters } from "./adapters/host-transforms";
import { jsonFormatterAdapter } from "./adapters/json-formatter";
import type { SelectionCommand, TextTransformAdapter, ToolAdapter } from "./toolAdapter";

const ADAPTERS: readonly ToolAdapter[] = [
  jsonFormatterAdapter,
  base64Adapter,
  curlConverterAdapter,
  ...hostTransformAdapters,
];
assertAdapterRegistryComplete();

export type RegisteredSelectionCommand = SelectionCommand & {
  adapter: TextTransformAdapter;
};

export function listToolAdapters(): readonly ToolAdapter[] {
  return ADAPTERS;
}

export function getToolAdapter(toolId: string): ToolAdapter | undefined {
  return ADAPTERS.find((adapter) => adapter.descriptor.id === toolId);
}

export function listSelectionCommands(): readonly RegisteredSelectionCommand[] {
  return ADAPTERS.flatMap((adapter) =>
    "transform" in adapter
      ? adapter.selectionCommands.map((command) => ({ ...command, adapter }))
      : [],
  );
}

function assertAdapterRegistryComplete(): void {
  const expected = listToolsByPlatform("vscode-extension").map((tool) => tool.id);
  const registered = ADAPTERS.map((adapter) => adapter.registryTool.id);
  const unique = new Set(registered);
  const complete =
    unique.size === registered.length &&
    expected.length === registered.length &&
    expected.every((id) => unique.has(id)) &&
    ADAPTERS.every(
      (adapter) =>
        adapter.registryTool.id === adapter.descriptor.id &&
        adapter.registryTool.platforms["vscode-extension"].status === "available",
    );

  if (!complete) {
    throw new Error(
      `VS Code adapter registry mismatch: expected [${expected.join(", ")}], received [${registered.join(", ")}].`,
    );
  }
}
