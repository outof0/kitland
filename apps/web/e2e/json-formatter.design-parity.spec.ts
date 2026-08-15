import { expect, test } from "@playwright/test";
import { expectPaneNotEmpty } from "./support/editor";

const subtitle = "Format, validate, minify and convert JSON — entirely in your browser";

test.describe("JSON Formatter design parity", () => {
  test("matches the two-pane workspace of the design system", async ({ page }) => {
    await page.goto("/explore/json-formatter");
    await expect(page.getByRole("heading", { name: "JSON Formatter" })).toBeVisible();
    await expect(page.getByText(subtitle, { exact: true })).toBeVisible();

    const inputCard = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Input" }) });
    const outputCard = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Output" }) });
    await expect(inputCard).toBeVisible();
    await expect(outputCard).toBeVisible();

    const inputBox = await inputCard.boundingBox();
    const outputBox = await outputCard.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(outputBox).not.toBeNull();
    if (inputBox && outputBox) {
      expect(Math.abs(inputBox.y - outputBox.y)).toBeLessThan(2);
      expect(Math.abs(inputBox.width - outputBox.width)).toBeLessThan(2);
    }

    await expect(page.getByLabel("JSON inspection summary")).toBeVisible();
    await expect(page.getByText("Waiting", { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
  });

  test("exposes the complete local toolbox controls", async ({ page }) => {
    await page.goto("/explore/json-formatter");
    const source = page.getByRole("textbox", { name: "JSON input" });

    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await expectPaneNotEmpty(source);
    await expect(page.getByRole("button", { name: "Share input link" })).toBeEnabled();

    await expect(page.getByRole("button", { name: "Beautify", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: "Minify", exact: true })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(page.getByRole("button", { name: "Indent", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Indent", exact: true }).click();
    await expect(page.getByRole("button", { name: "2 spaces" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: "4 spaces" })).toBeVisible();
    await source.click();

    await expect(page.getByRole("button", { name: "Repair" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy input" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Redo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy formatted JSON" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Validate", exact: true })).toBeVisible();
    await expect(page.getByText("VALIDATE", { exact: true })).toBeVisible();
    await expect(page.getByText("JSON", { exact: true })).toBeVisible();

    await expect(page.getByLabel("JSON inspection summary")).toContainText("object");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
  });

  test("degrades to a single scrollable column on narrow screens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/explore/json-formatter");
    await expect(page.getByRole("heading", { name: "JSON Formatter" })).toBeVisible();
    await expect(page.getByText(subtitle, { exact: true })).toBeHidden();

    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await expectPaneNotEmpty(page.getByRole("textbox", { name: "JSON input" }));
    await expect(page.getByText("Valid", { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
  });
});
