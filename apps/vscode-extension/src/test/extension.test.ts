import assert from "node:assert/strict";
import * as vscode from "vscode";

suite("Kitland Developer Tools extension", () => {
  test("registers the generic catalog command and Base64 reference commands", async () => {
    const extension = vscode.extensions.getExtension("outof0.kitland-developer-tools");
    assert.ok(extension, "Extension under test was not discovered");
    await extension.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("kitland.openTool"));
    assert.ok(commands.includes("kitland.base64.encodeSelection"));
    assert.ok(commands.includes("kitland.base64.decodeSelection"));
  });

  test("encodes and decodes an editor selection atomically", async () => {
    const document = await vscode.workspace.openTextDocument({ content: "hello" });
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(0, 0, 0, 5);

    await vscode.commands.executeCommand("kitland.base64.encodeSelection");
    assert.equal(document.getText(), "aGVsbG8=");

    editor.selection = new vscode.Selection(0, 0, 0, document.lineAt(0).text.length);
    await vscode.commands.executeCommand("kitland.base64.decodeSelection");
    assert.equal(document.getText(), "hello");
  });

  test("opens a catalog tool by stable identifier", async () => {
    const result = await vscode.commands.executeCommand("kitland.openTool", "base64");
    assert.equal(result, undefined);
  });
});
