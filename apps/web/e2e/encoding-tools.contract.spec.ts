import { expect, test } from "@playwright/test";
import { fillPane, expectPaneText, expectPaneEmpty, paneText } from "./support/editor";

test.describe("encoding tool contracts", () => {
  test("uses the shared local-workspace action and worker-failure contract", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/explore/html-entities");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", { name: "HTML Entities result" });
    await expectPaneEmpty(input);
    await expectPaneEmpty(output);
    await expect(page.getByText("Waiting", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Sample", exact: true }).click();
    await expectPaneText(output, "&lt;p title=&quot;tea &amp; cake&quot;&gt;🍵&lt;/p&gt;");
    await page.getByRole("button", { name: "Copy HTML Entities result" }).click();
    await expect(page.getByText("Result copied.")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(await paneText(output));

    await page.getByRole("button", { name: "Clear Text input" }).click();
    await expect(input).toBeFocused();
    await expectPaneEmpty(output);
    for (const action of ["Upload", "Download", "Save", "Share"]) {
      await expect(page.getByRole("button", { name: action, exact: true })).toHaveCount(0);
    }
  });

  test("rejects malformed or mismatched shared-worker responses", async ({ page }) => {
    await page.addInitScript(() => {
      class InvalidWorker {
        private listeners = new Map<string, Array<(event: { data?: unknown }) => void>>();
        addEventListener(type: string, listener: (event: { data?: unknown }) => void) {
          this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
        }
        postMessage(request: { id?: unknown }) {
          const variant = new URL(window.location.href).searchParams.get("worker-case");
          const response =
            variant === "id"
              ? {
                  type: "result",
                  id: 999,
                  result: { ok: true, value: "safe-looking stale output" },
                }
              : { type: "result", id: request.id, result: { ok: true } };
          queueMicrotask(() => {
            for (const listener of this.listeners.get("message") ?? [])
              listener({ data: response });
          });
        }
        terminate() {}
      }
      Object.defineProperty(window, "Worker", {
        configurable: true,
        value: InvalidWorker,
      });
    });

    for (const variant of ["shape", "id"]) {
      await page.goto(`/explore/html-entities?worker-case=${variant}`);
      await fillPane(page.getByRole("textbox", { name: "Text input" }), "<p>");
      await expect(page.getByText("Unavailable", { exact: true })).toBeVisible();
      await expectPaneEmpty(page.getByRole("textbox", { name: "HTML Entities result" }));
      await expect(page.getByRole("button", { name: "Copy HTML Entities result" })).toBeDisabled();
    }
  });

  test("URL Encode preserves URI semantics and rejects malformed input", async ({ page }) => {
    await page.goto("/explore/url-encode");

    const input = page.getByRole("textbox", { name: "URL component input" });
    const output = page.getByRole("textbox", {
      name: "Percent-encoded result",
    });
    await fillPane(input, "cà phê + 🍵");
    await expectPaneText(output, "c%C3%A0%20ph%C3%AA%20%2B%20%F0%9F%8D%B5");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expectPaneText(
      page.getByRole("textbox", { name: "Percent-encoded input" }),
      "c%C3%A0%20ph%C3%AA%20%2B%20%F0%9F%8D%B5",
    );
    await expectPaneText(
      page.getByRole("textbox", { name: "URL component result" }),
      "cà phê + 🍵",
    );

    await fillPane(page.getByRole("textbox", { name: "Percent-encoded input" }), "%E0%A4%A");
    await expect(page.getByRole("alert")).toContainText("malformed percent escapes");
  });

  test("HTML Entities supports named and numeric forms", async ({ page }) => {
    await page.goto("/explore/html-entities");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", { name: "HTML Entities result" });
    await fillPane(input, '<p title="tea & cake">🍵</p>');
    await expectPaneText(output, "&lt;p title=&quot;tea &amp; cake&quot;&gt;🍵&lt;/p&gt;");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expectPaneText(
      page.getByRole("textbox", { name: "Text result" }),
      '<p title="tea & cake">🍵</p>',
    );

    await fillPane(page.getByRole("textbox", { name: "HTML Entities input" }), "&madeup;");
    await expect(page.getByRole("alert")).toContainText("supported named-entity set");
  });

  test("Hex Text round-trips UTF-8 and rejects invalid bytes", async ({ page }) => {
    await page.goto("/explore/hex-text");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", { name: "Hex Text result" });
    await fillPane(input, "Hi 🍵");
    await expectPaneText(output, "48 69 20 f0 9f 8d b5");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expectPaneText(page.getByRole("textbox", { name: "Text result" }), "Hi 🍵");

    await fillPane(page.getByRole("textbox", { name: "Hex Text input" }), "c3 28");
    await expect(page.getByRole("alert")).toContainText("not valid UTF-8");
  });

  test("Unicode Converter round-trips scalar values and validates syntax", async ({ page }) => {
    await page.goto("/explore/unicode-converter");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", {
      name: "Unicode Converter result",
    });
    await fillPane(input, "A🍵東");
    await expectPaneText(output, "U+0041 U+1F375 U+6771");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expectPaneText(page.getByRole("textbox", { name: "Text result" }), "A🍵東");

    await fillPane(page.getByRole("textbox", { name: "Unicode Converter input" }), "U+D800");
    await expect(page.getByRole("alert")).toContainText("outside the Unicode scalar-value range");
  });

  test("Binary Text round-trips UTF-8 and rejects malformed groups", async ({ page }) => {
    await page.goto("/explore/binary-text");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", { name: "Binary Text result" });
    await fillPane(input, "A🍵");
    await expectPaneText(output, "01000001 11110000 10011111 10001101 10110101");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expectPaneText(page.getByRole("textbox", { name: "Text result" }), "A🍵");

    await fillPane(page.getByRole("textbox", { name: "Binary Text input" }), "0101");
    await expect(page.getByRole("alert")).toContainText("eight-bit groups");
  });

  test("ROT13 Caesar encodes, decodes, and preserves non-Latin text", async ({ page }) => {
    await page.goto("/explore/rot13-caesar");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", { name: "ROT13 Caesar result" });
    await fillPane(input, "Hello world 🍵");
    await expectPaneText(output, "Uryyb jbeyq 🍵");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    const decodedInput = page.getByRole("textbox", {
      name: "ROT13 Caesar input",
    });
    await expectPaneText(decodedInput, "Uryyb jbeyq 🍵");
    await expectPaneText(page.getByRole("textbox", { name: "Text result" }), "Hello world 🍵");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    await expectPaneText(decodedInput, "Uryyb jbeyq 🍵");
  });

  test("Morse Code encodes, decodes, and validates properly", async ({ page }) => {
    await page.goto("/explore/morse-code");

    const input = page.getByRole("textbox", { name: "Text input" });
    const output = page.getByRole("textbox", { name: "Morse Code result" });
    await fillPane(input, "SOS HELP");
    await expectPaneText(output, "... --- ... / .... . .-.. .--.");

    const tallPaste = Array.from({ length: 80 }, (_, index) => `LINE ${index + 1}`).join("\n");
    await fillPane(input, tallPaste);
    const isTextarea = await input.evaluate((el) => el instanceof HTMLTextAreaElement);
    const inputBox = isTextarea
      ? await input.boundingBox()
      : await input.locator("xpath=ancestor::*[contains(@class, 'cm-editor')]").boundingBox();
    expect(inputBox?.height ?? Number.POSITIVE_INFINITY).toBeLessThan(480);
    await expect(input).toHaveCSS("font-family", /JetBrains Mono/);
    await fillPane(input, "SOS HELP");
    await expectPaneText(output, "... --- ... / .... . .-.. .--.");

    await page.getByRole("button", { name: "Decode", exact: true }).click();
    const decodedInput = page.getByRole("textbox", {
      name: "Morse Code input",
    });
    await expectPaneText(decodedInput, "... --- ... / .... . .-.. .--.");
    await expectPaneText(page.getByRole("textbox", { name: "Text result" }), "SOS HELP");

    await fillPane(decodedInput, "... --- ...   .... . .-.. .--.");
    await expectPaneText(page.getByRole("textbox", { name: "Text result" }), "SOS HELP");

    await fillPane(decodedInput, "......");
    await expect(page.getByRole("alert")).toContainText('Unknown Morse sequence "......"');
  });

  test("JSON Escape round-trips one JSON string literal and rejects other JSON values", async ({
    page,
  }) => {
    await page.goto("/explore/json-escape");

    const input = page.getByRole("textbox", { name: "Plain text" });
    const output = page.getByRole("textbox", { name: "JSON string literal" });
    await fillPane(input, 'A\n"🍵"');
    await expectPaneText(output, '"A\\n\\"🍵\\""');

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save result" }).click();
    expect((await download).suggestedFilename()).toBe("escaped-json.txt");

    await page.getByRole("button", { name: "Unescape" }).click();
    await expectPaneText(input, 'A\n"🍵"');

    await fillPane(output, "42");
    await expect(page.getByRole("alert")).toContainText("must be a JSON string literal");
  });
});
