#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ORIGIN = "https://kitland.dev";
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const DIST_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..", "dist");
const errors = [];

function fail(message) {
  errors.push(message);
}

function readText(relativePath) {
  const path = resolve(DIST_DIRECTORY, relativePath);

  if (!existsSync(path)) {
    fail(`Missing built file: ${relativePath}`);
    return null;
  }

  return readFileSync(path, "utf8");
}

function unwrapCdata(value) {
  const trimmed = value.trim();
  return trimmed.startsWith("<![CDATA[") && trimmed.endsWith("]]>")
    ? trimmed.slice("<![CDATA[".length, -"]]>".length)
    : trimmed;
}

function getXmlLocations(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) => {
    const value = unwrapCdata(match[1]);
    if (value.includes("&")) {
      fail(`Sitemap location must not contain XML entities: ${value}`);
    }
    return value;
  });
}

function getTags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))].map((match) => match[0]);
}

function getAttribute(tag, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(
    new RegExp(`(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"),
  );

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function getMetaContent(html, attribute, value) {
  const expectedValue = value.toLowerCase();
  const tag = getTags(html, "meta").find(
    (candidate) => getAttribute(candidate, attribute)?.toLowerCase() === expectedValue,
  );

  return tag ? getAttribute(tag, "content")?.trim() || null : null;
}

function getCanonical(html) {
  const tag = getTags(html, "link").find(
    (candidate) => getAttribute(candidate, "rel")?.toLowerCase() === "canonical",
  );

  return tag ? getAttribute(tag, "href")?.trim() || null : null;
}

function normalizedSiteUrl(value, label) {
  let url;

  try {
    url = new URL(value);
  } catch {
    fail(`${label} is not an absolute URL: ${value}`);
    return null;
  }

  if (url.origin !== SITE_ORIGIN) {
    fail(`${label} must use ${SITE_ORIGIN}: ${value}`);
    return null;
  }

  if (url.search || url.hash) {
    fail(`${label} must not include a query string or fragment: ${value}`);
    return null;
  }

  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    fail(`${label} must not have a trailing slash: ${value}`);
    return null;
  }

  return url.pathname === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${url.pathname}`;
}

function relativeFilePath(url) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(url.pathname);
  } catch {
    fail(`Cannot decode URL path: ${url.pathname}`);
    return null;
  }

  const segments = decodedPath.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === "..")) {
    fail(`Unsafe path in sitemap: ${url.pathname}`);
    return null;
  }

  return segments.join("/");
}

function htmlCandidates(url) {
  const route = relativeFilePath(url);
  if (route === null) return [];
  if (!route) return ["index.html"];

  // Astro's current `build.format = "file"` writes foo.html. Supporting the
  // directory form keeps the gate valid if the output convention changes.
  return [`${route}.html`, `${route}/index.html`];
}

function readBuiltPage(url) {
  const candidates = htmlCandidates(url);
  const relativePath = candidates.find((candidate) =>
    existsSync(resolve(DIST_DIRECTORY, candidate)),
  );

  if (!relativePath) {
    fail(`Sitemap route ${url.pathname} does not resolve to built HTML (${candidates.join(", ")})`);
    return null;
  }

  return { html: readText(relativePath), relativePath };
}

function hasSchemaType(value, type) {
  if (Array.isArray(value)) {
    return value.some((item) => hasSchemaType(item, type));
  }

  if (!value || typeof value !== "object") return false;
  if (value["@type"] === type) return true;

  return Object.values(value).some((item) => hasSchemaType(item, type));
}

function hasJsonLdType(html, type, pageLabel) {
  const scripts = findScriptElements(html).filter(
    ({ attributes }) => getAttribute(attributes, "type")?.toLowerCase() === "application/ld+json",
  );

  let found = false;
  for (const { content } of scripts) {
    try {
      found ||= hasSchemaType(JSON.parse(content), type);
    } catch {
      fail(`${pageLabel} contains invalid JSON-LD`);
    }
  }

  return found;
}

function findScriptElements(html) {
  const lower = html.toLowerCase();
  const scripts = [];
  let cursor = 0;

  while (cursor < html.length) {
    const start = findHtmlTagStart(lower, "script", cursor);
    if (start === -1) return scripts;
    const openingEnd = findHtmlTagEnd(html, start);
    if (openingEnd === -1) return scripts;

    const closingStart = findHtmlEndTagStart(lower, "script", openingEnd + 1);
    if (closingStart === -1) return scripts;
    const closingEnd = findHtmlTagEnd(html, closingStart);
    if (closingEnd === -1) return scripts;

    scripts.push({
      attributes: html.slice(start + "<script".length, openingEnd),
      content: html.slice(openingEnd + 1, closingStart),
    });
    cursor = closingEnd + 1;
  }

  return scripts;
}

function findHtmlTagStart(lowerHtml, name, cursor) {
  return findHtmlTagPrefix(lowerHtml, `<${name}`, cursor);
}

function findHtmlEndTagStart(lowerHtml, name, cursor) {
  return findHtmlTagPrefix(lowerHtml, `</${name}`, cursor);
}

function findHtmlTagPrefix(lowerHtml, prefix, cursor) {
  let start = lowerHtml.indexOf(prefix, cursor);
  while (start !== -1) {
    const next = lowerHtml[start + prefix.length] ?? "";
    if (next === ">" || next === "/" || /\s/u.test(next)) return start;
    start = lowerHtml.indexOf(prefix, start + prefix.length);
  }
  return -1;
}

function findHtmlTagEnd(html, start) {
  let quote = null;
  for (let index = start + 1; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index;
    }
  }
  return -1;
}

function visibleText(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function verifyCommonMetadata(page, sitemapUrl, relativePath) {
  const pageLabel = `${sitemapUrl.pathname || "/"} (${relativePath})`;
  const title = htmlTitle(page.html);
  const description = getMetaContent(page.html, "name", "description");
  const canonical = getCanonical(page.html);
  const robots = getMetaContent(page.html, "name", "robots");

  if (!title) fail(`${pageLabel} is missing a non-empty <title>`);
  if (!description) fail(`${pageLabel} is missing a non-empty meta description`);
  if (!canonical) {
    fail(`${pageLabel} is missing a canonical URL`);
  } else {
    const normalizedCanonical = normalizedSiteUrl(canonical, `${pageLabel} canonical`);
    const normalizedSitemapUrl = normalizedSiteUrl(sitemapUrl.href, `${pageLabel} sitemap URL`);
    if (
      normalizedCanonical &&
      normalizedSitemapUrl &&
      normalizedCanonical !== normalizedSitemapUrl
    ) {
      fail(`${pageLabel} canonical does not match its sitemap URL`);
    }
  }

  if (!robots || /\bnoindex\b/i.test(robots)) {
    fail(`${pageLabel} must be indexable (missing or noindex robots meta)`);
  }
}

function htmlTitle(html) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? visibleText(match[1]) : null;
}

function verifyCsp(page, relativePath) {
  const policy = getMetaContent(page.html, "http-equiv", "content-security-policy");
  const pageLabel = `${page.url.pathname || "/"} (${relativePath})`;

  if (!policy) {
    fail(`${pageLabel} is missing the static CSP meta policy`);
    return;
  }

  const expectedDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "script-src-attr 'none'",
    "style-src-attr 'none'",
  ];
  for (const directive of expectedDirectives) {
    if (!policy.includes(directive)) {
      fail(`${pageLabel} CSP is missing ${directive}`);
    }
  }

  if (/\b(?:script-src|style-src)\b[^;]*'unsafe-inline'/i.test(policy)) {
    fail(`${pageLabel} CSP must not allow unsafe inline scripts or styles`);
  }

  if (/\son[a-z-]+\s*=/i.test(page.html)) {
    fail(`${pageLabel} contains an inline event handler blocked by CSP`);
  }

  if (/<[^>]+\sstyle\s*=/i.test(page.html)) {
    fail(`${pageLabel} contains an inline style attribute blocked by CSP`);
  }
}

function verifyNoSpaFallback() {
  if (!existsSync(resolve(DIST_DIRECTORY, "_redirects"))) return;

  const redirects = readText("_redirects");
  if (!redirects) return;

  for (const line of redirects.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const [source, , status] = trimmed.split(/\s+/);
    if (source?.includes("*") && status === "200") {
      fail(`SPA fallback redirect is not allowed in _redirects: ${trimmed}`);
    }
  }
}

/**
 * The explorer is the canonical registry surface. It must remain real static
 * HTML as the registry grows; redirecting it to whichever tool happened to be
 * implemented first would make one reference slice define the whole product.
 */
function verifyExploreRegistry(pages) {
  const redirects = readText("_redirects");
  if (redirects) {
    for (const line of redirects.split(/\r?\n/)) {
      const source = line.trim().split(/\s+/)[0];
      if (source === "/explore" || source === "/explore/") {
        fail("/explore must be a static registry page, not a host-level redirect.");
      }
    }
  }

  if (
    !["explore.html", "explore/index.html"].some((file) =>
      existsSync(resolve(DIST_DIRECTORY, file)),
    )
  ) {
    fail("/explore is missing its static registry document.");
  }

  if (![...pages.values()].some((page) => page.pathname === "/explore")) {
    fail("The /explore registry is missing from the sitemap.");
  }
}

function verifyNoLegacyToolRoutes(pages) {
  if (
    [...pages.values()].some(
      (page) => page.pathname === "/tools" || page.pathname.startsWith("/tools/"),
    )
  ) {
    fail("Legacy /tools routes must not be published in the sitemap.");
  }

  for (const legacyFile of [
    "tools",
    "tools.html",
    "tools/index.html",
    "tools/base64.html",
    "tools/base64/index.html",
  ]) {
    if (existsSync(resolve(DIST_DIRECTORY, legacyFile))) {
      fail(`Legacy /tools route is still emitted: ${legacyFile}`);
    }
  }
}

function verifyPublicDeliveryFiles() {
  const robots = readText("robots.txt");
  if (robots) {
    if (!/^User-agent:\s*\*/im.test(robots) || !/^Allow:\s*\//im.test(robots)) {
      fail("robots.txt must explicitly allow public crawlers.");
    }
    if (
      !new RegExp(
        `^Sitemap:\\s*${SITE_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/sitemap-index\\.xml\\s*$`,
        "im",
      ).test(robots)
    ) {
      fail("robots.txt must point to the canonical sitemap-index.xml.");
    }
  }

  const headers = readText("_headers");
  if (headers) {
    for (const header of [
      "X-Content-Type-Options: nosniff",
      "Referrer-Policy: strict-origin-when-cross-origin",
      "X-Frame-Options: DENY",
      "Permissions-Policy:",
      "X-Robots-Tag: noindex",
    ]) {
      if (!headers.includes(header)) {
        fail(`_headers is missing the required delivery policy: ${header}`);
      }
    }
  }

  const notFound = readText("404.html");
  if (notFound) {
    const robotsMeta = getMetaContent(notFound, "name", "robots");
    if (!robotsMeta || !/\bnoindex\b/i.test(robotsMeta)) {
      fail("404.html must be explicitly noindex.");
    }
    if (!/<h1\b[^>]*>/i.test(notFound)) {
      fail("404.html must contain a visible <h1>.");
    }
  }
}

function verifyNoSpaArtifact(page, relativePath) {
  if (/\bsrc=["']\/?src\/main\.(?:[cm]?[jt]sx?)["']/i.test(page.html)) {
    fail(`${page.url.pathname || "/"} (${relativePath}) contains a Vite SPA entry`);
  }

  if (/\$R[BCV]\s*=|\$R[BCV]\(/.test(page.html)) {
    fail(
      `${page.url.pathname || "/"} (${relativePath}) contains a React streaming fallback artifact`,
    );
  }
}

function verifyBase64(page, relativePath) {
  const pageLabel = `/explore/base64 (${relativePath})`;
  const heading = page.html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);

  if (!heading || !/base64/i.test(visibleText(heading[1]))) {
    fail(`${pageLabel} is missing a visible Base64 <h1>`);
  }

  if (!hasJsonLdType(page.html, "WebApplication", pageLabel)) {
    fail(`${pageLabel} is missing WebApplication JSON-LD`);
  }

  for (const property of ["og:title", "og:description", "og:url", "og:image"]) {
    if (!getMetaContent(page.html, "property", property)) {
      fail(`${pageLabel} is missing a non-empty ${property} meta tag`);
    }
  }

  const ogUrl = getMetaContent(page.html, "property", "og:url");
  const normalizedOgUrl = ogUrl ? normalizedSiteUrl(ogUrl, `${pageLabel} og:url`) : null;
  const normalizedPageUrl = normalizedSiteUrl(page.url.href, `${pageLabel} sitemap URL`);
  if (normalizedOgUrl && normalizedPageUrl && normalizedOgUrl !== normalizedPageUrl) {
    fail(`${pageLabel} og:url does not match its canonical route`);
  }

  const ogImage = getMetaContent(page.html, "property", "og:image");
  if (ogImage) {
    const normalizedOgImage = normalizedSiteUrl(ogImage, `${pageLabel} og:image`);
    if (normalizedOgImage) {
      const ogImagePath = relativeFilePath(new URL(ogImage));
      if (!ogImagePath || !existsSync(resolve(DIST_DIRECTORY, ogImagePath))) {
        fail(`${pageLabel} og:image does not resolve to a built static asset`);
      }
    }
  }
}

function verifyLanding(page) {
  const pageLabel = `Landing (${page.relativePath})`;
  const headings = [...page.html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (headings.length !== 1) {
    fail(`${pageLabel} must contain exactly one h1, found ${headings.length}`);
  } else if (!visibleText(headings[0][1])) {
    fail(`${pageLabel} h1 must contain visible text`);
  }

  if (!hasJsonLdType(page.html, "WebSite", pageLabel)) {
    fail(`${pageLabel} is missing WebSite JSON-LD`);
  }

  const ogImage = getMetaContent(page.html, "property", "og:image");
  const ogImageAlt = getMetaContent(page.html, "property", "og:image:alt");
  const ogImageWidth = getMetaContent(page.html, "property", "og:image:width");
  const ogImageHeight = getMetaContent(page.html, "property", "og:image:height");
  const twitterImageAlt = getMetaContent(page.html, "name", "twitter:image:alt");

  if (!ogImageAlt) fail(`${pageLabel} is missing og:image:alt`);
  if (!twitterImageAlt) fail(`${pageLabel} is missing twitter:image:alt`);
  if (ogImageWidth !== "1200" || ogImageHeight !== "630") {
    fail(`${pageLabel} social image metadata must declare 1200x630`);
  }

  if (!ogImage) {
    fail(`${pageLabel} is missing og:image`);
    return;
  }

  let imageUrl;
  try {
    imageUrl = new URL(ogImage);
  } catch {
    fail(`${pageLabel} og:image is not an absolute URL`);
    return;
  }

  const imagePath = resolve(DIST_DIRECTORY, imageUrl.pathname.replace(/^\//, ""));
  if (!existsSync(imagePath)) {
    fail(`${pageLabel} og:image does not resolve to a built static asset`);
    return;
  }

  const image = readFileSync(imagePath);
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (width !== 1200 || height !== 630) {
    fail(`${pageLabel} built social image must be 1200x630, found ${width}x${height}`);
  }
}

if (!existsSync(DIST_DIRECTORY)) {
  fail(`Missing build output: ${DIST_DIRECTORY}. Run the Astro build first.`);
} else {
  const sitemapIndex = readText("sitemap-index.xml");
  const sitemapUrls = sitemapIndex ? getXmlLocations(sitemapIndex) : [];
  const pages = new Map();

  if (sitemapUrls.length === 0) {
    fail("sitemap-index.xml does not contain any sitemap locations");
  }

  for (const sitemapLocation of sitemapUrls) {
    const normalizedSitemap = normalizedSiteUrl(sitemapLocation, "Sitemap location");
    if (!normalizedSitemap) continue;

    let sitemapUrl;
    try {
      sitemapUrl = new URL(sitemapLocation);
    } catch {
      continue;
    }

    const relativePath = relativeFilePath(sitemapUrl);
    if (!relativePath) {
      fail(`Sitemap location must point to a sitemap file: ${sitemapLocation}`);
      continue;
    }

    const sitemap = readText(relativePath);
    if (!sitemap) continue;

    for (const pageLocation of getXmlLocations(sitemap)) {
      const normalizedPage = normalizedSiteUrl(pageLocation, "Sitemap page URL");
      if (!normalizedPage || pages.has(normalizedPage)) {
        if (normalizedPage && pages.has(normalizedPage)) {
          fail(`Duplicate sitemap route: ${normalizedPage}`);
        }
        continue;
      }

      pages.set(normalizedPage, new URL(pageLocation));
    }
  }

  if (pages.size === 0) {
    fail("No indexable page URLs were found in the sitemap files");
  }

  const renderedPages = new Map();
  for (const [normalizedPage, sitemapUrl] of pages) {
    const page = readBuiltPage(sitemapUrl);
    if (!page?.html) continue;

    renderedPages.set(normalizedPage, { ...page, url: sitemapUrl });
    verifyCommonMetadata(page, sitemapUrl, page.relativePath);
    verifyCsp({ ...page, url: sitemapUrl }, page.relativePath);
    verifyNoSpaArtifact({ ...page, url: sitemapUrl }, page.relativePath);
  }

  verifyNoSpaFallback();
  verifyNoLegacyToolRoutes(pages);
  verifyExploreRegistry(pages);
  verifyPublicDeliveryFiles();

  const landingPage = renderedPages.get(SITE_ORIGIN);
  if (!landingPage) {
    fail("Landing route is missing from the sitemap or its static output");
  } else {
    verifyLanding(landingPage);
  }

  const base64Page = renderedPages.get(`${SITE_ORIGIN}/explore/base64`);
  if (!base64Page) {
    fail("Base64 route is missing from the sitemap or its static output");
  } else {
    verifyBase64(base64Page, base64Page.relativePath);
  }

  if (errors.length === 0) {
    console.log(`Static SEO regression gate passed: ${pages.size} sitemap routes verified.`);
  }
}

if (errors.length > 0) {
  console.error("Static SEO regression gate failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}
