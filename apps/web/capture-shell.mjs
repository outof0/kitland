import { chromium } from "playwright";

const server = await (async () => {
  const { execa } = await import("execa");
  const child = execa(
    "pnpm",
    ["exec", "vite", "preview", "--host", "127.0.0.1", "--port", "43817", "--strictPort"],
    { cwd: "/Users/erik/workspace/lab/js/format/apps/web", detached: true, stdio: "ignore" },
  );
  child.unref();
  for (let i = 0; i < 40; i++) {
    try {
      await fetch("http://127.0.0.1:43817");
      return child;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("preview did not start");
})();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const dir = "/Users/erik/workspace/lab/js/format/apps/web/gui-test-screenshots";
await page.goto("http://127.0.0.1:43817/explore/base64", { waitUntil: "networkidle" });
await page.screenshot({ path: `${dir}/web-1280-light-base64.png` });

await page.emulateMedia({ colorScheme: "dark" });
await page.goto("http://127.0.0.1:43817/explore/base64", { waitUntil: "networkidle" });
await page.screenshot({ path: `${dir}/web-1280-dark-base64.png` });

await page.setViewportSize({ width: 390, height: 844 });
await page.emulateMedia({ colorScheme: "light" });
await page.goto("http://127.0.0.1:43817/explore/base64", { waitUntil: "networkidle" });
await page.screenshot({ path: `${dir}/web-390-light-base64.png` });

const shellProbe = await page.evaluate(() => {
  const root = document.querySelector(".workspace-shell") ?? document.body.firstElementChild;
  return {
    sidebarVisible: !!document.querySelector('[class*="sidebar"], nav'),
    crumb: document.querySelector('[data-testid="tool-title"]')?.textContent ?? null,
    brand: document.querySelector(".brand-mark")?.textContent ?? null,
    bodyTheme: document.documentElement.dataset.theme ?? null,
  };
});
console.log("WEB PROBE", JSON.stringify(shellProbe));
await browser.close();
server.kill("SIGTERM");
