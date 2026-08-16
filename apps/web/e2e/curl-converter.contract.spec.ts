import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectPaneText, fillPane, pane, paneText } from "./support/editor";

const SAMPLE_FETCH = [
  'const response = await fetch("https://api.example.com/v1/users", {',
  '  method: "POST",',
  "  headers: [",
  '    ["Content-Type", "application/json"],',
  '    ["X-Request-Id", "demo-123"]',
  "  ],",
  '  body: "{\\"name\\":\\"Ada Lovelace\\"}"',
  "});",
  "",
  "if (!response.ok) {",
  "  throw new Error(`HTTP ${response.status}`);",
  "}",
  "",
  "const data = await response.text();",
].join("\n");

test.describe("cURL converter contract", () => {
  test("lazy-loads and performs live local transforms in both directions", async ({ page }) => {
    await page.goto("/explore/curl-converter");
    const source = pane(page, "cURL command");
    const result = pane(page, "Fetch result");
    await expect(page.getByText("Waiting for input", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await expectPaneText(result, SAMPLE_FETCH);
    await expect(page.getByText("Ready", { exact: true })).toBeVisible();

    await source.fill("not curl");
    await expectPaneText(result, "");
    await expect(source).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Start the command with curl.")).toBeVisible();

    await source.fill("curl -H 'X-A: 1' -H 'X-A: 2' -d a=1 -d b=2 https://example.test");
    await expectPaneText(
      result,
      [
        'const response = await fetch("https://example.test", {',
        '  method: "POST",',
        "  headers: [",
        '    ["X-A", "1"],',
        '    ["X-A", "2"]',
        "  ],",
        '  body: "a=1&b=2"',
        "});",
        "",
        "if (!response.ok) {",
        "  throw new Error(`HTTP ${response.status}`);",
        "}",
        "",
        "const data = await response.text();",
      ].join("\n"),
    );

    await page.getByRole("button", { name: "To curl", exact: true }).click();
    const fetchInput = pane(page, "Fetch request");
    const curlOutput = pane(page, "cURL command");
    await fillPane(
      fetchInput,
      "await fetch('https://example.test/api', { method: 'PUT', headers: { 'X-A': '1' }, body: 'a=1' })",
    );
    await expectPaneText(
      curlOutput,
      "curl 'https://example.test/api' \\\n  -X PUT \\\n  -H 'X-A: 1' \\\n  -d 'a=1'",
    );

    // Swap back to cURL -> Fetch using the swap button
    await page
      .getByRole("button", { name: "Use the result as input and switch direction" })
      .click();
    const swappedSource = pane(page, "cURL command");
    const swappedResult = pane(page, "Fetch result");
    await expectPaneText(
      swappedSource,
      "curl 'https://example.test/api' \\\n  -X PUT \\\n  -H 'X-A: 1' \\\n  -d 'a=1'",
    );
    await expectPaneText(
      swappedResult,
      [
        'const response = await fetch("https://example.test/api", {',
        '  method: "PUT",',
        "  headers: [",
        '    ["X-A", "1"]',
        "  ],",
        '  body: "a=1"',
        "});",
        "",
        "if (!response.ok) {",
        "  throw new Error(`HTTP ${response.status}`);",
        "}",
        "",
        "const data = await response.text();",
      ].join("\n"),
    );
  });

  test("owns only declared actions and enforces the UTF-16 limit", async ({ page }) => {
    await page.goto("/explore/curl-converter");
    await expect(page.getByText("No request is executed or sent.")).toBeVisible();
    for (const name of ["Run", "Reverse", "Share"]) {
      await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
    }
    for (const name of ["Sample", "Clear input"]) {
      await expect(page.getByRole("button", { name, exact: true })).toHaveCount(1);
    }
    await expect(page.getByRole("button", { name: "Convert", exact: true })).toHaveCount(0);
    // Curl Converter's registry contract declares transform-text and
    // clipboard-write only, so file import/export controls stay hidden.
    for (const name of ["Upload file", "Save result"]) {
      await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
    }
    const source = pane(page, "cURL command");
    await fillPane(source, "x".repeat(100_001));
    await expect.poll(async () => (await paneText(source)).length).toBe(100_000);
    await expect(page.getByText("Start the command with curl.")).toBeVisible();
    await expect(page.getByText("Fix input", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Fetch result" })).toBeDisabled();
  });

  test("keeps both directions usable on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/explore/curl-converter");

    await expect(pane(page, "cURL command")).toBeVisible();
    await expect(pane(page, "Fetch result")).toBeVisible();
    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await expect
      .poll(async () => (await paneText(pane(page, "Fetch result"))).includes('method: "POST"'))
      .toBe(true);

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
});
