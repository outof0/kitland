import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/popup.html");
  await expect(page.getByRole("heading", { name: "Tools" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Registered tools" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Base64" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("filters the generic catalog and keeps the active renderer mounted", async ({ page }) => {
  const search = page.getByRole("searchbox", { name: "Search registered tools" });
  await search.fill("base");
  const catalog = page.getByRole("navigation", { name: "Registered tools" });
  await expect(catalog.getByRole("button", { name: "ENCODE Base64" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await search.press("ArrowDown");
  await expect(catalog.getByRole("button", { name: "ENCODE Base64" })).toBeFocused();
  await expect(catalog.getByRole("button", { name: "ENCODE Base64" })).toHaveAttribute(
    "tabindex",
    "0",
  );
  await search.focus();
  await search.fill("not-registered");
  await expect(page.getByText("No registered tool matches that search.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Base64" })).toBeVisible();
});

test("encodes, safely switches direction, validates, and recovers", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "UTF-8 text input" });
  const encoded = page.getByRole("textbox", { name: "Standard Base64 result" });

  await input.fill("Kitland ✓");
  await expect(encoded).toHaveValue("S2l0bGFuZCDinJM=");
  await expect(page.getByText("Encoded", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Use result & switch" }).click();
  const decodeInput = page.getByRole("textbox", { name: "Standard Base64 input" });
  const decoded = page.getByRole("textbox", { name: "UTF-8 text result" });
  await expect(decodeInput).toHaveValue("S2l0bGFuZCDinJM=");
  await expect(decoded).toHaveValue("Kitland ✓");

  await decodeInput.fill("@@@");
  await expect(page.getByRole("alert")).toContainText("valid Base64");
  await expect(decoded).toHaveValue("");

  await decodeInput.fill("S2l0bGFuZA==");
  await expect(page.getByRole("alert")).toBeHidden();
  await expect(decoded).toHaveValue("Kitland");
});

test("supports Base64URL and UTF-8 file input without host permissions", async ({ page }) => {
  await page.getByRole("button", { name: "Base64URL" }).click();
  const input = page.getByRole("textbox", { name: "UTF-8 text input" });
  await input.fill("💩");
  await expect(page.getByRole("textbox", { name: "Base64URL result" })).toHaveValue("8J-SqQ");

  await page.locator("#file-input").setInputFiles({
    name: "sample.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Uploaded ✓", "utf8"),
  });
  await expect(input).toHaveValue("Uploaded ✓");
  await expect(page.getByRole("textbox", { name: "Base64URL result" })).toHaveValue(
    "VXBsb2FkZWQg4pyT",
  );
});

test("offers a permission-free browser download", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "UTF-8 text input" });
  await input.fill("Kitland");
  await expect(page.getByRole("textbox", { name: "Standard Base64 result" })).toHaveValue(
    "S2l0bGFuZA==",
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download result" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("encoded.base64.txt");
});
