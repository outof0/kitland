import * as vscode from "vscode";
import { getToolAdapter, listSelectionCommands, listToolAdapters } from "./toolCatalog";
import { ToolPanel } from "./toolPanel";
import { hasOverlappingRanges, transformSelectedValues } from "./selectionTransform";
import type { RegisteredSelectionCommand } from "./toolCatalog";
import type { ToolAdapter } from "./toolAdapter";

const OPEN_TOOL = "kitland.openTool";

export function activate(context: vscode.ExtensionContext): void {
  const selectionCommands = listSelectionCommands().map((command) =>
    vscode.commands.registerCommand(command.commandId, () => replaceSelections(command)),
  );
  context.subscriptions.push(
    ...selectionCommands,
    vscode.commands.registerCommand(OPEN_TOOL, (toolId?: unknown) =>
      openTool(context.extensionUri, toolId),
    ),
  );
}

export function deactivate(): void {
  ToolPanel.disposeCurrent();
}

async function replaceSelections(command: RegisteredSelectionCommand): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    await vscode.window.showInformationMessage("Open a text editor and select text first.");
    return;
  }

  const selections = editor.selections;
  const ranges = selections.map((selection) => ({
    start: editor.document.offsetAt(selection.start),
    end: editor.document.offsetAt(selection.end),
  }));
  if (hasOverlappingRanges(ranges)) {
    await vscode.window.showErrorMessage("Overlapping selections cannot be transformed safely.");
    return;
  }

  const result = transformSelectedValues(
    command.adapter,
    command.operationId,
    command.optionId,
    selections.map((selection) => editor.document.getText(selection)),
  );
  if (!result.ok) {
    await vscode.window.showErrorMessage(result.error.message);
    return;
  }

  const applied = await editor.edit(
    (editBuilder) => {
      selections.forEach((selection, index) => {
        const value = result.value[index];
        if (value !== undefined) editBuilder.replace(selection, value);
      });
    },
    { undoStopAfter: true, undoStopBefore: true },
  );
  if (!applied) {
    await vscode.window.showErrorMessage("VS Code could not apply the local transformation.");
  }
}

async function openTool(extensionUri: vscode.Uri, requestedToolId?: unknown): Promise<void> {
  const adapter = await chooseAdapter(requestedToolId);
  if (!adapter) return;

  const editor = vscode.window.activeTextEditor;
  let initialInput: string | undefined;
  if (editor && !editor.selection.isEmpty) {
    const selectedText = editor.document.getText(editor.selection);
    const defaultOperation = adapter.descriptor.renderer.defaultOperationId;
    const limit = Math.min(adapter.inputLimit(defaultOperation) ?? 0, adapter.maxSelectionChars);
    if (selectedText.length <= limit) {
      initialInput = selectedText;
    } else {
      await vscode.window.showWarningMessage(
        `Selection exceeds the ${limit.toLocaleString()} character workbench limit and was not imported.`,
      );
    }
  }

  ToolPanel.show(extensionUri, adapter, initialInput);
}

async function chooseAdapter(requestedToolId?: unknown): Promise<ToolAdapter | undefined> {
  if (requestedToolId !== undefined) {
    if (typeof requestedToolId !== "string") {
      await vscode.window.showErrorMessage("Kitland tool identifiers must be strings.");
      return undefined;
    }
    const requested = getToolAdapter(requestedToolId);
    if (!requested) {
      await vscode.window.showErrorMessage("The requested Kitland tool is not available.");
    }
    return requested;
  }

  const picked = await vscode.window.showQuickPick(
    listToolAdapters().map((adapter) => ({
      label: adapter.descriptor.title,
      description: adapter.descriptor.description,
      adapter,
    })),
    {
      title: "Kitland Developer Tools",
      placeHolder: "Choose a local tool",
      matchOnDescription: true,
    },
  );
  return picked?.adapter;
}
