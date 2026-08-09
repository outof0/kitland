import { expect, test } from "@playwright/test";

test.describe("Wave 1 tool renderers", () => {
  for (const tool of [
    { slug: "beautify-minify", title: "Beautify / Minify", input: "JSON input" },
    { slug: "html-entities", title: "HTML Entities", input: "Text input" },
    { slug: "case-converter", title: "Case Converter", input: "Text" },
  ]) {
    test(`loads ${tool.slug} through the catalog registry`, async ({ page }) => {
      await page.goto(`/explore/${tool.slug}`);

      await expect(page).toHaveTitle(new RegExp(tool.title));
      await expect(page.getByTestId("tool-title")).toHaveText(tool.title);
      await expect(page.getByRole("textbox", { name: tool.input })).toBeVisible();
      await expect(page.getByRole("button", { name: /Copy/ }).first()).toBeVisible();
    });
  }
});
