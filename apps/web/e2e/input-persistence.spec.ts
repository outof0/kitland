import { expect, test } from "@playwright/test";
import { fillPane } from "./support/editor";

test.describe("Input Privacy & No Default Draft Persistence", () => {
  test("does not persist JSON Formatter input in localStorage or sessionStorage by default", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/explore/json-formatter");

    const source = page.getByRole("textbox", { name: "JSON input" });
    await expect(source).toBeVisible();

    // Type custom JSON
    const testJson = JSON.stringify({ project: "Kitland", testPersistence: true }, null, 2);
    await fillPane(source, testJson);

    // Verify localStorage does NOT have draft persisted
    const localVal = await page.evaluate(() =>
      localStorage.getItem("kitland:input:json-formatter"),
    );
    expect(localVal).toBeNull();

    // Verify sessionStorage does NOT have it
    const sessionVal = await page.evaluate(() =>
      sessionStorage.getItem("kitland:input:json-formatter"),
    );
    expect(sessionVal).toBeNull();
  });

  test("does not persist crypto JWT Decoder token in storage by default", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/explore/jwt-decoder");

    const tokenInput = page.getByLabel("Encoded JWT");
    await expect(tokenInput).toBeVisible();

    const customJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ";

    await tokenInput.fill(customJwt);

    // Verify sessionStorage does NOT persist the secret
    const sessionVal = await page.evaluate(() =>
      sessionStorage.getItem("kitland:input:jwt-decoder"),
    );
    expect(sessionVal).toBeNull();

    // Verify localStorage does NOT persist the secret
    const localVal = await page.evaluate(() => localStorage.getItem("kitland:input:jwt-decoder"));
    expect(localVal).toBeNull();
  });
});
