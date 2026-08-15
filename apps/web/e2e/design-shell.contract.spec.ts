import { listAvailableTools } from "@kitland/tools";
import { expect, test } from "@playwright/test";

/**
 * Suite-wide design shell: every available web tool keeps design chrome at 390px
 * (no document horizontal overflow), shows a tool body heading, and exposes
 * at least one interactive control.
 */
const webTools = listAvailableTools();

test.describe("design shell suite", () => {
  for (const tool of webTools) {
    test(`${tool.slug} uses design chrome without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/explore/${tool.slug}`);

      await expect(page.getByTestId("tool-title")).toBeVisible();
      // Tool body heading (design.pen tool header title)
      await expect(page.locator("#tool-host h2").first()).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow, `${tool.slug} must not overflow at 390px`).toBe(false);

      // Interactive tools expose at least one labelled control in the workspace.
      const actions = page.locator(
        "#tool-host button, #tool-host [role='button'], #tool-host textarea, #tool-host input, #tool-host select",
      );
      await expect(actions.first()).toBeVisible();
    });
  }
});
