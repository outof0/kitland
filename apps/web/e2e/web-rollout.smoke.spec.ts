import { listAvailableTools, listSurfaceRolloutTools, listTools } from "@kitland/tools";
import { expect, test } from "@playwright/test";

const catalogTools = listTools();
const availableTools = listAvailableTools();
const plannedTools = catalogTools.filter((tool) => tool.status !== "available");
const rolloutTools = listSurfaceRolloutTools("web");

test("keeps every catalog-available tool accessible while certifying rollout targets", async ({
  page,
  request,
}) => {
  expect(rolloutTools.length).toBeGreaterThan(0);
  expect(rolloutTools.every((tool) => tool.status === "available")).toBe(true);

  const catalogResponse = await request.get("/explore");
  expect(catalogResponse.ok()).toBe(true);

  await page.goto("/explore");
  await expect(page.locator("[data-explore-card]")).toHaveCount(catalogTools.length);
  await expect(page.locator("[data-explore-family-group]")).toHaveCount(6);
  await expect(page.locator('[data-explore-card][data-explore-action="open"]')).toHaveCount(
    availableTools.length,
  );
  await expect(page.locator('[data-explore-card][data-explore-action="planned"]')).toHaveCount(
    plannedTools.length,
  );

  for (const tool of availableTools) {
    await expect(page.getByRole("link", { name: `Open ${tool.name}` })).toBeVisible();
  }
  for (const tool of plannedTools) {
    await expect(page.getByLabel(`${tool.name}, planned`)).toHaveCount(1);
    await expect(page.locator(`a[href="/explore/${tool.slug}"]`)).toHaveCount(0);
  }

  const editorLinks = await page
    .locator('[data-explore-card] a[href^="/explore/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")).sort());
  expect(editorLinks).toEqual(availableTools.map((tool) => `/explore/${tool.slug}`).sort());

  const routeResponses = await Promise.all(
    availableTools.map((tool) => request.get(`/explore/${tool.slug}`)),
  );
  expect(routeResponses.every((response) => response.ok())).toBe(true);

  for (const tool of rolloutTools) {
    await expect(page.getByRole("link", { name: `Open ${tool.name}` })).toBeVisible();
  }

  const landingResponse = await request.get("/");
  expect(landingResponse.ok()).toBe(true);
  const landingHtml = await landingResponse.text();
  expect(landingHtml).toMatch(
    new RegExp(`${catalogTools.length}(?:<!--\\s*-->)?\\s*LOCAL-FIRST TOOLS`),
  );
  expect(landingHtml).toContain("RELEASE ROADMAP");
});
