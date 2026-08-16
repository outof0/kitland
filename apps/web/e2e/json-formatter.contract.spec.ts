import { expect, test, type Page } from "@playwright/test";
import { expectPaneEmpty, expectPaneNotEmpty, expectPaneText, fillPane } from "./support/editor";

const formattedTwo =
  '{\n  "name": "Kitland",\n  "items": [\n    1,\n    null\n  ],\n  "active": true\n}';

const outputCard = (page: Page) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: "Output" }) });

const inputCard = (page: Page) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: "Input" }) });

async function showCodeOutput(page: Page) {
  await outputCard(page).getByRole("button", { name: "Code", exact: true }).click();
}

test.describe("JSON Formatter contract", () => {
  test("keeps editor panes filled after in-app tool switches", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/explore/json-formatter");
    const editor = page.locator(".cm-editor").first();
    await expect(editor).toBeVisible();
    await expect
      .poll(async () => editor.evaluate((el) => el.getBoundingClientRect().height))
      .toBeGreaterThan(200);
    await expectCodeMirrorStyles(editor);

    await page.locator("aside button").filter({ hasText: "JSON → YAML" }).click();
    await expect(page).toHaveURL(/\/explore\/json-to-yaml\/?$/);
    const yamlEditor = page.locator(".cm-editor").first();
    await expect(yamlEditor).toBeVisible();
    await expect
      .poll(async () => yamlEditor.evaluate((el) => el.getBoundingClientRect().height))
      .toBeGreaterThan(200);
    await expectCodeMirrorStyles(yamlEditor);

    await page.locator("aside button").filter({ hasText: "JSON Formatter" }).click();
    await expect(page).toHaveURL(/\/explore\/json-formatter\/?$/);
    await expect
      .poll(async () =>
        page
          .locator(".cm-editor")
          .first()
          .evaluate((el) => el.getBoundingClientRect().height),
      )
      .toBeGreaterThan(200);
    await expectCodeMirrorStyles(page.locator(".cm-editor").first());
  });

  test("keeps JSON Diff cards inside the shared editor canvas", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/explore/json-diff");

    const stage = page.locator(".tool-editor-stage");
    const source = page.getByRole("textbox", { name: "Before JSON" });
    const initialHeight = await stage.evaluate((element) => element.getBoundingClientRect().height);
    const longJson = JSON.stringify(
      { rows: Array.from({ length: 1_200 }, (_, index) => ({ index, value: `row-${index}` })) },
      null,
      2,
    );

    await fillPane(source, longJson);

    const geometry = await stage.evaluate((element) => {
      const scroller = element.querySelector<HTMLElement>(".cm-scroller");
      return {
        stageHeight: element.getBoundingClientRect().height,
        scrollsInternally: Boolean(scroller && scroller.scrollHeight > scroller.clientHeight),
      };
    });

    expect(geometry.stageHeight).toBeCloseTo(initialHeight, 0);
    expect(geometry.scrollsInternally).toBe(true);
  });

  test("keeps a long JSON paste inside fixed-height editor cards", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/explore/json-formatter");

    const source = page.getByRole("textbox", { name: "JSON input" });
    const card = inputCard(page);
    const initialHeight = await card.evaluate((element) => element.getBoundingClientRect().height);
    const longJson = JSON.stringify(
      { rows: Array.from({ length: 1_200 }, (_, index) => ({ index, value: `row-${index}` })) },
      null,
      2,
    );

    await fillPane(source, longJson);

    const geometry = await card.evaluate((element) => {
      const scroller = element.querySelector<HTMLElement>(".cm-scroller");
      return {
        cardHeight: element.getBoundingClientRect().height,
        scrollsInternally: Boolean(scroller && scroller.scrollHeight > scroller.clientHeight),
      };
    });

    expect(geometry.cardHeight).toBeCloseTo(initialHeight, 0);
    expect(geometry.scrollsInternally).toBe(true);
  });

  test("starts empty and inspects the current document in a dedicated live flow", async ({
    page,
  }) => {
    await page.goto("/explore/json-formatter");
    const source = page.getByRole("textbox", { name: "JSON input" });
    await expectPaneEmpty(source);
    await expect(page.getByText("Waiting", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy formatted JSON" })).toBeDisabled();

    await fillPane(source, '{"name":"Kitland","items":[1,null],"active":true}');
    await expect(page.getByText("Valid", { exact: true })).toBeVisible();
    const summary = page.getByLabel("JSON inspection summary");
    await expect(summary).toContainText("object");
    await expect(summary).toContainText("props");
    await expect(summary).toContainText("4");
    await expect(summary).toContainText("2");

    await showCodeOutput(page);
    const result = page.getByRole("textbox", { name: "Formatted JSON" });
    await expectPaneText(result, formattedTwo);

    await page.getByRole("button", { name: "Indent", exact: true }).click();
    await page.getByRole("button", { name: "4 spaces" }).click();
    await expectPaneText(
      result,
      '{\n    "name": "Kitland",\n    "items": [\n        1,\n        null\n    ],\n    "active": true\n}',
    );

    await page.getByRole("button", { name: "Minify", exact: true }).click();
    await expect(page.getByRole("button", { name: "Minify", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expectPaneText(result, '{"name":"Kitland","items":[1,null],"active":true}');
    await expect(page.getByRole("button", { name: "Beautify", exact: true })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("keeps the output fresh until the focused input changes identity", async ({ page }) => {
    await page.goto("/explore/json-formatter");
    const source = page.getByRole("textbox", { name: "JSON input" });
    await fillPane(source, '{"name":"Kitland","active":true}');
    await showCodeOutput(page);
    const result = page.getByRole("textbox", { name: "Formatted JSON" });
    await expectPaneText(result, '{\n  "name": "Kitland",\n  "active": true\n}');

    await page.getByRole("button", { name: "Indent", exact: true }).click();
    await page.getByRole("button", { name: "4 spaces" }).click();
    await expectPaneText(result, '{\n    "name": "Kitland",\n    "active": true\n}');

    await page.getByRole("button", { name: "Indent", exact: true }).click();
    await page.getByRole("button", { name: "2 spaces" }).click();
    await expectPaneText(result, '{\n  "name": "Kitland",\n  "active": true\n}');

    await page.getByRole("button", { name: "Indent", exact: true }).click();
    await expect(page.getByRole("button", { name: "2 spaces" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("clears stale output while a changed formatting request is pending", async ({ page }) => {
    // Delay worker responses so the intermediate "Inspecting" state is
    // observable, instead of racing the worker's fast reply.
    await page.addInitScript(() => {
      const RealWorker = window.Worker;
      class DelayedWorker {
        private inner: Worker;
        private listeners: Array<(event: MessageEvent) => void> = [];
        constructor(url: string | URL, options?: WorkerOptions) {
          this.inner = new RealWorker(url, options);
          this.inner.addEventListener("message", (event) => {
            setTimeout(() => {
              for (const listener of this.listeners) listener(event);
            }, 500);
          });
        }
        addEventListener(type: string, listener: (event: MessageEvent) => void) {
          if (type === "message") this.listeners.push(listener);
        }
        postMessage(message: unknown) {
          this.inner.postMessage(message);
        }
        terminate() {
          this.inner.terminate();
        }
      }
      Object.defineProperty(window, "Worker", {
        configurable: true,
        value: DelayedWorker,
      });
    });
    await page.goto("/explore/json-formatter");
    const source = page.getByRole("textbox", { name: "JSON input" });
    await fillPane(source, '{"name":"Kitland"}');
    await showCodeOutput(page);
    const result = page.getByRole("textbox", { name: "Formatted JSON" });
    await expectPaneText(result, '{\n  "name": "Kitland"\n}');

    await page.getByRole("button", { name: "Indent", exact: true }).click();
    await page.getByRole("button", { name: "4 spaces" }).click();
    await expectPaneEmpty(result);
    await expect(page.getByText("Inspecting", { exact: true })).toBeVisible();
    await expectPaneText(result, '{\n    "name": "Kitland"\n}');
  });

  test("invalid JSON surfaces an error alert and an invalid input box", async ({ page }) => {
    await page.goto("/explore/json-formatter");
    const source = page.getByRole("textbox", { name: "JSON input" });
    await fillPane(source, "{");
    await expect(page.getByRole("alert")).toHaveText("JSON is invalid.");
    await source.focus();
    await expect(source).toHaveAttribute("aria-invalid", "true");
    await expect(source).toBeFocused();
  });

  test("copies the formatted result and announces it locally", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/explore/json-formatter");
    const source = page.getByRole("textbox", { name: "JSON input" });
    await fillPane(source, '{"snippet":true}');
    await showCodeOutput(page);
    const result = page.getByRole("textbox", { name: "Formatted JSON" });
    await expectPaneText(result, '{\n  "snippet": true\n}');

    const copyBtn = outputCard(page).getByRole("button", { name: "Copy formatted JSON" });
    await expect(copyBtn).toBeEnabled();
    await copyBtn.click();
    await expect(outputCard(page).getByRole("button", { name: /Copied/ })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('{\n  "snippet": true\n}');
  });

  test("blocks runaway input with the shared LARGER_LIMIT_ERROR text", async ({ page }) => {
    await page.goto("/explore/json-formatter");
    const source = page.getByRole("textbox", { name: "JSON input" });
    await fillPane(source, "x".repeat(1_000_001));
    await expect(page.getByRole("alert")).toContainText("1,000,000 UTF-16 code unit limit");
  });

  test("writes a fragment-only share link and restores validated input after reload", async ({
    page,
  }) => {
    await page.goto("/explore/json-formatter?campaign=should-not-be-shared");
    const source = page.getByRole("textbox", { name: "JSON input" });
    await fillPane(source, '{"share":true,"mark":"✓"}');
    await page.getByRole("button", { name: "Share input link" }).click();

    await expect.poll(() => new URL(page.url()).hash).toMatch(/^#json\?/);
    const sharedUrl = new URL(page.url());
    expect(sharedUrl.search).toBe("");
    const params = new URLSearchParams(sharedUrl.hash.slice("#json?".length));
    expect(params.get("input")).toBe('{"share":true,"mark":"✓"}');

    await page.reload();
    await expectPaneText(
      page.getByRole("textbox", { name: "JSON input" }),
      '{"share":true,"mark":"✓"}',
    );
    await expect(page.getByText("Share links include the current input")).toBeVisible();
  });

  test("inspects JSON in a shared summary flow used by JSON-skipped tools too", async ({
    page,
  }) => {
    await page.goto("/explore/json-formatter");
    const source = page.getByRole("textbox", { name: "JSON input" });
    await fillPane(source, "null");
    await expect(page.getByLabel("JSON inspection summary")).toContainText("null");
    await expect(page.getByRole("button", { name: "Copy formatted JSON" })).toBeEnabled();
  });

  test("formatting survives non-JSON input outside the reserved control characters", async ({
    page,
  }) => {
    await page.goto("/explore/json-formatter");
    const source = page.getByRole("textbox", { name: "JSON input" });
    await fillPane(source, "{");
    await expect(page.getByRole("alert")).toHaveText("JSON is invalid.");

    await showCodeOutput(page);
    const result = page.getByRole("textbox", { name: "Formatted JSON" });
    await expectPaneEmpty(result);

    await fillPane(source, '  {\n\t"a": 1\n}  ');
    await expectPaneText(result, '{\n  "a": 1\n}');
    await expect(page.getByRole("alert")).toHaveCount(0);

    await fillPane(source, "true");
    await expectPaneText(result, "true");
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("disables indentation options while minifying", async ({ page }) => {
    await page.goto("/explore/json-formatter");
    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await page.getByRole("button", { name: "Indent", exact: true }).click();
    const twoSpaces = page.getByRole("button", { name: "2 spaces" });
    await expect(twoSpaces).toBeEnabled();
    await expect(twoSpaces).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Minify", exact: true }).click();
    await page.getByRole("button", { name: "Indent", exact: true }).click();
    await expect(twoSpaces).toBeDisabled();
  });

  test("degrades gracefully when the clipboard is unavailable", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("Denied")) },
      });
      Object.defineProperty(Document.prototype, "execCommand", {
        configurable: true,
        value: () => false,
      });
    });
    await page.goto("/explore/json-formatter");
    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await showCodeOutput(page);
    const result = page.getByRole("textbox", { name: "Formatted JSON" });
    await expectPaneNotEmpty(result);
    await page.getByRole("button", { name: "Copy formatted JSON" }).click();
    const feedback = page.getByText(
      "Couldn’t access your clipboard. Select the text and copy it manually.",
    );
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveAttribute("aria-live", "polite");
  });

  test("clears stale output and exposes exact error and UTF-16 limit states", async ({ page }) => {
    await page.goto("/explore/json-formatter");
    const source = page.getByRole("textbox", { name: "JSON input" });
    await fillPane(source, '{"valid":true}');
    await showCodeOutput(page);
    const result = page.getByRole("textbox", { name: "Formatted JSON" });
    await expectPaneNotEmpty(result);

    await fillPane(source, "{");
    await expectPaneEmpty(result);
    await expect(source).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert")).toHaveText("JSON is invalid.");
    await expect(page.getByText("Error", { exact: true })).toBeVisible();

    await fillPane(source, '"valid again"');
    await expectPaneText(result, '"valid again"');

    await fillPane(source, "x".repeat(1_000_001));
    await expectPaneEmpty(result);
    await expect(page.getByText("Limit", { exact: true })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("1,000,000 UTF-16 code unit limit");
  });

  test("rejects malformed or unbounded worker responses without a fallback", async ({ page }) => {
    await page.addInitScript(() => {
      class MalformedWorker {
        private listeners = new Map<string, Array<(event: { data?: unknown }) => void>>();
        addEventListener(type: string, listener: (event: { data?: unknown }) => void) {
          this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
        }
        postMessage(request: { id?: unknown }) {
          const inspection = {
            formatted: "null",
            rootType: "null",
            totalValues: 1,
            objectCount: 0,
            arrayCount: 0,
            stringCount: 0,
            numberCount: 0,
            booleanCount: 0,
            nullCount: 1,
            maxDepth: 0,
          };
          const variant = new URL(window.location.href).searchParams.get("worker-case");
          let result: unknown = { ok: true };
          if (variant === "output") {
            result = {
              ok: true,
              value: { ...inspection, formatted: "x".repeat(1_000_001) },
            };
          } else if (variant === "nodes") {
            result = {
              ok: true,
              value: { ...inspection, totalValues: 100_001 },
            };
          } else if (variant === "depth") {
            result = { ok: true, value: { ...inspection, maxDepth: 129 } };
          } else if (variant === "counts") {
            result = { ok: true, value: { ...inspection, totalValues: 2 } };
          } else if (variant === "error") {
            result = {
              ok: false,
              error: { code: "FAILED", message: "x".repeat(321) },
            };
          }
          queueMicrotask(() => {
            for (const listener of this.listeners.get("message") ?? []) {
              listener({
                data: {
                  type: "result",
                  id: typeof request.id === "number" ? request.id : 1,
                  result,
                },
              });
            }
          });
        }
        terminate() {}
      }
      Object.defineProperty(window, "Worker", {
        configurable: true,
        value: MalformedWorker,
      });
    });

    for (const variant of ["shape", "output", "nodes", "depth", "counts", "error"]) {
      await page.goto(`/explore/json-formatter?worker-case=${variant}`);
      await fillPane(page.getByRole("textbox", { name: "JSON input" }), "null");
      await expect(page.getByText("Unavailable", { exact: true })).toBeVisible();
      await showCodeOutput(page);
      await expectPaneEmpty(page.getByRole("textbox", { name: "Formatted JSON" }));
      await expect(page.getByRole("button", { name: "Copy formatted JSON" })).toBeDisabled();
    }
  });

  test("does not overflow narrow mobile layouts", async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/explore/json-formatter");
      await page.getByRole("button", { name: "Sample", exact: true }).click();
      await showCodeOutput(page);
      await expectPaneNotEmpty(page.getByRole("textbox", { name: "Formatted JSON" }));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      expect(overflow).toBe(false);
    }
  });
});

async function expectCodeMirrorStyles(editor: ReturnType<Page["locator"]>) {
  await expect
    .poll(async () =>
      editor.evaluate((element) => {
        const scroller = element.querySelector<HTMLElement>(".cm-scroller");
        const content = element.querySelector<HTMLElement>(".cm-content");
        return {
          overflowY: scroller ? getComputedStyle(scroller).overflowY : "",
          paddingTop: content ? getComputedStyle(content).paddingTop : "",
        };
      }),
    )
    .toEqual({ overflowY: "auto", paddingTop: "14px" });
}
