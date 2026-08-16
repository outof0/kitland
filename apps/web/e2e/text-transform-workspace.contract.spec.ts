import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  expectPaneEmpty,
  expectPaneNotEmpty,
  expectPaneText,
  fillPane,
  paneText,
} from "./support/editor";

const TEXT_TRANSFORMS = [
  {
    slug: "case-converter",
    title: "Case Converter",
    input: "Text",
    output: "Converted",
  },
  {
    slug: "sort-lines",
    title: "Sort Lines",
    input: "Lines",
    output: "Sorted",
  },
  {
    slug: "dedupe-lines",
    title: "Dedupe Lines",
    input: "Lines",
    output: "Unique",
  },
  {
    slug: "text-reverser",
    title: "Text Reverser",
    input: "Text",
    output: "Reversed",
  },
] as const;

test.describe("text transform workspace contract", () => {
  test("starts every transform empty and restores a focused Sample/Clear flow", async ({
    page,
  }) => {
    for (const tool of TEXT_TRANSFORMS) {
      await page.goto(`/explore/${tool.slug}`);
      const input = page.getByRole("textbox", { name: tool.input });
      const output = page.getByRole("textbox", { name: tool.output });

      await expectPaneEmpty(input);
      await expectPaneEmpty(output);
      await expect(page.getByLabel(`${tool.title} status`)).toContainText("Waiting");
      await expect(page.getByRole("button", { name: "Clear input", exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: `Copy ${tool.input}` })).toBeDisabled();
      await expect(page.getByRole("button", { name: `Copy ${tool.output}` })).toBeDisabled();

      await page.getByRole("button", { name: "Sample", exact: true }).click();
      await expect(input).toBeFocused();
      await expectPaneNotEmpty(input);
      await expectPaneNotEmpty(output);
      await expect(page.getByLabel(`${tool.title} status`)).toContainText("Ready");

      await page.getByRole("button", { name: "Clear input", exact: true }).click();
      await expect(input).toBeFocused();
      await expectPaneEmpty(input);
      await expectPaneEmpty(output);
    }
  });

  test("keeps both copy actions and the input-toolbar clear action", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/explore/case-converter");

    const input = page.getByRole("textbox", { name: "Text" });
    const output = page.getByRole("textbox", { name: "Converted" });
    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await expectPaneText(output, "hello_world_example");

    await page.getByRole("button", { name: "Copy Text" }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(await paneText(input));

    await page.getByRole("button", { name: "Copy Converted" }).click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(await paneText(output));

    await page.getByRole("button", { name: "Clear input", exact: true }).click();
    await expect(input).toBeFocused();
    await expectPaneEmpty(input);
    await expectPaneEmpty(output);
    for (const action of ["Upload", "Download", "Share", "Save", "Swap"]) {
      await expect(page.getByRole("button", { name: action, exact: true })).toHaveCount(0);
    }
  });

  test("keeps the densest option set accessible and inside a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/explore/text-reverser");

    await expect(page.getByRole("group", { name: "Reverse mode" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Output case" })).toBeVisible();
    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await page.getByRole("button", { name: "Line order" }).click();
    await expectPaneNotEmpty(page.getByRole("textbox", { name: "Reversed" }));

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("keeps editor cards bounded and scrolls a long paste internally", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/explore/case-converter");

    const input = page.getByRole("textbox", { name: "Text" });
    const inputCard = page.locator(".tool-card--in");
    const initialHeight = await inputCard.evaluate((card) => card.getBoundingClientRect().height);
    const longPaste = Array.from({ length: 1_200 }, (_, index) => `long pasted line ${index}`).join(
      "\n",
    );

    await fillPane(input, longPaste);
    await expectPaneNotEmpty(input);

    const geometry = await inputCard.evaluate((card) => {
      const scroller = card.querySelector<HTMLElement>(".cm-scroller");
      return {
        cardHeight: card.getBoundingClientRect().height,
        scrollsInternally: Boolean(scroller && scroller.scrollHeight > scroller.clientHeight),
      };
    });

    expect(geometry.cardHeight).toBeCloseTo(initialHeight, 0);
    expect(geometry.scrollsInternally).toBe(true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/explore/case-converter");

    const mobileInput = page.getByRole("textbox", { name: "Text" });
    const mobileInputCard = page.locator(".tool-card--in");
    const mobileInitialHeight = await mobileInputCard.evaluate(
      (card) => card.getBoundingClientRect().height,
    );
    await fillPane(mobileInput, longPaste);

    const mobileGeometry = await mobileInputCard.evaluate((card) => {
      const scroller = card.querySelector<HTMLElement>(".cm-scroller");
      return {
        cardHeight: card.getBoundingClientRect().height,
        scrollsInternally: Boolean(scroller && scroller.scrollHeight > scroller.clientHeight),
      };
    });

    expect(mobileGeometry.cardHeight).toBeCloseTo(mobileInitialHeight, 0);
    expect(mobileGeometry.cardHeight).toBeLessThanOrEqual(844 * 0.6 + 1);
    expect(mobileGeometry.scrollsInternally).toBe(true);
  });

  test("never renders a stale result when the source changes rapidly", async ({ page }) => {
    await page.goto("/explore/case-converter");
    const input = page.getByRole("textbox", { name: "Text" });
    const output = page.getByRole("textbox", { name: "Converted" });

    await fillPane(input, "first input");
    await fillPane(input, "second input");
    await expectPaneText(output, "second_input");
    await page.waitForTimeout(400);
    await expectPaneText(output, "second_input");
    await expect(page.getByLabel("Case Converter status")).toContainText("Ready");
  });

  test("swaps split-to-newlines and join-lines preserving data without full page reload", async ({
    page,
  }) => {
    await page.goto("/explore/split-to-newlines");
    const input = page.getByRole("textbox", { name: "Delimited text" });
    const output = page.getByRole("textbox", { name: "Lines" });

    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await expectPaneText(input, "apple, banana, orange, grape");
    await expectPaneText(output, "apple\nbanana\norange\ngrape");

    // Click Swap in Action Rail
    await page.getByRole("button", { name: "Swap to Join Lines", exact: true }).click();

    await expect(page).toHaveURL(/\/explore\/join-lines$/);
    await expect(page).toHaveTitle("Join Lines — Tools out. Work on. | Kitland");
    await expect(
      page
        .getByRole("navigation", { name: "Registered tools" })
        .getByRole("button", { name: "Join Lines", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    const joinInput = page.getByRole("textbox", { name: "Lines" });
    const joinOutput = page.getByRole("textbox", { name: "Delimited text" });
    await expectPaneText(joinInput, "apple\nbanana\norange\ngrape");
    await expectPaneText(joinOutput, "apple, banana, orange, grape");

    // Click Swap back to Split
    await page.getByRole("button", { name: "Swap to Split → Newlines", exact: true }).click();

    await expect(page).toHaveURL(/\/explore\/split-to-newlines$/);
    await expect(page).toHaveTitle("Split → Newlines — Tools out. Work on. | Kitland");
    await expect(
      page
        .getByRole("navigation", { name: "Registered tools" })
        .getByRole("button", { name: "Split → Newlines", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    const splitInput = page.getByRole("textbox", { name: "Delimited text" });
    const splitOutput = page.getByRole("textbox", { name: "Lines" });
    await expectPaneText(splitInput, "apple, banana, orange, grape");
    await expectPaneText(splitOutput, "apple\nbanana\norange\ngrape");
  });
});
