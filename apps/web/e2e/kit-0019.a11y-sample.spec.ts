import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * KIT-0019 sample: pattern-representative a11y + 390px shell.
 * Full Pencil frame review remains a human product-design gate.
 */
const sampleTools = [
  { slug: "base64", pattern: "transform" },
  { slug: "beautify-minify", pattern: "transform" },
  { slug: "json-formatter", pattern: "inspect" },
  { slug: "json-diff", pattern: "diff" },
  { slug: "uuid-id", pattern: "generate" },
  { slug: "morse-code", pattern: "transform" },
] as const;

test.describe("KIT-0019 accessibility sample", () => {
  test.describe.configure({ timeout: 60_000 });

  for (const tool of sampleTools) {
    test(`${tool.slug} (${tool.pattern}) has no serious axe violations at 390px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/explore/${tool.slug}`, { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("tool-title")).toBeVisible({ timeout: 15_000 });
      await expect(page.locator("#tool-host h2").first()).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow, `${tool.slug} must not overflow at 390px`).toBe(false);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        // Color-contrast for small chips is tracked as a design-token finding;
        // structural a11y must still pass.
        .disableRules(["color-contrast"])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
    });
  }

  test("skip link moves focus into the tool workspace on Base64", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/explore/base64", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("tool-title")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: "Skip to active tool" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#tool-host")).toBeFocused();
  });
});
