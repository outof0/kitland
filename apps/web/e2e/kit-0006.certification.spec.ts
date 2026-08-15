import { expect, test } from "@playwright/test";
import {
  expectPaneEmpty,
  expectPaneNotEmpty,
  expectPaneText,
  fillPane,
  pane,
  paneText,
} from "./support/editor";

/**
 * KIT-0006 Web transform batch A certification.
 * Proves live shells, recovery without stale output, action ownership, Share
 * only where declared, and 390 px no document overflow for each shared shell.
 */

const STRUCTURED = [
  {
    slug: "beautify-minify",
    input: "JSON input",
    output: "Formatted JSON",
    source: '{"name":"Kitland","enabled":true}',
    expected: '{\n  "name": "Kitland",\n  "enabled": true\n}',
    invalid: "{",
  },
  {
    slug: "json-to-yaml",
    input: "JSON input",
    output: "YAML output",
    source: '{"name":"Kitland","enabled":true}',
    expected: '"name": "Kitland"\n"enabled": true\n',
    invalid: "{",
  },
  {
    slug: "yaml-to-json",
    input: "YAML input",
    output: "JSON output",
    source: "items:\n  - name: Widget\n    enabled: true\n",
    expected:
      '{\n  "items": [\n    {\n      "name": "Widget",\n      "enabled": true\n    }\n  ]\n}',
    invalid: "name: one\nname: two",
  },
] as const;

test.describe("KIT-0006 Web certification", () => {
  test("structured transforms: empty, live sample, invalid→valid recovery, single Copy owner", async ({
    page,
  }) => {
    for (const tool of STRUCTURED) {
      await page.goto(`/explore/${tool.slug}`);
      const input = pane(page, tool.input);
      const output = pane(page, tool.output);
      await expectPaneText(input, "");
      await expectPaneText(output, "");
      await expect(page.getByRole("button", { name: `Copy ${tool.output}` })).toBeDisabled();
      // Non-base64 tools must not invent fragment Share.
      await expect(page.getByRole("button", { name: /Share input/i })).toHaveCount(0);

      await page.getByRole("button", { name: "Sample" }).click();
      await expect.poll(async () => paneText(input)).not.toBe("");
      await fillPane(input, tool.source);
      await expectPaneText(output, tool.expected);
      await expect(page.getByRole("button", { name: `Copy ${tool.output}` })).toBeEnabled();

      await fillPane(input, tool.invalid);
      await expect(page.getByRole("alert").first()).toBeVisible();
      await expectPaneText(output, "");
      await fillPane(input, tool.source);
      await expectPaneText(output, tool.expected);
      await expect(page.getByRole("alert")).toHaveCount(0);
    }
  });

  test("encoding transforms: live encode, invalid decode recovery, no Share", async ({ page }) => {
    await page.goto("/explore/html-entities");
    await expect(page.getByRole("button", { name: /Share input/i })).toHaveCount(0);
    await page.getByRole("button", { name: "Sample" }).click();
    await expectPaneNotEmpty(page.getByRole("textbox", { name: "Text input" }));
    await expectPaneNotEmpty(page.getByRole("textbox", { name: "HTML Entities result" }));

    // Direction change renames the input pane to the decode source label.
    await page.getByRole("button", { name: "Decode", exact: true }).click();
    const htmlDecodeInput = page.getByRole("textbox", {
      name: "HTML Entities input",
    });
    await fillPane(htmlDecodeInput, "&madeup;");
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expectPaneEmpty(page.getByRole("textbox", { name: "Text result" }));
    await fillPane(htmlDecodeInput, "&amp;");
    await expectPaneText(page.getByRole("textbox", { name: "Text result" }), "&");

    await page.goto("/explore/hex-text");
    await expect(page.getByRole("button", { name: /Share input/i })).toHaveCount(0);
    await page.getByRole("button", { name: "Sample" }).click();
    await expect
      .poll(async () => paneText(page.getByRole("textbox", { name: "Hex Text result" })))
      .toMatch(/48 65 6c 6c 6f/i);
    await page.getByRole("button", { name: "Decode", exact: true }).click();
    const hexDecodeInput = page.getByRole("textbox", {
      name: "Hex Text input",
    });
    await fillPane(hexDecodeInput, "gg");
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expectPaneEmpty(page.getByRole("textbox", { name: "Text result" }));
    await fillPane(hexDecodeInput, "48 69");
    await expectPaneText(page.getByRole("textbox", { name: "Text result" }), "Hi");
  });

  test("base64: live transform, Share declared, fragment-only, 390 px shell", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/explore/base64");
    const input = page.getByRole("textbox", { name: "UTF-8 text input" });
    await fillPane(input, "KIT-0006 ✓");
    await expectPaneText(page.getByRole("textbox", { name: /Base64 result/i }), "S0lULTAwMDYg4pyT");
    await expect(page.getByRole("button", { name: "Share input link" })).toBeEnabled();
    await page.getByRole("button", { name: "Share input link" }).click();
    await expect.poll(() => new URL(page.url()).hash).toMatch(/^#base64\?/);
    expect(new URL(page.url()).search).toBe("");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflow).toBe(false);
  });

  test("shared shells stay within 390 px for structured and encoding tools", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const slug of ["beautify-minify", "html-entities"] as const) {
      await page.goto(`/explore/${slug}`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow, `${slug} must not overflow at 390px`).toBe(false);
      await expect(page.locator("#tool-host h2").first()).toBeVisible();
    }
  });
});
