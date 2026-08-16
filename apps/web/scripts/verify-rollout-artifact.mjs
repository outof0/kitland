#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const distDirectory = resolve(scriptDirectory, "..", "dist");
const errors = [];

if (!existsSync(distDirectory)) {
  fail(`Missing build output: ${distDirectory}. Run build first.`);
} else {
  const landing = readHtml("index.html");
  const registry = readHtml("explore.html");
  const editorSlugs = collectEditorSlugs(registry);
  const expectedRouteFiles = editorSlugs.map((slug) => `explore/${slug}.html`).sort();
  const emittedRouteFiles = listHtmlFiles(resolve(distDirectory, "explore")).sort();

  if (editorSlugs.length === 0) {
    fail("The public registry contains no runnable editor links.");
  }
  if (countOpenRegistryCards(registry) !== editorSlugs.length) {
    fail("Every registry card marked available must have exactly one editor link.");
  }

  compareExact("emitted available-tool documents", emittedRouteFiles, expectedRouteFiles);
  verifySitemap(editorSlugs);
  verifyLandingLinks(landing, editorSlugs);
  verifyRendererChunkCoverage(editorSlugs);
}

if (errors.length > 0) {
  console.error("Rollout web artifact verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Rollout web artifact verification passed.");
}

function readHtml(relativePath) {
  const path = resolve(distDirectory, relativePath);
  if (!existsSync(path)) {
    fail(`Missing emitted page: ${relativePath}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function collectEditorSlugs(html) {
  const slugs = [...html.matchAll(/href=["']\/explore\/([^"'#?]+)["']/gu)].map((match) => match[1]);
  const uniqueSlugs = [...new Set(slugs)].sort();
  if (uniqueSlugs.length !== slugs.length) {
    fail("The public registry has duplicate editor links.");
  }
  if (uniqueSlugs.some((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug))) {
    fail("The public registry contains an invalid editor slug.");
  }
  return uniqueSlugs;
}

function countOpenRegistryCards(html) {
  return [...html.matchAll(/data-explore-action=["']open["']/gu)].length;
}

function verifySitemap(expectedTools) {
  const sitemapFiles = readdirSync(distDirectory)
    .filter((file) => /^sitemap-(?!index\.xml$).+\.xml$/u.test(file))
    .sort();
  if (sitemapFiles.length === 0) {
    fail("No route sitemap was emitted.");
    return;
  }

  const urls = sitemapFiles.flatMap((file) =>
    getXmlLocations(readFileSync(resolve(distDirectory, file), "utf8")),
  );
  if (!urls.includes("https://kitland.dev/explore")) {
    fail("The sitemap is missing /explore.");
  }
  const toolPaths = urls
    .map((url) => new URL(url).pathname)
    .filter((pathname) => pathname.startsWith("/explore/"))
    .map((pathname) => pathname.slice("/explore/".length))
    .sort();
  compareExact("sitemap available-tool routes", toolPaths, [...expectedTools].sort());
}

function verifyLandingLinks(html, availableSlugs) {
  const linkedTools = [...html.matchAll(/href=["']\/explore\/([^"'#?]+)["']/gu)].map(
    (match) => match[1],
  );
  const unexpected = linkedTools.filter((slug) => !availableSlugs.includes(slug));
  if (unexpected.length > 0) {
    fail(`Landing links to unavailable editor routes: ${[...new Set(unexpected)].join(", ")}.`);
  }
}

/**
 * The full registry is intentionally preserved in every deployment. A
 * release-ready subset certifies rollout work; it must not strip unrelated
 * registry-available editor chunks from the public artifact.
 */
function verifyRendererChunkCoverage(expectedTools) {
  const assetDirectory = resolve(distDirectory, "_astro");
  if (!existsSync(assetDirectory)) {
    fail("The artifact has no _astro asset directory.");
    return;
  }

  const workspaceEntries = readdirSync(assetDirectory).filter((file) =>
    /^ToolWorkspaceIsland\..+\.js$/u.test(file),
  );
  if (workspaceEntries.length !== 1) {
    fail(
      `Expected exactly one ToolWorkspaceIsland entry, found ${workspaceEntries.length}: ${workspaceEntries.join(", ")}.`,
    );
    return;
  }

  const source = readFileSync(resolve(assetDirectory, workspaceEntries[0]), "utf8");
  const lazyRendererImports = [...source.matchAll(/import\(["'`]\.\/[^"'`]+\.js["'`]\)/gu)];
  if (lazyRendererImports.length !== expectedTools.length) {
    fail(
      `Workspace emits ${lazyRendererImports.length} lazy renderer imports for ${expectedTools.length} runnable registry tools.`,
    );
  }
}

function listHtmlFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const absolute = resolve(directory, entry);
    if (statSync(absolute).isDirectory()) return listHtmlFiles(absolute);
    if (!entry.endsWith(".html")) return [];
    return [relative(distDirectory, absolute).split("\\\\").join("/")];
  });
}

function getXmlLocations(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/giu)].map((match) =>
    match[1].trim().replace(/&amp;/gu, "&"),
  );
}

function compareExact(label, actual, expected) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    fail(`${label} mismatch: expected [${expected.join(", ")}], received [${actual.join(", ")}].`);
  }
}

function fail(message) {
  errors.push(message);
}
