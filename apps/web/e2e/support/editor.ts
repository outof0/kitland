import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Shared tool panes render either a CodeMirror editor (a role=textbox content
 * div) or a plain textarea depending on the pane language and host. These
 * helpers keep specs pane-agnostic.
 */
export function pane(page: Page, name: string): Locator {
  return page.getByRole("textbox", { name, exact: true });
}

export async function fillPane(locator: Locator, text: string): Promise<void> {
  const isTextarea = await locator.evaluate((el) => el instanceof HTMLTextAreaElement);
  if (isTextarea) {
    await locator.fill(text);
    return;
  }
  const handled = await locator.evaluate((el, content) => {
    const cmElement = el.closest(".cm-editor") ?? el;
    const view =
      (
        cmElement as unknown as {
          cmEditorView?: { dispatch: (tr: unknown) => void; state: { doc: { length: number } } };
        }
      ).cmEditorView ??
      (
        el as unknown as {
          cmEditorView?: { dispatch: (tr: unknown) => void; state: { doc: { length: number } } };
        }
      ).cmEditorView;
    if (view && typeof view.dispatch === "function") {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
      return true;
    }
    return false;
  }, text);

  if (handled) return;

  // Fallback paste through clipboard pipeline
  const page = locator.page();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await locator.click();
  await page.evaluate(async (content) => {
    await navigator.clipboard.writeText(content);
  }, text);
  await locator.press(process.platform === "darwin" ? "Meta+a" : "Control+a");
  await locator.press(process.platform === "darwin" ? "Meta+v" : "Control+v");
}

export async function paneText(locator: Locator): Promise<string> {
  return locator.evaluate((el) => {
    if (el instanceof HTMLTextAreaElement) return el.value;
    const cmElement = el.closest(".cm-editor") ?? el;
    const view =
      (cmElement as unknown as { cmEditorView?: { state?: { doc?: { toString: () => string } } } })
        .cmEditorView ??
      (el as unknown as { cmEditorView?: { state?: { doc?: { toString: () => string } } } })
        .cmEditorView;
    if (view?.state?.doc) {
      return view.state.doc.toString();
    }
    return Array.from(el.querySelectorAll(".cm-line"), (row) => {
      if (row.querySelector(".cm-placeholder")) return "";
      return row.textContent ?? "";
    }).join("\n");
  });
}

export async function expectPaneText(locator: Locator, expected: string): Promise<void> {
  await expect
    .poll(async () => (await paneText(locator)).replace(/\n+$/, ""))
    .toBe(expected.replace(/\n+$/, ""));
}

export async function expectPaneNotEmpty(locator: Locator): Promise<void> {
  await expect.poll(async () => (await paneText(locator)).trim().length).toBeGreaterThan(0);
}

export async function expectPaneEmpty(locator: Locator): Promise<void> {
  await expect.poll(async () => (await paneText(locator)).trim()).toBe("");
}
