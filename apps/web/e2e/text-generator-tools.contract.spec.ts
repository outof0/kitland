import { expect, test } from "@playwright/test";

test.describe("text transformation contracts", () => {
  test("case conversion, sorting, deduplication, and reversal update their output", async ({
    page,
  }) => {
    await page.goto("/explore/case-converter");
    await page.getByRole("textbox", { name: "Text" }).fill("Hello World API");
    await expect(page.getByRole("textbox", { name: "Converted" })).toHaveValue("hello_world_api");
    await page.getByRole("button", { name: "camelCase" }).click();
    await expect(page.getByRole("textbox", { name: "Converted" })).toHaveValue("helloWorldApi");

    await page.goto("/explore/sort-lines");
    await page.getByRole("textbox", { name: "Lines" }).fill("item10\nitem2\nitem1");
    await page.getByRole("button", { name: "Numeric" }).click();
    await expect(page.getByRole("textbox", { name: "Sorted" })).toHaveValue("item1\nitem2\nitem10");
    await page.getByRole("button", { name: "Z → A" }).click();
    await expect(page.getByRole("textbox", { name: "Sorted" })).toHaveValue("item10\nitem2\nitem1");

    await page.goto("/explore/dedupe-lines");
    await page.getByRole("textbox", { name: "Lines" }).fill("Tea\ntea\nTea\n🍵");
    await page.getByRole("button", { name: "Case sensitive" }).click();
    await expect(page.getByRole("textbox", { name: "Unique" })).toHaveValue("Tea\n🍵");

    await page.goto("/explore/text-reverser");
    await page.getByRole("textbox", { name: "Text" }).fill("first\nsecond\n🍵");
    await page.getByRole("button", { name: "Line order" }).click();
    await expect(page.getByRole("textbox", { name: "Reversed" })).toHaveValue("🍵\nsecond\nfirst");
  });

  test("statistics and diff react to edited input", async ({ page }) => {
    await page.goto("/explore/text-stats");
    await page.getByRole("textbox", { name: "Text to measure" }).fill("tea 🍵");
    const statistics = page.getByLabel("Text statistics");
    await expect(statistics.getByText("Graphemes", { exact: true }).locator("..")).toContainText(
      "5",
    );
    await expect(statistics.getByText("Words", { exact: true }).locator("..")).toContainText("1");

    await page.goto("/explore/text-diff");
    await page.getByRole("textbox", { name: "Original" }).fill("one\ntwo");
    await page.getByRole("textbox", { name: "Changed" }).fill("one\nthree\nfour");
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
    await page.getByRole("combobox", { name: "Range" }).selectOption("ephemeral");
    await page.getByRole("spinbutton", { name: "Count" }).fill("3");
    await page.getByRole("button", { name: "Pick Port" }).click();
    const portOutput = page.getByRole("region", { name: "Random Port", exact: true });
    await expect(portOutput).not.toContainText("Generate a value");
    const ports = (await portOutput.locator("code").innerText()).split("\n").map(Number);
    expect(ports).toHaveLength(3);
    expect(new Set(ports).size).toBe(3);
    expect(ports.every((port) => Number.isInteger(port) && port >= 49152 && port <= 65535)).toBe(
      true,
    );
    await page.getByRole("combobox", { name: "Range" }).selectOption("dynamic");
    await expect(portOutput).toContainText("49152–65535 · TCP");

    await page.goto("/explore/random-number");
    await page.getByRole("spinbutton", { name: "From" }).fill("-1");
    await page.getByRole("spinbutton", { name: "To" }).fill("1");
    await page.getByRole("spinbutton", { name: "Decimals" }).fill("2");
    await page.getByRole("spinbutton", { name: "Count" }).fill("3");
    await page.getByRole("button", { name: "Roll Number" }).click();
    const values = (
      await page
        .getByRole("region", { name: "Random Number", exact: true })
        .locator("code")
        .innerText()
    )
      .split("\n")
      .map(Number);
    expect(values).toHaveLength(3);
    expect(values.every((value) => value >= -1 && value <= 1)).toBe(true);
    expect(values.every((value) => Number.isInteger(value * 100))).toBe(true);
    const numberOutput = page.getByRole("region", { name: "Random Number", exact: true });
    const generatedText = await numberOutput.locator("code").innerText();
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
