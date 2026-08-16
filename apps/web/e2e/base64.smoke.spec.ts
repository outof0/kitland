import { expect, test } from "@playwright/test";
import { expectPaneEmpty, expectPaneText, fillPane } from "./support/editor";

test("links the landing to the independent tool explorer", async ({ page }) => {
  await page.goto("/");

  const exploreTools = page.getByRole("link", { name: "Explore tools" });
  await expect(exploreTools).toHaveAttribute("href", "/explore");
  await exploreTools.click();

  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("complete local workbench");

  await page.locator('a[href="/explore/base64"]').click();
  await expect(page).toHaveURL(/\/explore\/base64$/);
  await expect(page.getByTestId("tool-title")).toHaveText("Base64 Encode / Decode");
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
  await expect(page.getByTestId("tool-title")).toHaveText("Base64 Encode / Decode");
});

test("keeps the shared sidebar search reachable by keyboard and navigable", async ({ page }) => {
  await page.goto("/explore/base64");

  await expect(page.getByTestId("tool-title")).toBeVisible();
  await page.keyboard.press("Control+k");
  const searchInput = page.getByRole("combobox", {
    name: "Search registered tools",
  });
  await expect(searchInput).toBeFocused();

  await searchInput.fill("base");
  const result = page.getByRole("option", { name: /Base64/ });
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/explore\/base64$/);
});

test("clears the shared sidebar search with Escape and restores the catalog", async ({ page }) => {
  await page.goto("/explore/base64");

  const catalog = page.getByRole("navigation", { name: "Registered tools" });
  await expect(catalog.getByRole("button", { name: "Base64", exact: true })).toBeVisible();

  await page.keyboard.press("Control+k");
  const searchInput = page.getByRole("combobox", {
    name: "Search registered tools",
  });
  await searchInput.fill("base");
  await expect(page.getByRole("option", { name: /JSON Formatter/ })).toHaveCount(0);
  await expect(catalog.getByRole("button", { name: "JSON Formatter", exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(searchInput).toHaveCount(0);
  await expect(catalog.getByRole("button", { name: "JSON Formatter", exact: true })).toBeVisible();
});

test("keeps the shared shell usable at mobile width without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore/base64");

  await expect(page.getByTestId("tool-title")).toBeVisible();
  await page.keyboard.press("Control+k");
  const searchInput = page.getByRole("combobox", {
    name: "Search registered tools",
  });
  await searchInput.fill("base");
  await expect(page.getByRole("option", { name: /Base64/ })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
  await expect(page.getByRole("button", { name: "Add to favorites" })).toBeVisible();
});

test("expands the category of the active tool and marks its row", async ({ page }) => {
  await page.goto("/explore/base64");

  const catalog = page.getByRole("navigation", { name: "Registered tools" });
  const category = catalog.getByRole("button", { name: /Encode \/ Decode/ });
  await expect(category).toHaveAttribute("aria-expanded", "true");
  await expect(catalog.getByRole("button", { name: "Base64", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await category.click();
  await expect(category).toHaveAttribute("aria-expanded", "false");
  await expect(catalog.getByRole("button", { name: "Base64", exact: true })).toHaveCount(0);

  await category.click();
  await expect(catalog.getByRole("button", { name: "Base64", exact: true })).toBeVisible();
});

test("encodes, swaps, reports invalid Base64, and recovers", async ({ page }) => {
  await page.goto("/explore/base64");

  const encodeInput = page.getByRole("textbox", { name: "UTF-8 text input" });
  const encodedOutput = page.getByRole("textbox", {
    name: "Standard Base64 result",
  });
  await fillPane(encodeInput, "Kitland");
  await expectPaneText(encodedOutput, "S2l0bGFuZA==");

  await page
    .getByRole("button", {
      name: "Use the result as input and switch to Decode",
    })
    .click();

  const decodeInput = page.getByRole("textbox", {
    name: "Standard Base64 input",
  });
  const decodedOutput = page.getByRole("textbox", {
    name: "UTF-8 text result",
  });
  await expectPaneText(decodeInput, "S2l0bGFuZA==");
  await expectPaneText(decodedOutput, "Kitland");

  await fillPane(decodeInput, "@@@@");
  await expect(page.getByRole("alert")).toContainText("Input is not valid Base64.");
  await expectPaneEmpty(decodedOutput);

  await fillPane(decodeInput, "/w==");
  await expect(page.getByRole("alert")).toContainText(
    "Base64 decoded successfully, but the payload is not valid UTF-8 text.",
  );
  await expectPaneEmpty(decodedOutput);

  await fillPane(decodeInput, `S2l0${String.fromCodePoint(0x00a0)}bGFuZA==`);
  await expect(page.getByRole("alert")).toContainText("Input is not valid Base64.");
  await expectPaneEmpty(decodedOutput);

  await fillPane(decodeInput, "S2l0bGFuZA==");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expectPaneText(decodedOutput, "Kitland");
});

test("replaces stale worker work and keeps metadata aligned with the latest input", async ({
  page,
}) => {
  test.slow();
  await page.addInitScript(() => {
    const counts = { posts: 0, terminations: 0 };
    Object.defineProperty(window, "__base64WorkerCounts", { value: counts });

    const postMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (
      this: Worker,
      ...args: Parameters<Worker["postMessage"]>
    ) {
      counts.posts += 1;
      window.setTimeout(() => postMessage.apply(this, args), 250);
    } as Worker["postMessage"];

    const terminate = Worker.prototype.terminate;
    Worker.prototype.terminate = function (this: Worker) {
      counts.terminations += 1;
      return terminate.call(this);
    };
  });
  await page.goto("/explore/base64");

  const input = page.getByRole("textbox", { name: "UTF-8 text input" });
  const output = page.getByRole("textbox", { name: "Standard Base64 result" });
  await fillPane(input, "x".repeat(25_000));
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __base64WorkerCounts: { posts: number };
              }
            ).__base64WorkerCounts.posts,
        ),
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);

  await fillPane(input, "first\nsecond\r\nthird\rfourth");
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (
              window as typeof window & {
                __base64WorkerCounts: { terminations: number };
              }
            ).__base64WorkerCounts.terminations,
        ),
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0);

  await expectPaneText(output, "Zmlyc3QKc2Vjb25kCnRoaXJkCmZvdXJ0aA==");
  await expect(page.locator(".tool-card--in .tool-card__hint")).toContainText("10 lines");
  await expect(page.getByRole("button", { name: "Copy Standard Base64 result" })).toBeEnabled();
});

test("keeps both editor panes stable while validation changes", async ({ page }) => {
  await page.goto("/explore/base64");

  await page
    .getByRole("button", {
      name: "Use the result as input and switch to Decode",
    })
    .click();
  const input = page.getByRole("textbox", { name: "Standard Base64 input" });
  await expectPaneText(input, "SGVsbG8sIHdvcmxkIQpUaGlzIGlzIGEgc2VjcmV0IG1lc3NhZ2Uu");
  await expectPaneText(
    page.getByRole("textbox", { name: "UTF-8 text result" }),
    "Hello, world!\nThis is a secret message.",
  );

  const geometry = async () =>
    page.locator(".tool-card").evaluateAll((cards) => {
      const first = cards[0]?.getBoundingClientRect();
      const second = cards[1]?.getBoundingClientRect();
      return {
        firstHeight: first?.height ?? 0,
        secondHeight: second?.height ?? 0,
        topOffset: Math.abs((first?.top ?? 0) - (second?.top ?? 0)),
      };
    });

  const before = await geometry();
  await fillPane(input, "@@@@");
  await expect(page.getByRole("alert")).toContainText("Input is not valid Base64.");
  expect(await geometry()).toEqual(before);

  await fillPane(input, "SGVsbG8sIHdvcmxkIQpUaGlzIGlzIGEgc2VjcmV0IG1lc3NhZ2Uu");
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(await geometry()).toEqual(before);
});

test("writes a fragment-only share link and restores it after reload", async ({ page }) => {
  await page.goto("/explore/base64?campaign=should-not-be-shared");

  const input = page.getByRole("textbox", { name: "UTF-8 text input" });
  await fillPane(input, "Share me ✓");
  await page.getByRole("button", { name: "Share input link" }).click();

  await expect.poll(() => new URL(page.url()).hash).toMatch(/^#base64\?/);
  const sharedUrl = new URL(page.url());
  expect(sharedUrl.search).toBe("");
  expect(sharedUrl.hash).toContain("input=Share+me+%E2%9C%93");
  expect(sharedUrl.hash).not.toContain("campaign");

  await expect(page.getByRole("status")).toHaveText(
    "Share link copied. Anyone with the link can see the current input.",
  );
  await expect(page.getByRole("status")).toHaveClass(/bg-surface-low/);
  await expect(page.getByRole("status")).toHaveClass(/border-outline/);
  await expect(page.locator(".tool-card--in textarea")).toBeFocused();

  await page.reload();
  await expectPaneText(page.getByRole("textbox", { name: "UTF-8 text input" }), "Share me ✓");
  await expectPaneText(
    page.getByRole("textbox", { name: "Standard Base64 result" }),
    "U2hhcmUgbWUg4pyT",
  );
});

test("keeps the shared category accordion keyboard operable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/explore/base64");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);

  // At compact widths the catalog is a drawer; open it before focusing categories.
  const drawerToggle = page.getByRole("button", { name: /Open tools navigation/ });
  await expect(drawerToggle).toBeVisible({ timeout: 10_000 });
  await drawerToggle.click();
  await expect(page.getByRole("navigation", { name: "Registered tools" })).toBeVisible();

  const category = page
    .getByRole("navigation", { name: "Registered tools" })
    .getByRole("button", { name: /Encode \/ Decode/ });
  await category.focus();
  await page.keyboard.press("Enter");
  await expect(category).toHaveAttribute("aria-expanded", "false");

  await page.keyboard.press("Enter");
  await expect(category).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("tool-title")).toBeVisible();
});
