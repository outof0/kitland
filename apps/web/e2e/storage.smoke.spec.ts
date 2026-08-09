import { expect, test, type Page } from "@playwright/test";

const THEME_KEY = "kitland.theme";
const FAVORITES_KEY = "kitland.favorites";

test("recovers from malformed preferences and stores validated v1 envelopes", async ({ page }) => {
  await page.addInitScript(
    ({ themeKey, favoritesKey }) => {
      localStorage.setItem(themeKey, JSON.stringify({ unexpected: true }));
      localStorage.setItem(favoritesKey, "{");
    },
    { themeKey: THEME_KEY, favoritesKey: FAVORITES_KEY },
  );

  await page.goto("/explore/base64");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Add to favorites" })).toBeVisible();
  await expect
    .poll(() => readStoredPreference(page, THEME_KEY))
    .toEqual({ version: 1, value: "dark" });
  await expect
    .poll(() => readStoredPreference(page, FAVORITES_KEY))
    .toEqual({ version: 1, value: [] });
});

test("migrates valid legacy preferences and canonicalizes favorite slugs", async ({ page }) => {
  await page.addInitScript(
    ({ themeKey, favoritesKey }) => {
      localStorage.setItem(themeKey, JSON.stringify("light"));
      localStorage.setItem(favoritesKey, JSON.stringify(["base64", "base64"]));
    },
    { themeKey: THEME_KEY, favoritesKey: FAVORITES_KEY },
  );

  await page.goto("/explore/base64");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Remove from favorites" })).toBeVisible();
  await expect
    .poll(() => readStoredPreference(page, THEME_KEY))
    .toEqual({ version: 1, value: "light" });
  await expect
    .poll(() => readStoredPreference(page, FAVORITES_KEY))
    .toEqual({ version: 1, value: ["base64"] });
});

test("preserves future envelopes until the user explicitly changes a preference", async ({
  page,
}) => {
  await page.addInitScript(
    ({ themeKey, favoritesKey }) => {
      localStorage.setItem(themeKey, JSON.stringify({ version: 99, value: "light" }));
      localStorage.setItem(favoritesKey, JSON.stringify({ version: 99, value: ["base64"] }));
    },
    { themeKey: THEME_KEY, favoritesKey: FAVORITES_KEY },
  );

  await page.goto("/explore/base64");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Add to favorites" })).toBeVisible();
  expect(await readStoredPreference(page, THEME_KEY)).toEqual({ version: 99, value: "light" });
  expect(await readStoredPreference(page, FAVORITES_KEY)).toEqual({
    version: 99,
    value: ["base64"],
  });

  await page.getByRole("button", { name: "Use light theme" }).click();
  await page.getByRole("button", { name: "Add to favorites" }).click();

  await expect
    .poll(() => readStoredPreference(page, THEME_KEY))
    .toEqual({ version: 1, value: "light" });
  await expect
    .poll(() => readStoredPreference(page, FAVORITES_KEY))
    .toEqual({ version: 1, value: ["base64"] });
});

async function readStoredPreference(page: Page, key: string): Promise<unknown> {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  }, key);
}
