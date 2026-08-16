import assert from "node:assert/strict";
import * as vscode from "vscode";

suite("Kitland Tools extension", () => {
  test("registers generic, Base64, and cURL commands", async () => {
    const extension = vscode.extensions.getExtension("outof0.kitland-tools");
    assert.ok(extension, "Extension under test was not discovered");
    await extension.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("kitland.openTool"));
    assert.ok(commands.includes("kitland.base64.encodeSelection"));
    assert.ok(commands.includes("kitland.base64.decodeSelection"));
    assert.ok(commands.includes("kitland.curlConverter.convertSelection"));
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

  test("converts multiple valid cURL selections atomically", async () => {
    const original = "curl https://one.test\ncurl https://two.test";
    const document = await vscode.workspace.openTextDocument({
      content: original,
    });
    const editor = await vscode.window.showTextDocument(document);
    editor.selections = [new vscode.Selection(0, 0, 0, 21), new vscode.Selection(1, 0, 1, 21)];
    await vscode.commands.executeCommand("kitland.curlConverter.convertSelection");
    assert.match(document.getText(), /fetch\("https:\/\/one\.test"/u);
    assert.match(document.getText(), /fetch\("https:\/\/two\.test"/u);
  });

  test("opens registry tools by stable identifier without mutating JSON selections", async () => {
    const result = await vscode.commands.executeCommand("kitland.openTool", "base64");
    assert.equal(result, undefined);
    const document = await vscode.workspace.openTextDocument({ content: '{"selected":true}' });
    const editor = await vscode.window.showTextDocument(document);
    editor.selection = new vscode.Selection(0, 0, 0, document.lineAt(0).text.length);
    await vscode.commands.executeCommand("kitland.openTool", "json-formatter");
    assert.equal(document.getText(), '{"selected":true}');
  });
});
