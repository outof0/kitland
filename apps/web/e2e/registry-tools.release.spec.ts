import { listAvailableTools } from "@kitland/tools";
import { expect, test } from "@playwright/test";

/**
 * A registry entry is not releasable merely because its renderer compiles. Each
 * available tool must hydrate from the production build without a page error
 * and render its own workspace heading. The heading may use approved UI copy
 * that differs from the shorter registry navigation label.
 */
test.describe("available tool release gate", () => {
  for (const tool of listAvailableTools()) {
    test(`${tool.slug} hydrates without a runtime error`, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      await page.goto(`/explore/${tool.slug}`);

      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      const renderer = page.locator(`[data-tool-renderer="${tool.slug}"]`);
      await expect(renderer).toBeAttached();
      await expect(renderer.getByRole("heading", { level: 2 }).first()).toBeVisible();
      await expect(page.getByText("Tool failed to load")).toHaveCount(0);
      expect(pageErrors).toEqual([]);
    });
  }
});
