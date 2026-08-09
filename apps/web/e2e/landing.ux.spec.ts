import { expect, test } from "@playwright/test";

test("serves a semantic landing without a hydrated application shell", async ({
  page,
  request,
}) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);

  const html = await response.text();
  expect(html).toContain("Tools out.");
  expect(html).not.toContain("<astro-island");

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Tools out\.\s*Work on\./);
  await expect(page.getByRole("link", { name: "Explore the catalog" })).toHaveAttribute(
    "href",
    "/explore",
  );
  await expect(page.getByRole("link", { name: "How local-first works" })).toHaveAttribute(
    "href",
    "#principles",
  );
  await expect(page.locator("astro-island")).toHaveCount(0);

  const catalogResponse = await request.get("/explore");
  expect(catalogResponse.ok()).toBe(true);
  expect(await catalogResponse.text()).not.toContain("<astro-island");
});

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 900 },
  { name: "desktop", width: 1280, height: 800 },
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

    await page.goto("/explore");
    const catalogDimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(catalogDimensions.scrollWidth).toBe(catalogDimensions.clientWidth);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("complete local workbench");
  });
}

test("opens the mobile navigation with native disclosure behavior", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const disclosure = page.locator("header details");
  const summary = disclosure.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");

  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure.getByRole("link", { name: "Surfaces" })).toBeVisible();

  await page.keyboard.press("Escape");
  // Native <details> does not promise Escape-to-close; the disclosure remains
  // predictable and operable without client JavaScript.
  await expect(disclosure).toHaveAttribute("open", "");
  await summary.press("Enter");
  await expect(disclosure).not.toHaveAttribute("open", "");
});
