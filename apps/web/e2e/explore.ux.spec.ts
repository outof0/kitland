import { listTools } from "@kitland/tools";
import { expect, test } from "@playwright/test";

const tools = listTools();
const availableTools = tools.filter((tool) => tool.status === "available");
const plannedTools = tools.filter((tool) => tool.status !== "available");

test("renders the complete static registry with only runnable tool links", async ({
  page,
  request,
}) => {
  const response = await request.get("/explore");
  expect(response.ok()).toBe(true);

  const html = await response.text();
  expect(html).toContain('rel="canonical" href="https://kitland.dev/explore"');
  expect(html).toContain('"@type":"CollectionPage"');
  expect(html).not.toContain("<astro-island");

  await page.goto("/explore");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("complete local workbench");
  await expect(page.locator("[data-explore-card]")).toHaveCount(tools.length);
  await expect(page.locator("[data-explore-family-group]")).toHaveCount(6);
  await expect(page.getByRole("status")).toHaveText(`Showing all ${tools.length} tools.`);

  for (const tool of availableTools) {
    await expect(page.locator(`a[href="/explore/${tool.slug}"]`)).toHaveCount(1);
  }
  for (const tool of plannedTools) {
    await expect(page.locator(`a[href="/explore/${tool.slug}"]`)).toHaveCount(0);
    await expect(page.getByLabel(`${tool.name}, planned`)).toHaveCount(1);
  }
});

test("filters across searchable registry fields, availability, and clears an empty state", async ({
  page,
}) => {
  await page.goto("/explore");

  const search = page.getByRole("searchbox", { name: "Search all tools" });
  await search.fill("base64");
  await expect(page.getByRole("status")).toHaveText(`Showing 1 of ${tools.length} tools.`);
  await expect(page.getByRole("link", { name: "Open Base64 Encode / Decode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear filters" }).first()).toBeVisible();

  await search.fill("not-a-real-kitland-tool");
  await expect(page.getByRole("heading", { name: "No tools match those filters." })).toBeVisible();
  await expect(page.locator("[data-explore-results]")).toBeHidden();

  await page.getByRole("button", { name: "Clear filters" }).last().click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("status")).toHaveText(`Showing all ${tools.length} tools.`);
  await expect(page.getByRole("heading", { name: "No tools match those filters." })).toBeHidden();

  await page.getByLabel("Available now").check();
  await expect(page.getByRole("status")).toHaveText(
    `Showing ${availableTools.length} of ${tools.length} tools.`,
  );
  await expect(
    page.locator('[data-explore-card][data-explore-availability="planned"]:visible'),
  ).toHaveCount(0);

  await page.getByLabel("Tool family").selectOption("json-markup");
  const availableJsonTools = availableTools.filter((tool) => tool.family === "json-markup");
  await expect(page.getByRole("status")).toHaveText(
    `Showing ${availableJsonTools.length} of ${tools.length} tools.`,
  );
});

for (const viewport of [
  { name: "small mobile", width: 320, height: 720 },
  { name: "desktop", width: 1440, height: 900 },
] as const) {
  test(`keeps the ${viewport.name} registry inside the viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/explore");

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
    await expect(page.getByRole("searchbox", { name: "Search all tools" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Available now" })).toBeVisible();
  });
}
