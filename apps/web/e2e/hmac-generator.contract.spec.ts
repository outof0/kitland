import { expect, test } from "@playwright/test";

test("computes the RFC HMAC-SHA-256 vector and clears the secret", async ({ page }) => {
  await page.goto("/explore/hmac-generator");
  await page.getByRole("textbox", { name: "Secret", exact: true }).fill("Jefe");
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("what do ya want for nothing?");
  await page.getByRole("button", { name: "Compute HMAC", exact: true }).click();
  await expect(page.locator("code")).toHaveText(
    "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
  );
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Secret", exact: true })).toHaveValue("");
});
