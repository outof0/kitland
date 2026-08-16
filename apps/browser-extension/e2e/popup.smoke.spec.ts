import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  expectPaneEmpty,
  expectPaneNotEmpty,
  expectPaneText,
  paneText,
} from "../../web/e2e/support/editor";

async function expectEditorValue(locator: Locator, expected: string | RegExp): Promise<void> {
  if (typeof expected === "string") {
    await expectPaneText(locator, expected);
    return;
  }
  await expect.poll(() => paneText(locator)).toMatch(expected);
}

async function openTool(page: Page, query: string, name: string | RegExp): Promise<void> {
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: "Search registered tools" });
  await search.fill(query);
  await page.getByRole("option", { name }).click();
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/popup.html");
  await expect(page.getByRole("button", { name: "Kitland developer tools" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Registered tools" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Beautify / Minify", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("filters the generic registry and keeps the active renderer mounted", async ({ page }) => {
  const registry = page.getByRole("navigation", { name: "Registered tools" });
  await expect(
    registry.getByRole("button", { name: "Beautify / Minify", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: "Search registered tools" });
  await search.fill("base");
  await expect(page.getByRole("option", { name: /Base64/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /JSON Formatter/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Beautify / Minify", exact: true })).toBeVisible();
  await search.fill("not-registered");
  await expect(page.getByText(/No results for/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Beautify / Minify", exact: true })).toBeVisible();
});

test("activates cURL lazily, converts live, recovers, and tears down when switching", async ({
  page,
}) => {
  await openTool(page, "curl", /cURL Converter/);
  await expect(page).toHaveURL(/#tool=curl-converter$/);
  const input = page.getByRole("textbox", { name: "cURL command" });
  const output = page.getByRole("textbox", { name: "Fetch result" });
  await input.fill("curl -H 'X-A: 1' -H 'X-A: 2' https://example.test");
  await expectEditorValue(output, /\["X-A", "1"\],/);
  await expectEditorValue(output, /\["X-A", "2"\]/);
  await input.fill("not curl");
  await expectPaneEmpty(output);
  await expect(page.getByRole("alert")).toContainText("Start the command with curl");
  await input.fill("curl https://example.test");
  await expectEditorValue(output, /method: "GET"/);

  await openTool(page, "base", /Base64/);
  await expect(page.getByRole("heading", { name: "Base64", exact: true })).toBeVisible();
  await openTool(page, "curl", /cURL Converter/);
  await expectPaneEmpty(page.getByRole("textbox", { name: "cURL command" }));
});

test("encodes, safely switches direction, validates, and recovers", async ({ page }) => {
  await openTool(page, "base", "Base64");
  const input = page.getByRole("textbox", { name: "UTF-8 text input" });
  const encoded = page.getByRole("textbox", { name: "Standard Base64 result" });

  await input.fill("Kitland ✓");
  await expectEditorValue(encoded, "S2l0bGFuZCDinJM=");
  await expect(page.getByLabel("Base64 status")).toContainText("Ready");

  await page.getByRole("button", { name: /Use the result as input and switch/ }).click();
  const decodeInput = page.getByRole("textbox", { name: "Standard Base64 input" });
  const decoded = page.getByRole("textbox", { name: "UTF-8 text result" });
  await expectEditorValue(decodeInput, "S2l0bGFuZCDinJM=");
  await expectEditorValue(decoded, "Kitland ✓");

  await decodeInput.fill("@@@");
  await expect(page.getByRole("alert")).toContainText("valid Base64");
  await expectPaneEmpty(decoded);

  await decodeInput.fill("S2l0bGFuZA==");
  await expect(page.getByRole("alert")).toBeHidden();
  await expectEditorValue(decoded, "Kitland");
});

test("supports Base64URL and UTF-8 file input without host permissions", async ({ page }) => {
  await openTool(page, "base", "Base64");
  await page.getByRole("button", { name: "Base64URL" }).click();
  const input = page.getByRole("textbox", { name: "UTF-8 text input" });
  await input.fill("💩");
  await expectEditorValue(page.getByRole("textbox", { name: "Base64URL result" }), "8J-SqQ");

  const fileChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Upload file" }).click();
  (await fileChooser).setFiles({
    name: "sample.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Uploaded ✓", "utf8"),
  });
  await expectEditorValue(input, "Uploaded ✓");
  await expectEditorValue(
    page.getByRole("textbox", { name: "Base64URL result" }),
    "VXBsb2FkZWQg4pyT",
  );
});

test("offers a permission-free browser download", async ({ page }) => {
  await openTool(page, "base", "Base64");
  const input = page.getByRole("textbox", { name: "UTF-8 text input" });
  await input.fill("Kitland");
  await expectEditorValue(
    page.getByRole("textbox", { name: "Standard Base64 result" }),
    "S2l0bGFuZA==",
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save result" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("base64-output.txt");
});

test("inspects JSON live and erases state when switching tools", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openTool(page, "json", /JSON Formatter/);
  await expect(page).toHaveURL(/#tool=json-formatter$/);
  const input = page.getByRole("textbox", { name: "JSON input" });
  const output = page.getByRole("textbox", { name: "Formatted JSON" });
  await expectPaneEmpty(input);
  await expect(page.getByText("Waiting", { exact: true })).toBeVisible();
  await input.fill('{"name":"Kitland","items":[1,null]}');
  await expectEditorValue(
    output,
    '{\n  "name": "Kitland",\n  "items": [\n    1,\n    null\n  ]\n}',
  );
  await expect(input.locator(".kit-tok-propertyName").first()).toHaveCSS(
    "color",
    "rgb(96, 165, 250)",
  );
  await expect(page.getByLabel("JSON inspection summary")).toContainText("object");
  await expect(page.getByLabel("JSON inspection summary")).toContainText("props");
  await page.getByRole("button", { name: "Indent", exact: true }).click();
  await page.getByRole("button", { name: "4 spaces" }).click();
  await expectEditorValue(output, /\n    "name"/);
  await page.getByRole("button", { name: "Minify JSON" }).click();
  await expectEditorValue(output, '{"name":"Kitland","items":[1,null]}');
  await page.getByRole("button", { name: "Beautify JSON" }).click();
  await expectEditorValue(output, /\n    "name"/);
  await page.getByRole("button", { name: "Copy formatted JSON" }).click();
  await expect(page.getByRole("button", { name: /Copied/ })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(await paneText(output));
  await input.fill("{");
  await expectPaneEmpty(output);
  await expect(page.getByRole("alert")).toHaveText("JSON is invalid.");
  await input.fill('{"recovered":true}');
  await expectEditorValue(output, '{\n    "recovered": true\n}');

  await openTool(page, "base", /Base64/);
  await openTool(page, "json", /JSON Formatter/);
  await expectPaneEmpty(page.getByRole("textbox", { name: "JSON input" }));
});

test("reports JSON clipboard denial without discarding the result", async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("Denied")) },
    });
    Object.defineProperty(Document.prototype, "execCommand", {
      configurable: true,
      value: () => false,
    });
  });
  await openTool(page, "json", /JSON Formatter/);
  await page.getByRole("button", { name: "Sample", exact: true }).click();
  const output = page.getByRole("textbox", { name: "Formatted JSON" });
  await expectPaneNotEmpty(output);
  await page.getByRole("button", { name: "Copy formatted JSON" }).click();
  await expect(
    page.getByText("Couldn’t access your clipboard. Select the text and copy it manually."),
  ).toBeVisible();
  await expectPaneNotEmpty(output);
});
