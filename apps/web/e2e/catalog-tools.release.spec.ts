import { listAvailableTools } from "@kitland/tool-catalog";
import { expect, test } from "@playwright/test";

/**
 * A catalog entry is not releasable merely because its renderer compiles. Each
 * available tool must hydrate from the production build without a page error
 * and render its own workspace heading.
 */
test.describe("available tool release gate", () => {
  for (const tool of listAvailableTools()) {
    test(`${tool.slug} hydrates without a runtime error`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      await page.goto(`/explore/${tool.slug}`);

      await expect(
        page.getByRole("heading", { level: 2, name: tool.name, exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Tool failed to load")).toHaveCount(0);
      expect(pageErrors).toEqual([]);
    });
  }
});
