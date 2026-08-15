import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  expectPaneEmpty,
  expectPaneNotEmpty,
  expectPaneText,
  fillPane,
  paneText,
} from "./support/editor";

const TEXT_TRANSFORMS = [
  {
    slug: "case-converter",
    title: "Case Converter",
    input: "Text",
    output: "Converted",
  },
  {
    slug: "sort-lines",
    title: "Sort Lines",
    input: "Lines",
    output: "Sorted",
  },
  {
    slug: "dedupe-lines",
    title: "Dedupe Lines",
    input: "Lines",
    output: "Unique",
  },
  {
    slug: "text-reverser",
    title: "Text Reverser",
    input: "Text",
    output: "Reversed",
  },
] as const;

test.describe("text transform workspace contract", () => {
  test("starts every transform empty and restores a focused Sample/Clear flow", async ({
    page,
  }) => {
    for (const tool of TEXT_TRANSFORMS) {
      await page.goto(`/explore/${tool.slug}`);
      const input = page.getByRole("textbox", { name: tool.input });
      const output = page.getByRole("textbox", { name: tool.output });

      await expectPaneEmpty(input);
      await expectPaneEmpty(output);
      await expect(page.getByLabel(`${tool.title} status`)).toContainText("Waiting");
      await expect(page.getByRole("button", { name: "Clear input", exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: `Copy ${tool.input}` })).toBeDisabled();
      await expect(page.getByRole("button", { name: `Copy ${tool.output}` })).toBeDisabled();

      await page.getByRole("button", { name: "Sample", exact: true }).click();
      await expect(input).toBeFocused();
      await expectPaneNotEmpty(input);
      await expectPaneNotEmpty(output);
      await expect(page.getByLabel(`${tool.title} status`)).toContainText("Ready");

      await page.getByRole("button", { name: "Clear input", exact: true }).click();
      await expect(input).toBeFocused();
      await expectPaneEmpty(input);
      await expectPaneEmpty(output);
    }
  });

  test("keeps both copy actions and the input-toolbar clear action", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/explore/case-converter");

    const input = page.getByRole("textbox", { name: "Text" });
    const output = page.getByRole("textbox", { name: "Converted" });
    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await expectPaneText(output, "hello_world_example");

    await page.getByRole("button", { name: "Copy Text" }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(await paneText(input));

    await page.getByRole("button", { name: "Copy Converted" }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(await paneText(output));

    await page.getByRole("button", { name: "Clear input", exact: true }).click();
    await expect(input).toBeFocused();
    await expectPaneEmpty(input);
    await expectPaneEmpty(output);
    for (const action of ["Upload", "Download", "Share", "Save", "Swap"]) {
      await expect(page.getByRole("button", { name: action, exact: true })).toHaveCount(0);
    }
  });

  test("keeps the densest option set accessible and inside a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/explore/text-reverser");

    await expect(page.getByRole("group", { name: "Reverse mode" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Output case" })).toBeVisible();
    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await page.getByRole("button", { name: "Line order" }).click();
    await expectPaneNotEmpty(page.getByRole("textbox", { name: "Reversed" }));

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("never renders a stale result when the source changes rapidly", async ({ page }) => {
    await page.goto("/explore/case-converter");
    const input = page.getByRole("textbox", { name: "Text" });
    const output = page.getByRole("textbox", { name: "Converted" });

    await fillPane(input, "first input");
    await fillPane(input, "second input");
    await expectPaneText(output, "second_input");
    await page.waitForTimeout(400);
    await expectPaneText(output, "second_input");
    await expect(page.getByLabel("Case Converter status")).toContainText("Ready");
  });
});
