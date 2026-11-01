import { crawlDecision, parseRobots } from "../src/seo/crawl-policy.ts";

const ORIGIN = "https://kitland.dev";
const PAGES_ORIGIN = "https://kitland.pages.dev/";
const TOOL_PATH = "/explore/json-formatter";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const ATTEMPTS = 4;

const failures = [];

function fail(message) {
  failures.push(message);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchDocument(url, userAgent) {
  let lastError = new Error(`No response from ${url}`);
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": userAgent },
        redirect: "follow",
      });
      if (response.status >= 500 || response.status === 404) {
        lastError = new Error(`${url} returned ${response.status}`);
        await delay(1500 * attempt);
        continue;
      }
      return { response, text: await response.text() };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await delay(1500 * attempt);
    }
  }
  throw lastError;
}

function attribute(html, tagPattern) {
  const match = html.match(tagPattern);
  return match?.[1] ?? "";
}

function assertIndexableDocument(label, url, document) {
  const finalUrl = new URL(document.response.url);
  if (document.response.status !== 200) {
    fail(`${label} returned ${document.response.status}`);
  }
  if (finalUrl.origin !== ORIGIN) {
    fail(`${label} final origin is ${finalUrl.origin}`);
  }
  if (finalUrl.pathname !== new URL(url).pathname) {
    fail(`${label} final path is ${finalUrl.pathname}`);
  }
  const robotsHeader = document.response.headers.get("x-robots-tag") ?? "";
  if (/noindex/i.test(robotsHeader)) {
    fail(`${label} sends X-Robots-Tag noindex`);
  }
  const robots = attribute(document.text, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
  if (!/index/i.test(robots) || /noindex/i.test(robots)) {
    fail(`${label} robots meta is ${JSON.stringify(robots)}`);
  }
  const canonical = attribute(document.text, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (canonical !== url) {
    fail(`${label} canonical is ${JSON.stringify(canonical)}`);
  }
}

const home = await fetchDocument(`${ORIGIN}/`, GOOGLEBOT);
assertIndexableDocument("Homepage", `${ORIGIN}/`, home);
const homeTitle = attribute(home.text, /<title[^>]*>([^<]+)<\/title>/i);
if (!homeTitle.includes("Kitland")) {
  fail(`Homepage title is ${JSON.stringify(homeTitle)}`);
}

const toolUrl = `${ORIGIN}${TOOL_PATH}`;
const tool = await fetchDocument(toolUrl, GOOGLEBOT);
assertIndexableDocument("JSON Formatter", toolUrl, tool);
const toolTitle = attribute(tool.text, /<title[^>]*>([^<]+)<\/title>/i);
if (!toolTitle.startsWith("JSON Formatter")) {
  fail(`JSON Formatter title is ${JSON.stringify(toolTitle)}`);
}

const robots = await fetchDocument(`${ORIGIN}/robots.txt`, GOOGLEBOT);
if (robots.response.status !== 200) {
  fail(`robots.txt returned ${robots.response.status}`);
}
if (!/^Sitemap:\s+https:\/\/kitland\.dev\/sitemap-index\.xml\s*$/m.test(robots.text)) {
  fail("robots.txt does not declare https://kitland.dev/sitemap-index.xml");
}
const groups = parseRobots(robots.text);
for (const path of ["/", TOOL_PATH]) {
  const decision = crawlDecision(groups, "Googlebot", path);
  if (decision !== "allow") {
    fail(`Googlebot is ${decision} for ${path}`);
  }
}

const sitemap = await fetchDocument(`${ORIGIN}/sitemap-index.xml`, GOOGLEBOT);
if (sitemap.response.status !== 200 || !sitemap.text.includes(`${ORIGIN}/sitemap-0.xml`)) {
  fail("sitemap-index.xml does not list sitemap-0.xml");
}
const childLoc = sitemap.text.match(/<loc>([^<]+)<\/loc>/)?.[1];
if (!childLoc) {
  fail("sitemap-index.xml has no loc");
} else {
  const child = await fetchDocument(childLoc, GOOGLEBOT);
  if (!child.text.includes(`<loc>${toolUrl}</loc>`)) {
    fail("The sitemap does not list the JSON Formatter URL");
  }
}

const pages = await fetchDocument(PAGES_ORIGIN, GOOGLEBOT);
const pagesRobots = pages.response.headers.get("x-robots-tag") ?? "";
if (!/noindex/i.test(pagesRobots)) {
  fail("kitland.pages.dev is missing X-Robots-Tag noindex");
}

if (failures.length > 0) {
  for (const message of failures) console.error(`live indexability: ${message}`);
  process.exitCode = 1;
} else {
  console.log(`live indexability passed for ${ORIGIN}`);
}
