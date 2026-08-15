import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { listAvailableTools } from "@kitland/tools";

const featuredTools = listAvailableTools().slice(0, 6);

test("serves a semantic landing without a hydrated application shell", async ({
  page,
  request,
}) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);

  const html = await response.text();
  expect(html).toContain("Tools out.");
  expect(html).toContain("Work on.");
  expect(html).not.toContain("<astro-island");

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tools out. Work on.");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Explore tools" })).toHaveAttribute(
    "href",
    "/explore",
  );
  await expect(page.locator("astro-island")).toHaveCount(0);

  await expect(page.getByRole("link", { name: "Open tool", exact: true })).toHaveCount(
    featuredTools.length,
  );
  for (const tool of featuredTools) {
    await expect(page.locator(`a[href="/explore/${tool.slug}"]`)).toHaveCount(1);
  }

  const catalogResponse = await request.get("/explore");
  expect(catalogResponse.ok()).toBe(true);
  expect(await catalogResponse.text()).not.toContain("<astro-island");
});

for (const viewport of [
  { name: "small mobile", width: 320, height: 720 },
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 900 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
] as const) {
  test(`keeps the ${viewport.name} landing inside the viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open the workbench" })).toBeVisible();
    await expect(page.locator("header details")).toHaveCount(0);
  });
}

test("supports skip navigation and keeps anchor targets below the sticky header", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await skipLink.press("Enter");
  await expect(page.locator("main#main-content")).toBeFocused();

  await page.getByRole("link", { name: "Local-first", exact: true }).first().click();
  await expect(page).toHaveURL(/#local-first$/);
  const targetTop = await page
    .locator("#local-first")
    .evaluate((element) => Math.round(element.getBoundingClientRect().top));
  expect(targetTop).toBeGreaterThanOrEqual(64);
});

test("keeps content visible when reduced motion is requested", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Start with a tool that works today." }),
  ).toBeVisible();
});

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const) {
  test(`has no automated accessibility violations on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(700);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
