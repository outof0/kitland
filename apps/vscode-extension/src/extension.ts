import * as vscode from "vscode";
import { getToolAdapter, listSelectionCommands, listToolAdapters } from "./toolRegistry";
import { ToolPanel } from "./toolPanel";
import { hasOverlappingRanges, transformSelectedValues } from "./selectionTransform";
import type { RegisteredSelectionCommand } from "./toolRegistry";
import type { ToolAdapter } from "./toolAdapter";

import { KitlandViewProvider } from "./kitlandViewProvider";

const OPEN_TOOL = "kitland.openTool";

export function activate(context: vscode.ExtensionContext): void {
  const selectionCommands = listSelectionCommands().map((command) =>
    vscode.commands.registerCommand(command.commandId, () => replaceSelections(command)),
  );
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(tools) Kitland";
  statusBarItem.tooltip = "Open Kitland Tools";
  statusBarItem.command = OPEN_TOOL;
  statusBarItem.show();

  const viewProvider = new KitlandViewProvider(context.extensionUri);

  context.subscriptions.push(
    ...selectionCommands,
    statusBarItem,
    vscode.window.registerWebviewViewProvider(KitlandViewProvider.viewType, viewProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
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

  const result = await transformSelectedValues(
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
    const renderer = adapter.descriptor.renderer;
    const limit =
      "inputLimit" in adapter
        ? Math.min(
            adapter.inputLimit(
              renderer.kind === "text-transform" ? renderer.defaultOperationId : "",
            ) ?? 0,
            adapter.maxSelectionChars,
          )
        : Math.min(adapter.maxInputChars, adapter.maxSelectionChars);
    if (selectedText.length <= limit) {
      initialInput = selectedText;
    } else {
      await vscode.window.showWarningMessage(
        `Selection exceeds the ${limit.toLocaleString()} UTF-16 code unit workbench limit and was not imported.`,
      );
    }
  }

  // Editor-area panels behave like files: they use the full editor width and
  // rely on VS Code's own navigation instead of rendering a second registry.
  ToolPanel.show(extensionUri, adapter, initialInput, true);
}

async function chooseAdapter(requestedToolId?: unknown): Promise<ToolAdapter | undefined> {
  // VS Code contributes the clicked view/editor context as an object for some
  // menu and status-bar invocation paths. Only a string is a requested tool;
  // other command context must fall through to the regular picker.
  if (typeof requestedToolId === "string") {
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
      title: "Kitland Tools",
      placeHolder: "Choose a local tool",
      matchOnDescription: true,
    },
  );
  return picked?.adapter;
}
