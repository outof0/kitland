#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { gzipSync, inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(scriptDirectory, "..");
const distDirectory = resolve(appDirectory, "dist");
const artifactDirectory = resolve(appDirectory, "artifacts");
const verifyArchive = process.argv.includes("--archive");
const errors = [];

if (!existsSync(distDirectory)) {
  fail("Missing dist directory. Run `pnpm build` first.");
} else {
  verifyDistribution();
}

if (verifyArchive) verifyZipArtifact();

if (errors.length > 0) {
  console.error("Browser extension package verification failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Browser extension package verification passed.");
}

function verifyDistribution() {
  const manifest = readJson("manifest.json");
  if (!manifest) return;

  if (manifest.manifest_version !== 3) fail("manifest.json must target Manifest V3.");
  if (manifest.action?.default_popup !== undefined) {
    fail("manifest.json must not pin a popup; the toolbar opens the full tool page in a tab.");
  }
  if (typeof manifest.action?.default_title !== "string" || manifest.action.default_title === "") {
    fail("manifest.json must keep an accessible toolbar title on action.");
  }
  if (!Array.isArray(manifest.permissions) || manifest.permissions.length !== 0) {
    fail("The extension must request zero extension permissions.");
  }
  if (!Array.isArray(manifest.host_permissions) || manifest.host_permissions.length !== 0) {
    fail("The extension must request zero host permissions.");
  }
  if (manifest.content_scripts !== undefined) {
    fail("The local tool shell must not include content-script capabilities.");
  }
  const background = manifest.background;
  const launcherOnly =
    background !== undefined &&
    background.service_worker === "sw.js" &&
    !Array.isArray(background.scripts);
  if (!launcherOnly) {
    fail(
      "background must be the sw.js launcher (service_worker only, Manifest V3) that opens the tool tab.",
    );
  }
  if (
    manifest.content_security_policy?.extension_pages !== "script-src 'self'; object-src 'self'"
  ) {
    fail("Extension CSP must allow packaged scripts only.");
  }
  const sw = readText("sw.js");
  if (sw && !/chrome\.action\.onClicked\.addListener/.test(sw)) {
    fail("sw.js must only listen for toolbar clicks and open the packaged tool page.");
  }
  if (sw && /fetch\(|XMLHttpRequest|WebSocket/.test(sw)) {
    fail("sw.js must not perform network requests.");
  }

  const referencedPaths = [
    ...Object.values(manifest.icons ?? {}),
    ...Object.values(manifest.action?.default_icon ?? {}),
    ...(background?.scripts ?? []),
  ].filter((value) => typeof value === "string");
  for (const path of new Set(referencedPaths)) {
    if (!existsSync(resolve(distDirectory, path)))
      fail(`Manifest references missing file: ${path}`);
  }

  const files = listFiles(distDirectory);
  const sourceMaps = files.filter((file) => file.endsWith(".map"));
  if (sourceMaps.length > 0)
    fail(`Production package contains source maps: ${sourceMaps.join(", ")}`);

  const popup = readText("popup.html");
  if (popup) {
    const scriptTags = [...popup.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
    if (scriptTags.some((match) => match[1].trim().length > 0)) {
      fail("popup.html contains an inline script blocked by extension CSP.");
    }
    if (/\b(?:src|href)=["']https?:/i.test(popup)) {
      fail("popup.html loads a remote asset.");
    }
    if (/adapter-[^"']+\.(?:js|css)/i.test(popup)) {
      fail("popup.html eagerly references a tool adapter instead of loading it on selection.");
    }
  }

  const executableFiles = files.filter((file) => /\.(?:js|css|html)$/.test(file));
  // Inert constants that never cause a network request: W3C XML/SVG namespace
  // identifiers required by react-dom's createElementNS, React error-decoder
  // message prefixes, and the Tailwind build banner when a CSS chunk keeps it.
  // Also: example placeholder URLs embedded in tool samples (e.g. http status / url parser demos).
  const inertUrlPatterns = [
    /^https?:\/\/www\.w3\.org\/(?:2000\/svg|1999\/xlink|1998\/Math\/MathML|XML\/1998\/namespace)$/,
    /^https:\/\/react\.dev\/errors\/?$/,
    /^https:\/\/tailwindcss\.com\/?$/,
    /^https?:\/\/(?:example\.com|kitland\.test|kitland\.dev|api\.example\.com)(?:\/|$)/,
    /^https?:\/\/example\.com\/resource\/.*$/,
  ];
  const isRemoteUrlInert = (url) => {
    // Strip trailing punctuation that regex captured (e.g. ");)
    const clean = url.replace(/[),;"]+$/, "");
    return inertUrlPatterns.some((pattern) => pattern.test(clean));
  };
  for (const file of executableFiles) {
    const content = readText(file);
    if (!content) continue;
    if (/\beval\s*\(|new\s+Function\s*\(/.test(content)) {
      fail(`${file} contains dynamic code execution.`);
    }
    const remoteUrls = [...content.matchAll(/https?:\/\/[^\s"'`)]+/g)]
      .map((match) => match[0])
      .filter((url) => !isRemoteUrlInert(url));
    if (remoteUrls.length > 0) {
      fail(
        `${file} contains a remote URL (${remoteUrls[0]}); extension execution must remain self-contained.`,
      );
    }
  }

  const scripts = files.filter((file) => file.endsWith(".js"));
  let totalScriptGzipBytes = 0;
  for (const file of scripts) {
    const gzipBytes = gzipSync(readFileSync(resolve(distDirectory, file)), { level: 9 }).byteLength;
    totalScriptGzipBytes += gzipBytes;
    const budget = scriptBudget(file);
    console.log(
      `${budget.label}: ${formatBytes(gzipBytes)} gzip / ${formatBytes(budget.maxBytes)} budget (${file})`,
    );
    if (gzipBytes > budget.maxBytes) {
      fail(`${file} exceeds its ${formatBytes(budget.maxBytes)} ${budget.label} budget.`);
    }
  }
  console.log(
    `Total packaged JavaScript (informational): ${formatBytes(totalScriptGzipBytes)} gzip`,
  );
}

/** Per-entry budgets scale with a lazy 64-tool catalog; total package size does not equal startup cost. */
function scriptBudget(file) {
  if (file === "sw.js") {
    // Launcher only: listens for toolbar clicks and opens the packaged page.
    return { label: "Launcher service worker", maxBytes: 4 * 1024 };
  }
  if (/\/popup-[^/]+\.js$/.test(`/${file}`)) {
    // Page shell: catalog-backed registry + chrome. Host tools stay lazy.
    return { label: "Extension shell", maxBytes: 40 * 1024 };
  }
  if (/\/adapter-[^/]+\.js$/.test(`/${file}`)) {
    // Generic adapters may share the full multi-host tool map (64-tool path B).
    return { label: "Lazy tool adapter", maxBytes: 96 * 1024 };
  }
  if (/\.worker-[^/]+\.js$/.test(file)) {
    // Specialty workers ship focused core tool modules (not the full barrel).
    return { label: "Tool worker", maxBytes: 24 * 1024 };
  }
  // Shared chunks hold catalog + host-tool map for multi-tool popups.
  return { label: "Shared lazy chunk", maxBytes: 96 * 1024 };
}

function verifyZipArtifact() {
  if (!existsSync(artifactDirectory)) {
    fail("Missing artifacts directory after packaging.");
    return;
  }
  const archives = readdirSync(artifactDirectory).filter((file) => file.endsWith(".zip"));
  if (archives.length === 0) {
    fail("Expected at least one extension ZIP artifact, found 0.");
    return;
  }
  // Deterministic Chrome/Firefox artifacts: kitland-chrome-*.zip, kitland-firefox-*.zip, and legacy kitland-browser-extension-*.zip
  for (const archiveName of archives) {
    const archive = readFileSync(resolve(artifactDirectory, archiveName));
    if (
      archive.readUInt32LE(0) !== 0x04034b50 ||
      archive.readUInt32LE(archive.length - 22) !== 0x06054b50
    ) {
      fail(`Extension artifact ${archiveName} is not a structurally valid ZIP archive.`);
      continue;
    }
    for (const requiredEntry of ["manifest.json", "popup.html", "sw.js"]) {
      if (!archive.includes(Buffer.from(requiredEntry, "utf8"))) {
        fail(`Extension ZIP ${archiveName} is missing ${requiredEntry}.`);
      }
    }
    console.log(`Archive: ${archiveName} (${formatBytes(archive.byteLength)})`);
    // Firefox variant must contain browser_specific_settings.gecko for AMO – decompress manifest to verify
    if (archiveName.includes("firefox")) {
      try {
        const manifestContent = extractZipEntry(archive, "manifest.json");
        if (!manifestContent || !manifestContent.includes("browser_specific_settings")) {
          fail(`Firefox artifact ${archiveName} is missing browser_specific_settings.gecko.`);
        } else {
          const parsed = JSON.parse(manifestContent);
          if (!parsed.browser_specific_settings?.gecko?.id) {
            fail(`Firefox artifact ${archiveName} gecko.id is missing.`);
          }
        }
      } catch {
        fail(`Firefox artifact ${archiveName} could not be inspected for gecko settings.`);
      }
    }
  }
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    fail(`${relativePath} is not valid JSON.`);
    return null;
  }
}

function readText(relativePath) {
  const path = resolve(distDirectory, relativePath);
  if (!existsSync(path)) {
    fail(`Missing packaged file: ${relativePath}`);
    return null;
  }
  return readFileSync(path, "utf8");
}

function listFiles(directory) {
  return readdirSync(directory)
    .sort()
    .flatMap((entry) => {
      const absolutePath = join(directory, entry);
      return statSync(absolutePath).isDirectory()
        ? listFiles(absolutePath)
        : [relative(distDirectory, absolutePath).split("\\").join("/")];
    });
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function extractZipEntry(zipBuffer, entryName) {
  let offset = 0;
  while (offset + 30 <= zipBuffer.length) {
    const sig = zipBuffer.readUInt32LE(offset);
    if (sig === 0x06054b50) break; // end of central directory
    if (sig !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const method = zipBuffer.readUInt16LE(offset + 8);
    const compSize = zipBuffer.readUInt32LE(offset + 18);
    const nameLen = zipBuffer.readUInt16LE(offset + 26);
    const extraLen = zipBuffer.readUInt16LE(offset + 28);
    const name = zipBuffer.subarray(offset + 30, offset + 30 + nameLen).toString("utf8");
    const dataStart = offset + 30 + nameLen + extraLen;
    const dataEnd = dataStart + compSize;
    if (name === entryName) {
      const payload = zipBuffer.subarray(dataStart, dataEnd);
      if (method === 0) return payload.toString("utf8");
      if (method === 8) return inflateRawSync(payload).toString("utf8");
      return null;
    }
    offset = dataEnd;
    // skip if uncompressed size differs? advance to next local header - we already moved
    // To handle correctly, search for next 0x04034b50
  }
  return null;
}

function fail(message) {
  errors.push(message);
}
