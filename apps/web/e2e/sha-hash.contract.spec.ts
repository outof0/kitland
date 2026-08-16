import { expect, test } from "@playwright/test";

test.describe("SHA-256 hash contract", () => {
  test("hashes an explicit input, supports reviewed output encodings, and clears stale output", async ({
    page,
  }) => {
    await page.goto("/explore/sha-hash");
    const input = page.getByRole("textbox", { name: "Input", exact: true });
    const result = page.locator("code");

    await input.fill("hello world");
    await expect(result).toHaveText(
      "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    );
    await expect(page.getByText("11 chars · 32 bytes · SHA-256", { exact: true })).toBeVisible();

    await page.getByRole("combobox", { name: "Encoding", exact: true }).selectOption("base64url");
    await expect(result).toHaveText("uU0nuZNNPgilLlLX2n2r-sSE7-N6U4DukIj3rOLvzek");
    await expect(page.getByText("base64url-encoded · 43 chars", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(input).toHaveValue("");
    await expect(page.getByText("No digest yet. Enter text to generate a hash.")).toBeVisible();
  });
});
