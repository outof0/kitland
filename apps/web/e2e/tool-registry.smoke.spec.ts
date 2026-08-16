import { expect, test } from "@playwright/test";

test.describe("Registry-registered tool renderers", () => {
  for (const tool of [
    { slug: "json-formatter", title: "JSON Formatter", input: "JSON input" },
    { slug: "text-stats", title: "Text Stats", input: "Text to measure", copy: false },
    { slug: "lorem-ipsum", title: "Lorem Ipsum", input: undefined },
  ]) {
    test(`loads ${tool.slug} through the registry registry`, async ({ page }) => {
      await page.goto(`/explore/${tool.slug}`);

      await expect(page).toHaveTitle(new RegExp(tool.title));
      await expect(page.getByTestId("tool-title")).toHaveText(tool.title);
      if (tool.input) await expect(page.getByRole("textbox", { name: tool.input })).toBeVisible();
      if (tool.copy !== false) {
        await expect(page.getByRole("button", { name: /Copy/ }).first()).toBeVisible();
      }
    });
  }
});
