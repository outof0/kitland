import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionRoot = path.resolve(__dirname, "..");
const distDir = path.join(extensionRoot, "dist");
const outputDir = path.join(extensionRoot, "store-assets");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Simple static HTTP server for dist
function startServer(port = 43820) {
  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".json": "application/json",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split("?")[0].split("#")[0];
    if (reqPath === "/" || reqPath === "") reqPath = "/popup.html";

    const filePath = path.join(distDir, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const fallback = path.join(distDir, "popup.html");
      if (fs.existsSync(fallback)) {
        res.writeHead(200, { "Content-Type": "text/html" });
        fs.createReadStream(fallback).pipe(res);
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    }
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((cb) => server.close(cb)),
      });
    });
  });
}

// Helper to fill CodeMirror
async function fillEditor(locator, text) {
  await locator.evaluate((el, content) => {
    const cmElement = el.closest(".cm-editor") ?? el;
    const view = cmElement.cmEditorView ?? el.cmEditorView;
    if (view && typeof view.dispatch === "function") {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
      return true;
    }
    return false;
  }, text);
}

async function main() {
  console.log("Starting static server...");
  const { baseUrl, close } = await startServer();
  console.log(`Server running at ${baseUrl}`);

  console.log("Launching headless browser...");
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      colorScheme: "dark",
    });

    const page = await context.newPage();

    // 1. JSON Formatter
    console.log("Generating 01-json-formatter-1280x800.png...");
    await page.goto(`${baseUrl}/popup.html#tool=json-formatter`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const jsonInput = page.getByRole("textbox", { name: "JSON input" });
    if (await jsonInput.isVisible()) {
      const sampleJson = JSON.stringify(
        {
          name: "Kitland DevSuite",
          version: "0.1.1",
          privacy: {
            offlineOnly: true,
            permissionsRequired: false,
            analytics: "none",
            dataStorage: "local-memory",
          },
          features: [
            "JSON Formatting & Tree Inspection",
            "cURL to Multi-language Converter",
            "JWT Header & Payload Decoder",
            "Regex Tester with Live Highlights",
            "65+ Offline Platform Tools",
          ],
          totalTools: 65,
          rating: 5.0,
          released: true,
        },
        null,
        2,
      );
      await fillEditor(jsonInput, sampleJson);
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path: path.join(outputDir, "01-json-formatter-1280x800.png"),
      fullPage: false,
    });

    // 2. cURL Converter
    console.log("Generating 02-curl-converter-1280x800.png...");
    await page.goto(`${baseUrl}/popup.html#tool=curl-converter`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const curlInput = page.getByRole("textbox", { name: "cURL command" });
    if (await curlInput.isVisible()) {
      const sampleCurl = `curl -X POST "https://api.example.com/v1/auth/tokens" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "User-Agent: Kitland-BrowserExtension/0.1.1" \\
  -d '{"client_id": "kitland-client", "scope": "read write", "grant_type": "client_credentials"}'`;
      await fillEditor(curlInput, sampleCurl);
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path: path.join(outputDir, "02-curl-converter-1280x800.png"),
      fullPage: false,
    });

    // 3. JWT Decoder
    console.log("Generating 03-jwt-decoder-1280x800.png...");
    await page.goto(`${baseUrl}/popup.html#tool=jwt-decoder`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const jwtSampleBtn = page.getByRole("button", { name: "Sample" });
    if (await jwtSampleBtn.isVisible()) {
      await jwtSampleBtn.click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({
      path: path.join(outputDir, "03-jwt-decoder-1280x800.png"),
      fullPage: false,
    });

    // 4. Regex Tester
    console.log("Generating 04-regex-tester-1280x800.png...");
    await page.goto(`${baseUrl}/popup.html#tool=regex-tester`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const regexSampleBtn = page.getByRole("button", { name: "Sample" });
    if (await regexSampleBtn.isVisible()) {
      await regexSampleBtn.click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({
      path: path.join(outputDir, "04-regex-tester-1280x800.png"),
      fullPage: false,
    });

    // 5. Command Palette / 65-tool Registry
    console.log("Generating 05-command-palette-1280x800.png...");
    await page.goto(`${baseUrl}/popup.html#tool=beautify-minify`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const sampleBtn = page.getByRole("button", { name: "Sample" });
    if (await sampleBtn.isVisible()) {
      await sampleBtn.click();
      await page.waitForTimeout(300);
    }
    await page.keyboard.press("Control+k");
    await page.waitForTimeout(400);
    const searchBox = page.getByRole("combobox", { name: "Search registered tools" });
    if (await searchBox.isVisible()) {
      await searchBox.fill("format");
      await page.waitForTimeout(300);
    }
    await page.screenshot({
      path: path.join(outputDir, "05-command-palette-1280x800.png"),
      fullPage: false,
    });

    // 6. Promo Small (440x280)
    console.log("Generating promo-small-440x280.png...");
    const promoSmallPage = await context.newPage();
    await promoSmallPage.setViewportSize({ width: 440, height: 280 });

    const icon128Base64 = fs
      .readFileSync(path.join(distDir, "icons/icon-128.png"))
      .toString("base64");

    const promoSmallHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          body {
            width: 440px;
            height: 280px;
            background: linear-gradient(135deg, #090d16 0%, #111827 50%, #0f172a 100%);
            color: #f3f4f6;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 24px;
            position: relative;
            overflow: hidden;
          }
          .glow {
            position: absolute;
            width: 260px;
            height: 260px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%);
            top: -50px;
            right: -50px;
            border-radius: 50%;
            pointer-events: none;
          }
          .glow-bottom {
            position: absolute;
            width: 220px;
            height: 220px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%);
            bottom: -60px;
            left: -40px;
            border-radius: 50%;
            pointer-events: none;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
          }
          .logo {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
          }
          .title {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.03em;
            background: linear-gradient(to right, #ffffff, #93c5fd);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .tagline {
            font-size: 13px;
            color: #94a3b8;
            text-align: center;
            margin-bottom: 16px;
            max-width: 360px;
            line-height: 1.4;
          }
          .badges {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
          }
          .badge {
            font-size: 11px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 9999px;
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #cbd5e1;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .badge-blue {
            background: rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.35);
            color: #93c5fd;
          }
          .badge-green {
            background: rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.35);
            color: #6ee7b7;
          }
        </style>
      </head>
      <body>
        <div class="glow"></div>
        <div class="glow-bottom"></div>
        <div class="brand">
          <img class="logo" src="data:image/png;base64,${icon128Base64}" alt="Kitland" />
          <span class="title">Kitland</span>
        </div>
        <p class="tagline">Everyday developer tools, right in your browser tab. Fast, local & private.</p>
        <div class="badges">
          <div class="badge badge-blue">✨ 65+ Dev Tools</div>
          <div class="badge badge-green">🔒 100% Offline</div>
          <div class="badge">⚡ Zero Permissions</div>
        </div>
      </body>
      </html>
    `;

    await promoSmallPage.setContent(promoSmallHtml);
    await promoSmallPage.waitForTimeout(200);
    await promoSmallPage.screenshot({
      path: path.join(outputDir, "promo-small-440x280.png"),
    });
    await promoSmallPage.close();

    // 7. Promo Marquee (1400x560)
    console.log("Generating promo-marquee-1400x560.png...");
    const promoMarqueePage = await context.newPage();
    await promoMarqueePage.setViewportSize({ width: 1400, height: 560 });

    const promoMarqueeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          body {
            width: 1400px;
            height: 560px;
            background: radial-gradient(circle at 70% 30%, #1e293b 0%, #0f172a 40%, #080c14 100%);
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 60px 80px;
            position: relative;
            overflow: hidden;
          }
          .glow-top {
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%);
            top: -200px;
            right: 100px;
            border-radius: 50%;
            pointer-events: none;
          }
          .glow-bottom {
            position: absolute;
            width: 450px;
            height: 450px;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
            bottom: -150px;
            left: 200px;
            border-radius: 50%;
            pointer-events: none;
          }
          .left-content {
            max-width: 640px;
            z-index: 2;
          }
          .brand-row {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
          }
          .logo {
            width: 64px;
            height: 64px;
            border-radius: 14px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15);
          }
          .brand-title {
            font-size: 42px;
            font-weight: 800;
            letter-spacing: -0.03em;
            background: linear-gradient(to right, #ffffff 30%, #93c5fd 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .headline {
            font-size: 32px;
            font-weight: 700;
            line-height: 1.25;
            color: #f1f5f9;
            margin-bottom: 14px;
            letter-spacing: -0.02em;
          }
          .headline span {
            color: #60a5fa;
          }
          .desc {
            font-size: 16px;
            line-height: 1.6;
            color: #94a3b8;
            margin-bottom: 28px;
          }
          .badges-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .pill {
            font-size: 13px;
            font-weight: 600;
            padding: 8px 16px;
            border-radius: 9999px;
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #e2e8f0;
            display: flex;
            align-items: center;
            gap: 6px;
            backdrop-filter: blur(8px);
          }
          .pill-blue {
            background: rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.35);
            color: #93c5fd;
          }
          .pill-emerald {
            background: rgba(16, 185, 129, 0.15);
            border-color: rgba(16, 185, 129, 0.35);
            color: #6ee7b7;
          }
          .right-cards {
            display: flex;
            flex-direction: column;
            gap: 14px;
            width: 480px;
            z-index: 2;
          }
          .card {
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px 20px;
            backdrop-filter: blur(12px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          }
          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .card-title {
            font-size: 14px;
            font-weight: 700;
            color: #e2e8f0;
          }
          .card-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 6px;
            background: rgba(59, 130, 246, 0.2);
            color: #93c5fd;
            text-transform: uppercase;
          }
          .card-content {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.5;
          }
          .card-content .hl {
            color: #38bdf8;
          }
          .card-content .str {
            color: #34d399;
          }
          .card-content .kw {
            color: #f472b6;
          }
        </style>
      </head>
      <body>
        <div class="glow-top"></div>
        <div class="glow-bottom"></div>

        <div class="left-content">
          <div class="brand-row">
            <img class="logo" src="data:image/png;base64,${icon128Base64}" alt="Kitland" />
            <span class="brand-title">Kitland</span>
          </div>
          <h1 class="headline">Everyday developer tools,<br/><span>all in one offline tab</span></h1>
          <p class="desc">Formatters, encoders, security tools, converters and diff utilities. Zero permissions required. Completely client-side.</p>
          <div class="badges-row">
            <div class="pill pill-blue">⚡ 65+ Built-in Tools</div>
            <div class="pill pill-emerald">🔒 100% Offline & Private</div>
            <div class="pill">🛡️ Zero Extension Permissions</div>
          </div>
        </div>

        <div class="right-cards">
          <div class="card">
            <div class="card-header">
              <div class="card-title">JSON Formatter & Validator</div>
              <div class="card-badge">Instant</div>
            </div>
            <div class="card-content">
              { <span class="hl">"status"</span>: <span class="str">"valid"</span>, <span class="hl">"tools"</span>: 65, <span class="hl">"offline"</span>: <span class="kw">true</span> }
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">cURL Converter</div>
              <div class="card-badge">Multi-Target</div>
            </div>
            <div class="card-content">
              <span class="kw">await</span> fetch(<span class="str">"https://api.example.com"</span>, { ... })
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">JWT Decoder & Crypto Suite</div>
              <div class="card-badge">Client-side</div>
            </div>
            <div class="card-content">
              Header: <span class="str">HS256</span> | Payload claims | Expiration check
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await promoMarqueePage.setContent(promoMarqueeHtml);
    await promoMarqueePage.waitForTimeout(200);
    await promoMarqueePage.screenshot({
      path: path.join(outputDir, "promo-marquee-1400x560.png"),
    });
    await promoMarqueePage.close();

    console.log("All screenshots generated successfully in:", outputDir);
  } finally {
    await browser.close();
    await close();
  }
}

main().catch((err) => {
  console.error("Error generating screenshots:", err);
  process.exit(1);
});
