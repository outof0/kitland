#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";
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
  if (manifest.action?.default_popup !== "popup.html") {
    fail("manifest.json must expose popup.html through action.default_popup.");
  }
  if (!Array.isArray(manifest.permissions) || manifest.permissions.length !== 0) {
    fail("The extension must request zero extension permissions.");
  }
  if (!Array.isArray(manifest.host_permissions) || manifest.host_permissions.length !== 0) {
    fail("The extension must request zero host permissions.");
  }
  if (manifest.background !== undefined || manifest.content_scripts !== undefined) {
    fail("The local tool shell must not include background or content-script capabilities.");
  }
  if (
    manifest.content_security_policy?.extension_pages !== "script-src 'self'; object-src 'self'"
  ) {
    fail("Extension CSP must allow packaged scripts only.");
  }

  const referencedPaths = [
    manifest.action?.default_popup,
    ...Object.values(manifest.icons ?? {}),
    ...Object.values(manifest.action?.default_icon ?? {}),
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
  for (const file of executableFiles) {
    const content = readText(file);
    if (!content) continue;
    if (/\beval\s*\(|new\s+Function\s*\(/.test(content)) {
      fail(`${file} contains dynamic code execution.`);
    }
    if (/https?:\/\//i.test(content)) {
      fail(`${file} contains a remote URL; extension execution must remain self-contained.`);
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
  if (/\/popup-[^/]+\.js$/.test(`/${file}`)) {
    return { label: "Extension shell", maxBytes: 12 * 1024 };
  }
  if (/\/adapter-[^/]+\.js$/.test(`/${file}`)) {
    return { label: "Lazy tool adapter", maxBytes: 16 * 1024 };
  }
  if (/\.worker-[^/]+\.js$/.test(file)) {
    return { label: "Tool worker", maxBytes: 8 * 1024 };
  }
  return { label: "Shared lazy chunk", maxBytes: 16 * 1024 };
}

function verifyZipArtifact() {
  if (!existsSync(artifactDirectory)) {
    fail("Missing artifacts directory after packaging.");
    return;
  }
  const archives = readdirSync(artifactDirectory).filter((file) => file.endsWith(".zip"));
  if (archives.length !== 1) {
    fail(`Expected exactly one extension ZIP artifact, found ${archives.length}.`);
    return;
  }

  const archive = readFileSync(resolve(artifactDirectory, archives[0]));
  if (
    archive.readUInt32LE(0) !== 0x04034b50 ||
    archive.readUInt32LE(archive.length - 22) !== 0x06054b50
  ) {
    fail("Extension artifact is not a structurally valid ZIP archive.");
    return;
  }
  for (const requiredEntry of ["manifest.json", "popup.html"]) {
    if (!archive.includes(Buffer.from(requiredEntry, "utf8"))) {
      fail(`Extension ZIP is missing ${requiredEntry}.`);
    }
  }
  console.log(`Archive: ${archives[0]} (${formatBytes(archive.byteLength)})`);
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

function fail(message) {
  errors.push(message);
}
