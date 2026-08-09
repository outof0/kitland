import { expect, test } from "@playwright/test";

test("keeps the suite catalog separate from its Base64 reference implementation", async ({
  page,
}) => {
  await page.goto("/");

  const exploreTools = page.getByRole("link", { name: "Explore the catalog" });
  await expect(exploreTools).toHaveAttribute("href", "/explore");
  await exploreTools.click();

  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("complete local workbench");

  await page.getByRole("link", { name: "Open tool" }).click();
  await expect(page).toHaveURL(/\/explore\/base64$/);
  await expect(page.getByTestId("tool-title")).toHaveText("Base64");
});

test("serves Base64 with a meaningful static document", async ({ page, request }) => {
  const response = await request.get("/explore/base64");
  expect(response.ok()).toBe(true);

  const html = await response.text();
  expect(html).toMatch(/<title>Base64 Encode \/ Decode/);
  expect(html).toMatch(/<h1\b[^>]*>Base64<\/h1>/);

  const notFoundResponse = await request.get("/explore/not-a-tool");
  expect(notFoundResponse.status()).toBe(404);
  expect(await notFoundResponse.text()).toMatch(/<h1>That tool is not here\.<\/h1>/);

  const legacyResponse = await request.get("/tools/base64");
  expect(legacyResponse.status()).toBe(404);

  await page.goto("/explore/base64");
  await expect(page).toHaveTitle(/Base64 Encode \/ Decode/);
  await expect(page.locator("h1")).toHaveText("Base64");
});

test("keeps global tool search in the header and the collapsed rail usable", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("kitland.sidebarCollapsed", "true"));
  await page.goto("/explore/base64");

  // Legacy storage must not cause a post-hydration width jump. Collapse is a
  // deliberate session action, so the workspace always opens at its stable
  // full width.
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
  await page.getByRole("button", { name: "Collapse sidebar" }).click();

  const rail = page.getByTestId("tool-sidebar-collapsed");
  const railTool = rail.getByRole("link", { name: "Base64" });
  await expect(railTool).toBeVisible();
  await expect(railTool).toHaveAttribute("href", "/explore/base64");
  await rail.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();

  const headerSearch = page.getByTestId("tool-search-desktop");
  const searchInput = headerSearch.getByRole("searchbox", { name: "Search tools" });
  await page.keyboard.press("Control+k");
  await expect(searchInput).toBeFocused();
  await searchInput.fill("base");

  const result = headerSearch.getByTestId("tool-search-results").getByRole("link", {
    name: "Base64",
  });
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/explore\/base64$/);
  await expect(headerSearch.getByTestId("tool-search-results")).toHaveCount(0);
});

test("opens the same tool search from the mobile header", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore/base64");

  await page.getByRole("button", { name: "Search tools" }).click();
  const searchInput = page.getByRole("searchbox", { name: "Search tools" });
  await expect(searchInput).toBeFocused();
  await searchInput.fill("base");

  const mobilePanel = page.getByTestId("tool-search-mobile");
  await expect(mobilePanel.getByRole("link", { name: "Base64" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(mobilePanel).toHaveCount(0);
});

test("encodes, swaps, reports invalid Base64, and recovers", async ({ page }) => {
  await page.goto("/explore/base64");

  const encodeInput = page.getByRole("textbox", { name: "UTF-8 text input" });
  const encodedOutput = page.getByRole("textbox", { name: "Standard Base64 result" });
  await encodeInput.fill("Kitland");
  await expect(encodedOutput).toHaveValue("S2l0bGFuZA==");

  await page.getByRole("button", { name: "Use the result as input and switch to Decode" }).click();

  const decodeInput = page.getByRole("textbox", { name: "Standard Base64 input" });
  const decodedOutput = page.getByRole("textbox", { name: "UTF-8 text result" });
  await expect(decodeInput).toHaveValue("S2l0bGFuZA==");
  await expect(decodedOutput).toHaveValue("Kitland");

  await decodeInput.fill("@@@@");
  await expect(page.getByRole("alert")).toContainText("Input is not valid Base64.");
  await expect(decodedOutput).toHaveValue("");

  await decodeInput.fill("S2l0bGFuZA==");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(decodedOutput).toHaveValue("Kitland");
});

test("keeps both editor panes stable while validation changes", async ({ page }) => {
  await page.goto("/explore/base64");

  await page.getByRole("button", { name: "Use the result as input and switch to Decode" }).click();
  const input = page.getByRole("textbox", { name: "Standard Base64 input" });
  await expect(input).toHaveValue("SGVsbG8sIHdvcmxkIQpUaGlzIGlzIGEgc2VjcmV0IG1lc3NhZ2Uu");
  await expect(page.getByRole("textbox", { name: "UTF-8 text result" })).toHaveValue(
    "Hello, world!\nThis is a secret message.",
  );

  const geometry = async () =>
    page.locator(".tool-editor").evaluate((editor) => {
      const inputCard = editor.querySelector(".tool-card--in")?.getBoundingClientRect();
      const outputCard = editor.querySelector(".tool-card--out")?.getBoundingClientRect();
      return {
        editor: editor.getBoundingClientRect().toJSON(),
        input: inputCard?.toJSON(),
        output: outputCard?.toJSON(),
      };
    });

  const before = await geometry();
  await input.fill("@@@@");
  await expect(page.getByRole("alert")).toContainText("Input is not valid Base64.");
  expect(await geometry()).toEqual(before);

  await input.fill("SGVsbG8sIHdvcmxkIQpUaGlzIGlzIGEgc2VjcmV0IG1lc3NhZ2Uu");
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(await geometry()).toEqual(before);
});

test("writes a fragment-only share link and restores it after reload", async ({ page }) => {
  await page.goto("/explore/base64?campaign=should-not-be-shared");

  const input = page.getByRole("textbox", { name: "UTF-8 text input" });
  await input.fill("Share me ✓");
  await page.getByRole("button", { name: "Share input link" }).click();

  await expect.poll(() => new URL(page.url()).hash).toMatch(/^#base64\?/);
  const sharedUrl = new URL(page.url());
  expect(sharedUrl.search).toBe("");

  const params = new URLSearchParams(sharedUrl.hash.slice("#base64?".length));
  expect(Object.fromEntries(params)).toEqual({
    format: "standard",
    input: "Share me ✓",
    mode: "encode",
  });

  await page.reload();
  await expect(page.getByRole("textbox", { name: "UTF-8 text input" })).toHaveValue("Share me ✓");
  await expect(page.getByRole("textbox", { name: "Standard Base64 result" })).toHaveValue(
    "U2hhcmUgbWUg4pyT",
  );
});

test("keeps mobile drawer focus contained and restores it after Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore/base64");

  const menu = page.getByRole("button", { name: "Open tools navigation" });
  await expect(menu).toBeVisible();
  await menu.click();

  const drawer = page.locator("#tool-navigation");
  const close = drawer.getByRole("button", { name: "Close tools navigation" });
  await expect(drawer).toHaveAttribute("data-open", "true");
  await expect(close).toBeFocused();

  await drawer.getByRole("link", { name: "Kitland home" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() =>
      page.evaluate(
        () => document.activeElement?.closest("#tool-navigation")?.id === "tool-navigation",
      ),
    )
    .toBe(true);

  await page.keyboard.press("Escape");
  await expect(drawer).toHaveAttribute("aria-hidden", "true");
  await expect(menu).toBeFocused();
});
