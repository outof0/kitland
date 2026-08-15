import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectPaneText, fillPane, pane } from "./support/editor";

test.describe("text transformation contracts", () => {
  test("case conversion, sorting, deduplication, and reversal update their output", async ({
    page,
  }) => {
    await page.goto("/explore/case-converter");
    await fillPane(pane(page, "Text"), "Hello World API");
    await expectPaneText(pane(page, "Converted"), "hello_world_api");
    await page.getByRole("button", { name: "camelCase" }).click();
    await expectPaneText(pane(page, "Converted"), "helloWorldApi");

    await page.goto("/explore/sort-lines");
    await fillPane(pane(page, "Lines"), "item10\nitem2\nitem1");
    await page.getByRole("button", { name: "Numeric" }).click();
    await expectPaneText(pane(page, "Sorted"), "item1\nitem2\nitem10");
    await page.getByRole("button", { name: "Z → A" }).click();
    await expectPaneText(pane(page, "Sorted"), "item10\nitem2\nitem1");

    await page.goto("/explore/dedupe-lines");
    await fillPane(pane(page, "Lines"), "Tea\ntea\nTea\n🍵");
    await page.getByRole("button", { name: "Case sensitive" }).click();
    await expectPaneText(pane(page, "Unique"), "Tea\n🍵");

    await page.goto("/explore/text-reverser");
    await fillPane(pane(page, "Text"), "first\nsecond\n🍵");
    await page.getByRole("button", { name: "Line order" }).click();
    await expectPaneText(pane(page, "Reversed"), "🍵\nsecond\nfirst");
  });

  test("statistics and diff react to edited input", async ({ page }) => {
    await page.goto("/explore/text-stats");
    await fillPane(pane(page, "Text to measure"), "tea 🍵");
    const statistics = page.getByLabel("Text statistics");
    await expect(statistics.getByText("Graphemes", { exact: true }).locator("..")).toContainText(
      "5",
    );
    await expect(statistics.getByText("Words", { exact: true }).locator("..")).toContainText("1");

    await page.goto("/explore/text-diff");
    await fillPane(pane(page, "Original"), "one\ntwo");
    await fillPane(pane(page, "Changed"), "one\nthree\nfour");
    await expect(page.getByLabel("Diff result")).toContainText("three");
    await expect(page.getByLabel("Diff result")).toContainText("+2");
    await expect(page.getByLabel("Diff result")).toContainText("−1");
  });

  test("regex tester runs valid patterns and reports invalid syntax", async ({ page }) => {
    await page.goto("/explore/regex-tester");
    await page.getByRole("textbox", { name: "Pattern" }).fill("\\d+");
    await page.getByRole("textbox", { name: "Flags" }).fill("g");
    await page.getByRole("textbox", { name: "Test text" }).fill("a1 b22");
    await expect(page.getByLabel("Regex matches")).toContainText("2 matches");
    await expect(page.getByLabel("Regex matches")).toContainText("22");

    await page.getByRole("textbox", { name: "Pattern" }).fill("[");
    await expect(page.getByRole("alert")).toContainText("Invalid regular expression");
  });
});

test.describe("generator contracts", () => {
  test("generator tools start empty and stay accessible on a narrow viewport", async ({ page }) => {
    const tools = [
      {
        slug: "lorem-ipsum",
        output: "Generated Lorem Ipsum",
        copy: "Copy Generated Lorem Ipsum",
        download: "Download Generated Lorem Ipsum",
      },
      {
        slug: "random-number",
        output: "Random Number",
        copy: "Copy Random Number",
        download: "Download Random Number",
      },
    ] as const;

    await page.setViewportSize({ width: 320, height: 720 });

    for (const tool of tools) {
      await page.goto(`/explore/${tool.slug}`);
      await expect(page.getByRole("region", { name: tool.output, exact: true })).toContainText(
        "Generate a value to see it here.",
      );
      await expect(page.getByRole("button", { name: tool.copy, exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: tool.download, exact: true })).toBeDisabled();

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    }
  });

  test("lorem, random ports, and random numbers generate bounded local results", async ({
    page,
  }) => {
    await page.goto("/explore/lorem-ipsum");
    await page.getByRole("spinbutton", { name: "Amount" }).fill("7");
    await page.getByRole("combobox", { name: "Generate by" }).selectOption("words");
    await page.getByRole("button", { name: "Generate Lorem Ipsum" }).click();
    await expect(page.getByRole("region", { name: "Generated Lorem Ipsum" })).toContainText(
      "Lorem ipsum dolor sit amet",
    );

    await page.goto("/explore/random-port");
    await page.getByRole("combobox", { name: "Port range" }).selectOption("ephemeral");
    await page.getByRole("combobox", { name: "Port count" }).selectOption("3");
    await page.getByRole("button", { name: "Pick Port" }).click();
    const portResult = page.locator("section").filter({ hasText: "Next available port" });
    await expect(portResult).toContainText("dynamic range");
    await expect(portResult).toContainText("More Generated");
    const portTexts = await portResult.locator("span.font-mono").allInnerTexts();
    const ports = portTexts
      .map((text) => Number(text.replace(/,/g, "")))
      .filter((n) => Number.isInteger(n) && n > 0);
    expect(ports.length).toBeGreaterThanOrEqual(3);
    expect(new Set(ports).size).toBe(ports.length);
    expect(ports.every((port) => port >= 49152 && port <= 65535)).toBe(true);
    await page.getByRole("combobox", { name: "Port range" }).selectOption("dynamic");
    await expect(portResult).toContainText("dynamic range");

    await page.goto("/explore/random-number");
    await page.getByRole("spinbutton", { name: "From" }).fill("-1");
    await page.getByRole("spinbutton", { name: "To" }).fill("1");
    await page.getByRole("spinbutton", { name: "Decimals" }).fill("2");
    await page.getByRole("spinbutton", { name: "Count" }).fill("3");
    await page.getByRole("button", { name: "Roll Number" }).click();
    const numberOutput = page.getByRole("region", {
      name: "Random Number",
      exact: true,
    });
    const generatedText = await numberOutput.locator("code").innerText();
    const generatedValues = generatedText.split("\n");
    const values = generatedValues.map(Number);
    expect(values).toHaveLength(3);
    expect(values.every((value) => value >= -1 && value <= 1)).toBe(true);
    expect(generatedValues.every((value) => /^-?\d+\.\d{2}$/.test(value))).toBe(true);
    await page.getByRole("spinbutton", { name: "Decimals" }).fill("0");
    await expect(numberOutput.locator("code")).toHaveText(generatedText);
    await expect(numberOutput).toContainText("2 decimals · uniform");
  });

  test("UUID starts uncopied and produces RFC 4122 v4 identifiers", async ({ page }) => {
    await page.goto("/explore/uuid-id");
    const copy = page.getByRole("button", { name: "Copy generated UUID" });
    await expect(copy).toHaveText("Copy");
    await expect(copy).toBeDisabled();

    await page.getByRole("button", { name: "Generate UUID" }).click();
    await expect(copy).toBeEnabled();
    await expect(
      page.getByText(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i),
    ).toBeVisible();
  });
});
