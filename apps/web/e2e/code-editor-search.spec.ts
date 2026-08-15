import { expect, test } from "@playwright/test";
import { fillPane } from "./support/editor";

test.describe("CodeEditor Find and Replace (Ctrl+F) UI", () => {
  test("opens floating search widget on Ctrl+F / Cmd+F and interacts correctly with find, replace, and keyboard shortcuts", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/explore/json-formatter");

    const source = page.getByRole("textbox", { name: "JSON input" });
    await fillPane(
      source,
      JSON.stringify(
        {
          name: "Kitland",
          framework: "Astro",
          library: "React",
          tag: "kitland-rocks",
          alt_tag: "kitland-rocks",
        },
        null,
        2,
      ),
    );

    const modKey = process.platform === "darwin" ? "Meta+f" : "Control+f";

    // Focus editor and press Mod+f
    await source.press(modKey);

    // Search widget should be visible
    const searchWidget = page.locator(".cm-search-widget");
    await expect(searchWidget).toBeVisible();

    // Verify search input is focused
    const searchInput = page.locator(".cm-search-input[name='search']");
    await expect(searchInput).toBeFocused();

    // Search for "Kitland"
    await searchInput.fill("Kitland");

    // Verify count badge shows "1 of 1" or matches
    const countBadge = page.locator(".cm-search-count");
    await expect(countBadge).toContainText("1 of");

    // Search for nonexistent string
    await searchInput.fill("nonexistent_string_123");
    await expect(countBadge).toHaveText("No results");

    // Search for "kitland-rocks" (2 occurrences)
    await searchInput.fill("kitland-rocks");
    await expect(countBadge).toHaveText("1 of 2");

    // Press Enter to navigate to next match
    await searchInput.press("Enter");
    await searchInput.press("Enter");
    await expect(countBadge).toHaveText("2 of 2");

    // Press Shift+Enter to find previous
    await searchInput.press("Shift+Enter");
    await expect(countBadge).toHaveText("1 of 2");

    // Test Case Sensitive toggle chip
    const caseChip = page.locator(".cm-search-chip").filter({ hasText: "Aa" });
    await caseChip.click();
    await expect(caseChip).toHaveClass(/is-active/);

    // Test Whole Word toggle chip
    const wordChip = page.locator(".cm-search-chip").filter({ hasText: "\\b" });
    await wordChip.click();
    await expect(wordChip).toHaveClass(/is-active/);

    // Test Regex toggle chip
    const regexChip = page.locator(".cm-search-chip").filter({ hasText: ".*" });
    await regexChip.click();
    await expect(regexChip).toHaveClass(/is-active/);

    // Turn off chips
    await regexChip.click();
    await wordChip.click();
    await caseChip.click();

    // Test Next / Prev buttons
    const nextBtn = page.locator(".cm-search-btn[title*='Next']");
    await nextBtn.click();
    await expect(countBadge).toHaveText("2 of 2");

    const prevBtn = page.locator(".cm-search-btn[title*='Previous']");
    await prevBtn.click();
    await expect(countBadge).toHaveText("1 of 2");

    // Test Toggle Replace
    const toggleReplaceBtn = page.locator(".cm-search-btn-toggle");
    await toggleReplaceBtn.click();

    const replaceInput = page.locator(".cm-search-input[name='replace']");
    await expect(replaceInput).toBeVisible();

    // Test Replace All: replace "kitland-rocks" with "kitland-awesome"
    await replaceInput.fill("kitland-awesome");
    const replaceAllBtn = page.locator(".cm-search-action-btn").filter({ hasText: "All" });
    await replaceAllBtn.click();

    // Verify source now contains "kitland-awesome" twice
    await expect(source).toContainText("kitland-awesome");

    // Test Close button (✕)
    const closeBtn = page.locator(".cm-search-btn-close");
    await closeBtn.click();
    await expect(searchWidget).toBeHidden();

    // Reopen with Mod+f and close with Escape
    await source.press(modKey);
    await expect(searchWidget).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(searchWidget).toBeHidden();
  });
});
