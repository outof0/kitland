import { expect, test } from "@playwright/test";

test.describe("encoding tool contracts", () => {
  test("URL Encode preserves URI semantics and rejects malformed input", async ({ page }) => {
    await page.goto("/explore/url-encode");

    const input = page.getByRole("textbox", { name: "URL component input" });
    const output = page.getByRole("textbox", { name: "Percent-encoded result" });
    await input.fill("cà phê + 🍵");
    await expect(output).toHaveValue("c%C3%A0%20ph%C3%AA%20%2B%20%F0%9F%8D%B5");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Percent-encoded input" })).toHaveValue(
      "c%C3%A0%20ph%C3%AA%20%2B%20%F0%9F%8D%B5",
    );
    await expect(page.getByRole("textbox", { name: "URL component result" })).toHaveValue(
      "cà phê + 🍵",
    );

    await page.getByRole("textbox", { name: "Percent-encoded input" }).fill("%E0%A4%A");
    await expect(page.getByRole("alert")).toContainText("malformed percent escapes");
  });

  test("HTML Entities supports named and numeric forms", async ({ page }) => {
    await page.goto("/explore/html-entities");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", { name: "HTML Entities result" });
    await input.fill('<p title="tea & cake">🍵</p>');
    await expect(output).toHaveValue("&lt;p title=&quot;tea &amp; cake&quot;&gt;🍵&lt;/p&gt;");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Text result" })).toHaveValue(
      '<p title="tea & cake">🍵</p>',
    );

    await page.getByRole("textbox", { name: "HTML Entities input" }).fill("&madeup;");
    await expect(page.getByRole("alert")).toContainText("supported named-entity set");
  });

  test("Hex Text round-trips UTF-8 and rejects invalid bytes", async ({ page }) => {
    await page.goto("/explore/hex-text");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", { name: "Hex Text result" });
    await input.fill("Hi 🍵");
    await expect(output).toHaveValue("48 69 20 f0 9f 8d b5");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Text result" })).toHaveValue("Hi 🍵");

    await page.getByRole("textbox", { name: "Hex Text input" }).fill("c3 28");
    await expect(page.getByRole("alert")).toContainText("not valid UTF-8");
  });

  test("Unicode Converter round-trips scalar values and validates syntax", async ({ page }) => {
    await page.goto("/explore/unicode-converter");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", { name: "Unicode Converter result" });
    await input.fill("A🍵東");
    await expect(output).toHaveValue("U+0041 U+1F375 U+6771");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Text result" })).toHaveValue("A🍵東");

    await page.getByRole("textbox", { name: "Unicode Converter input" }).fill("U+D800");
    await expect(page.getByRole("alert")).toContainText("outside the Unicode scalar-value range");
  });

  test("Binary Text round-trips UTF-8 and rejects malformed groups", async ({ page }) => {
    await page.goto("/explore/binary-text");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", { name: "Binary Text result" });
    await input.fill("A🍵");
    await expect(output).toHaveValue("01000001 11110000 10011111 10001101 10110101");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Text result" })).toHaveValue("A🍵");

    await page.getByRole("textbox", { name: "Binary Text input" }).fill("0101");
    await expect(page.getByRole("alert")).toContainText("eight-bit groups");
  });

  test("JSON Escape round-trips one JSON string literal and rejects other JSON values", async ({
    page,
  }) => {
    await page.goto("/explore/json-escape");

    const input = page.getByRole("textbox", { name: "Plain text" });
    const output = page.getByRole("textbox", { name: "JSON string literal" });
    await input.fill('A\n"🍵"');
    await expect(output).toHaveValue('"A\\n\\"🍵\\""');

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save result" }).click();
    expect((await download).suggestedFilename()).toBe("escaped-json.txt");

    await page.getByRole("button", { name: "Unescape" }).click();
    await expect(page.getByRole("textbox", { name: "Plain text" })).toHaveValue('A\n"🍵"');

    await page.getByRole("textbox", { name: "JSON string literal" }).fill("42");
    await expect(page.getByRole("alert")).toContainText("must be a JSON string literal");
  });
});
