import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectPaneText, fillPane, pane, paneText } from "./support/editor";

test.describe("structured data tool contracts", () => {
  test("settles the empty beautify workspace without a React update loop", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto("/explore/beautify-minify");
    await expect(pane(page, "JSON input")).toBeVisible();
    // Let mount effects run more than once: the web adapter passes an inline
    // transform object, which previously retriggered the empty-state effect.
    await page.waitForTimeout(350);

    expect(consoleErrors).not.toContain(
      "Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.",
    );
  });

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
      const input = pane(page, tool.input);
      const output = pane(page, tool.output);
      await expectPaneText(input, "");
      await expectPaneText(output, "");
      await expect(page.getByRole("button", { name: `Copy ${tool.output}` })).toBeDisabled();
      await page.getByRole("button", { name: "Sample" }).click();
      await expect.poll(async () => paneText(input)).not.toBe("");
      await fillPane(input, tool.source);
      await expectPaneText(output, tool.expected);
      await expect(page.getByRole("button", { name: `Copy ${tool.output}` })).toBeEnabled();
      await expect(page.getByRole("button", { name: "Download result" })).toHaveCount(0);
    }
  });

  test("keeps host navigation synchronized when switching JSON and YAML modes", async ({
    page,
  }) => {
    await page.goto("/explore/json-to-yaml");

    await page.getByRole("main").getByRole("button", { name: "YAML → JSON", exact: true }).click();

    await expect(page).toHaveURL(/\/explore\/yaml-to-json$/);
    await expect(page).toHaveTitle("YAML → JSON — Tools out. Work on. | Kitland");
    await expect(
      page
        .getByRole("navigation", { name: "Registered tools" })
        .getByRole("button", { name: "YAML → JSON", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("textbox", { name: "YAML input" })).toBeVisible();
  });

  test("uses the standard local transform shell without mobile overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/explore/json-to-csv");

    await expectPaneText(pane(page, "JSON records"), "");
    await expect(page.getByRole("button", { name: "Sample" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear" })).toBeDisabled();
    await expect(page.getByLabel("JSON → CSV status")).toContainText("Waiting");

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

  test("shows actionable validation errors without preserving stale output", async ({ page }) => {
    await page.goto("/explore/beautify-minify");
    const input = pane(page, "JSON input");
    const output = pane(page, "Formatted JSON");
    await fillPane(input, '{"valid":true}');
    await expectPaneText(output, '{\n  "valid": true\n}');

    await fillPane(input, "{");
    await expect(page.getByRole("alert")).toContainText("JSON is invalid");
    await expectPaneText(output, "");
    await expect(page.getByRole("button", { name: "Copy Formatted JSON" })).toBeDisabled();
  });

  test("contains worker faults and never renders a stale structured result", async ({ page }) => {
    await page.addInitScript(() => {
      const variant = new URL(window.location.href).searchParams.get("worker-case");
      if (variant === "unavailable") {
        Object.defineProperty(window, "Worker", {
          configurable: true,
          value: undefined,
        });
        return;
      }
      if (variant !== "malformed" && variant !== "stale") return;

      class ControlledWorker {
        private listeners = new Map<string, Array<(event: { data?: unknown }) => void>>();

        addEventListener(type: string, listener: (event: { data?: unknown }) => void) {
          this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
        }

        postMessage(request: { id?: unknown; source?: unknown }) {
          const id = typeof request.id === "number" ? request.id : 1;
          if (variant === "malformed") {
            queueMicrotask(() => this.emit({ type: "result", id, result: { ok: true } }));
            return;
          }

          const source = typeof request.source === "string" ? request.source : "";
          const result = source.includes('"first"')
            ? '{\n  "first": true\n}'
            : '{\n  "second": true\n}';
          window.setTimeout(
            () =>
              this.emit({
                type: "result",
                id,
                result: { ok: true, value: result },
              }),
            source.includes('"first"') ? 400 : 150,
          );
        }

        terminate() {
          // Deliberately leave an already scheduled message alive. The hook's
          // request lifetime guard, not the mock, must discard it.
        }

        private emit(data: unknown) {
          for (const listener of this.listeners.get("message") ?? []) listener({ data });
        }
      }

      Object.defineProperty(window, "Worker", {
        configurable: true,
        value: ControlledWorker,
      });
    });

    const open = async (workerCase: "malformed" | "unavailable" | "stale") => {
      await page.goto(`/explore/beautify-minify?worker-case=${workerCase}`);
      return {
        input: pane(page, "JSON input"),
        output: pane(page, "Formatted JSON"),
      };
    };

    const malformed = await open("malformed");
    await fillPane(malformed.input, '{"valid":true}');
    await expect(page.getByRole("alert")).toContainText("invalid response");
    await expectPaneText(malformed.output, "");
    await expect(page.getByRole("button", { name: "Copy Formatted JSON" })).toBeDisabled();

    const unavailable = await open("unavailable");
    await fillPane(unavailable.input, '{"valid":true}');
    await expect(page.getByRole("alert")).toContainText("worker is unavailable");
    await expectPaneText(unavailable.output, "");

    const stale = await open("stale");
    await fillPane(stale.input, '{"first":true}');
    await page.waitForTimeout(180);
    await fillPane(stale.input, '{"second":true}');
    await expectPaneText(stale.output, "");
    await expectPaneText(stale.output, '{\n  "second": true\n}');
    await page.waitForTimeout(500);
    await expectPaneText(stale.output, '{\n  "second": true\n}');
  });

  test("renders CodeMirror panes with editable results and working indent options", async ({
    page,
  }) => {
    await page.goto("/explore/json-to-js-const");
    const input = pane(page, "JSON");
    const output = pane(page, "JavaScript");
    await expect(page.locator(".cm-editor")).toHaveCount(2);
    await expect(page.locator(".cm-gutters")).toHaveCount(2);
    await expect(page.locator(".cm-content").nth(0)).toHaveAttribute("aria-label", "JSON");

    await fillPane(input, '{"nested":{"a":1}}');
    await expectPaneText(output, 'const value = {\n  "nested": {\n    "a": 1\n  }\n};');

    await page.getByLabel("Indent size").selectOption("4");
    await expectPaneText(output, 'const value = {\n    "nested": {\n        "a": 1\n    }\n};');

    await fillPane(output, "const value = {\n  // tweaked\n};");
    await expectPaneText(output, "const value = {\n  // tweaked\n};");
    await expect(page.getByRole("button", { name: "Copy JavaScript" })).toBeEnabled();

    // A different source re-derives the result (manual output edits stick
    // until the next source change).
    await fillPane(input, '{"nested":{"b":2}}');
    await expectPaneText(output, 'const value = {\n    "nested": {\n        "b": 2\n    }\n};');
  });

  test("json-to-typescript honors the indent option", async ({ page }) => {
    await page.goto("/explore/json-to-typescript");
    await page.getByLabel("Indent size").selectOption("4");
    await fillPane(pane(page, "JSON"), '{"user":{"id":1}}');
    await expectPaneText(
      pane(page, "TypeScript interfaces"),
      "export type Root = {\n    user: {\n        id: number;\n    };\n};",
    );
  });

  test("inspects JSON and compares two structural documents", async ({ page }) => {
    await page.goto("/explore/json-formatter");
    await fillPane(pane(page, "JSON input"), '{"name":"Kitland","items":[1]}');
    await page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Output" }) })
      .getByRole("button", { name: "Code", exact: true })
      .click();
    await expectPaneText(
      pane(page, "Formatted JSON"),
      '{\n  "name": "Kitland",\n  "items": [\n    1\n  ]\n}',
    );
    const inspection = page.getByLabel("JSON inspection summary");
    await expect(inspection).toContainText("object");
    await expect(inspection).toContainText("props");
    await expect(inspection).toContainText("2");

    await page.goto("/explore/json-diff");
    await expect(page.getByRole("button", { name: "Editor", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await fillPane(pane(page, "Before JSON"), '{"service":"kitland","version":1}');
    await fillPane(pane(page, "After JSON"), '{"service":"kitland","version":2,"released":true}');
    // Editor owns A/B; Compare is an explicit mode on the same route.
    await expect(page.getByRole("list", { name: "JSON differences" })).toHaveCount(0);
    await page.getByRole("button", { name: "Compare documents" }).click();
    await expect(page.getByRole("button", { name: "Compare", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("list", { name: "JSON differences" })).toContainText(
      "/released — added: true",
    );
    await expect(page.getByRole("list", { name: "JSON differences" })).toContainText(
      "/version — changed: 1 → 2",
    );
    await page.getByRole("button", { name: "Edit inputs" }).click();
    await expect(page.getByRole("button", { name: "Editor", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expectPaneText(pane(page, "Before JSON"), '{"service":"kitland","version":1}');
    await expectPaneText(
      pane(page, "After JSON"),
      '{"service":"kitland","version":2,"released":true}',
    );
  });

  test("renders Markdown safely in the preview pane", async ({ page }) => {
    await page.goto("/explore/markdown-preview");
    await fillPane(
      pane(page, "Markdown source"),
      "# Safe preview\n\n**Local**\n\n<script>window.__unsafe = true</script>",
    );

    await expect(page.getByRole("heading", { name: "Safe preview" })).toBeVisible();
    await expect(page.getByText("Local", { exact: true })).toHaveCount(1);
    const preview = page.getByLabel("Rendered Markdown preview");
    await expect(preview.locator("script")).toHaveCount(0);
    await expect(preview.getByText("<script>window.__unsafe = true</script>")).toBeVisible();
  });
});
