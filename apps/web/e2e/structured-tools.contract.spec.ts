import { expect, test } from "@playwright/test";

test.describe("structured data tool contracts", () => {
  test("formats and converts the shared two-pane tools", async ({ page }) => {
    const cases = [
      {
        slug: "beautify-minify",
        input: "JSON input",
        output: "Formatted JSON",
        source: '{"name":"Kitland","enabled":true}',
        expected: '{\n  "name": "Kitland",\n  "enabled": true\n}',
      },
      {
        slug: "json-to-yaml",
        input: "JSON input",
        output: "YAML output",
        source: '{"name":"Kitland","enabled":true}',
        expected: '"name": "Kitland"\n"enabled": true\n',
      },
      {
        slug: "yaml-to-json",
        input: "YAML input",
        output: "JSON output",
        source: "items:\n  - name: Widget\n    enabled: true\n",
        expected:
          '{\n  "items": [\n    {\n      "name": "Widget",\n      "enabled": true\n    }\n  ]\n}',
      },
      {
        slug: "json-to-csv",
        input: "JSON records",
        output: "CSV output",
        source: '[{"name":"Widget","active":true}]',
        // Textarea values use LF even when the CSV encoder emits CRLF bytes.
        expected: "name,active\nWidget,true\n",
      },
      {
        slug: "json-to-toml",
        input: "JSON object",
        output: "TOML output",
        source: '{"name":"Kitland","settings":{"enabled":true}}',
        expected: '"name" = "Kitland"\n\n["settings"]\n"enabled" = true\n',
      },
      {
        slug: "xml-formatter",
        input: "XML input",
        output: "Formatted XML",
        source: '<root label="1 > 0"><item/></root>',
        expected: '<root label="1 > 0">\n  <item/>\n</root>\n',
      },
      {
        slug: "sql-formatter",
        input: "SQL query",
        output: "Formatted SQL",
        source:
          "select team from users left outer join profiles p on p.user_id=users.id group by team",
        expected:
          "SELECT team\nFROM users\nLEFT OUTER JOIN profiles p ON p.user_id = users.id\nGROUP BY team",
      },
    ] as const;

    for (const tool of cases) {
      await page.goto(`/explore/${tool.slug}`);
      const input = page.getByRole("textbox", { name: tool.input });
      const output = page.getByRole("textbox", { name: tool.output });
      await input.fill(tool.source);
      await expect(output).toHaveValue(tool.expected);
      await expect(page.getByRole("button", { name: "Download result" })).toBeEnabled();
    }
  });

  test("shows actionable validation errors without preserving stale output", async ({ page }) => {
    await page.goto("/explore/beautify-minify");
    const input = page.getByRole("textbox", { name: "JSON input" });
    const output = page.getByRole("textbox", { name: "Formatted JSON" });
    await input.fill('{"valid":true}');
    await expect(output).toHaveValue('{\n  "valid": true\n}');

    await input.fill("{");
    await expect(page.getByRole("alert")).toContainText("JSON is invalid");
    await expect(output).toHaveValue("");
    await expect(page.getByRole("button", { name: "Download result" })).toBeDisabled();
  });

  test("inspects JSON and compares two structural documents", async ({ page }) => {
    await page.goto("/explore/json-toolbox");
    await page.getByRole("textbox", { name: "JSON input" }).fill('{"name":"Kitland","items":[1]}');
    await expect(page.getByRole("textbox", { name: "Formatted JSON" })).toHaveValue(
      '{\n  "name": "Kitland",\n  "items": [\n    1\n  ]\n}',
    );
    await expect(page.getByLabel("JSON inspection summary")).toContainText(
      "object · 4 values · depth 2",
    );

    await page.goto("/explore/json-diff");
    await page
      .getByRole("textbox", { name: "Before JSON" })
      .fill('{"service":"kitland","version":1}');
    await page
      .getByRole("textbox", { name: "After JSON" })
      .fill('{"service":"kitland","version":2,"released":true}');
    await expect(page.getByRole("list", { name: "JSON differences" })).toContainText(
      "/released — added: true",
    );
    await expect(page.getByRole("list", { name: "JSON differences" })).toContainText(
      "/version — changed: 1 → 2",
    );
  });

  test("renders Markdown safely in the preview pane", async ({ page }) => {
    await page.goto("/explore/markdown-preview");
    await page
      .getByRole("textbox", { name: "Markdown source" })
      .fill("# Safe preview\n\n**Local**\n\n<script>window.__unsafe = true</script>");

    await expect(page.getByRole("heading", { name: "Safe preview" })).toBeVisible();
    await expect(page.getByText("Local", { exact: true })).toHaveCount(1);
    const preview = page.getByLabel("Rendered Markdown preview");
    await expect(preview.locator("script")).toHaveCount(0);
    await expect(preview.getByText("<script>window.__unsafe = true</script>")).toBeVisible();
  });
});
