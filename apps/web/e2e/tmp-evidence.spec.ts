import { expect, test } from "@playwright/test";

test("capture shell evidence screenshots", async ({ page }) => {
  const dir = "gui-test-screenshots";
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/explore/base64", { waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/web-1280-light-base64.png` });
  const light = await page.evaluate(() => ({
    crumb: document.querySelector('[data-testid="tool-title"]')?.textContent ?? null,
    brand: document.querySelector(".brand-mark")?.textContent ?? null,
    theme: document.documentElement.dataset.theme ?? null,
    sidebarLinks: document.querySelectorAll(".registry-nav a").length,
    activeCrumb: document.querySelector(".active-crumb")?.textContent ?? null,
  }));
  expect(light.crumb).toBeTruthy();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/web-1280-dark-base64.png` });
  const dark = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme ?? null,
    inputBg: "",
  }));
  await page.emulateMedia({ colorScheme: "light" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: `${dir}/web-390-light-base64.png` });
  const mobile = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    sidebarWidth: "",
  }));
  console.log("EVIDENCE", JSON.stringify({ light, dark, mobile }));
});
