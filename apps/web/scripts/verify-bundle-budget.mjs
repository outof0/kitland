#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const DIST_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..", "dist");
const ASSET_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..", "dist", "_astro");
const LANDING_DOCUMENT = resolve(DIST_DIRECTORY, "index.html");
const LANDING_SOCIAL_IMAGE = resolve(DIST_DIRECTORY, "og-kitland-workbench.png");

/**
 * Budgets apply to compressed network transfer, not raw source bytes. They are
 * intentionally per-entry rather than a single site-wide ceiling: a future
 * tool may add its own route-local island without making the existing Base64
 * route slower. Raise a budget only with a measured rationale in the PR.
 */
const BUDGETS = [
  {
    label: "Astro client bootstrap",
    file: /^client\..+\.js$/,
    maxGzipBytes: 64 * 1024,
  },
  {
    label: "Tool workspace island",
    file: /^ToolWorkspaceIsland\..+\.js$/,
    maxGzipBytes: 40 * 1024,
  },
  {
    label: "Base64 worker",
    file: /^base64\.worker-.+\.js$/,
    maxGzipBytes: 8 * 1024,
  },
  {
    label: "JSON Formatter worker",
    file: /^json-formatter\.worker-.+\.js$/,
    maxGzipBytes: 8 * 1024,
  },
  {
    label: "Encoding transforms worker",
    file: /^encoding-text\.worker-.+\.js$/,
    maxGzipBytes: 30 * 1024,
  },
  {
    label: "Structured transforms worker",
    file: /^structured-text-transform\.worker-.+\.js$/,
    maxGzipBytes: 12 * 1024,
  },
];
if (!existsSync(ASSET_DIRECTORY)) {
  console.error(`Bundle budget gate failed: missing build assets at ${ASSET_DIRECTORY}`);
  process.exitCode = 1;
} else {
  const files = readdirSync(ASSET_DIRECTORY).filter((file) => file.endsWith(".js"));
  const failures = [];

  for (const budget of BUDGETS) {
    const matches = files.filter((file) => budget.file.test(file));
    // Astro emits the hydration bootstrap plus a small view-transitions chunk
    // as separate client.*.js entries when ClientRouter is enabled; size-check
    // their combined transfer instead of requiring a single file.
    const combined = budget.label === "Astro client bootstrap";
    if (combined) {
      if (matches.length === 0) {
        failures.push(`${budget.label} expected an entry matching ${budget.file}, found none.`);
        continue;
      }
      if (matches.length > 2) {
        failures.push(
          `${budget.label} expected at most two entries matching ${budget.file}, found ${matches.length}.`,
        );
        continue;
      }
    } else if (matches.length !== 1) {
      failures.push(
        `${budget.label} expected exactly one entry matching ${budget.file}, found ${matches.length}.`,
      );
      continue;
    }

    const gzipBytes = matches.reduce(
      (total, file) =>
        total + gzipSync(readFileSync(resolve(ASSET_DIRECTORY, file)), { level: 9 }).byteLength,
      0,
    );
    const status = gzipBytes <= budget.maxGzipBytes ? "within" : "over";
    console.log(
      `${budget.label}: ${formatBytes(gzipBytes)} gzip / ${formatBytes(budget.maxGzipBytes)} budget (${status})`,
    );

    if (gzipBytes > budget.maxGzipBytes) {
      failures.push(
        `${budget.label} is ${formatBytes(gzipBytes - budget.maxGzipBytes)} over its gzip budget (${matches.join(", ")}).`,
      );
    }
  }

  const landingIslands = files.filter((file) => /^Landing.+\.js$/.test(file));
  if (landingIslands.length > 0) {
    failures.push(
      `Landing must remain static HTML; found client entries: ${landingIslands.join(", ")}.`,
    );
  }

  if (!existsSync(LANDING_DOCUMENT)) {
    failures.push("Landing document is missing from the static build.");
  } else {
    const landing = readFileSync(LANDING_DOCUMENT);
    const landingGzipBytes = gzipSync(landing, { level: 9 }).byteLength;
    const landingBudget = 16 * 1024;
    const status = landingGzipBytes <= landingBudget ? "within" : "over";
    console.log(
      `Landing HTML: ${formatBytes(landingGzipBytes)} gzip / ${formatBytes(landingBudget)} budget (${status})`,
    );
    if (landingGzipBytes > landingBudget) {
      failures.push(
        `Landing HTML is ${formatBytes(landingGzipBytes - landingBudget)} over its gzip budget.`,
      );
    }

    if (landing.includes(Buffer.from("<astro-island"))) {
      failures.push("Landing must not hydrate an application island.");
    }

    const landingHtml = landing.toString("utf8");
    const cssFiles = [
      ...new Set(
        [...landingHtml.matchAll(/href=["']\/?_astro\/([^"']+\.css)["']/g)].map(
          (match) => match[1],
        ),
      ),
    ];
    const cssGzipBytes = cssFiles.reduce((total, file) => {
      const assetPath = resolve(ASSET_DIRECTORY, file);
      if (!existsSync(assetPath)) {
        failures.push(`Landing references missing CSS asset: ${file}.`);
        return total;
      }
      return total + gzipSync(readFileSync(assetPath), { level: 9 }).byteLength;
    }, 0);
    // The 64-tool catalog expansion, rich design system token set and
    // Tailwind 4 utility generation for the full marketing + workspace
    // stylesheet increase the shared CSS. Measured at ~24.4 KiB gzip after
    // the unified token migration; keep ceiling at 28 KiB to prevent
    // unbounded growth while allowing the current design system.
    const cssBudget = 28 * 1024;
    const cssStatus = cssGzipBytes <= cssBudget ? "within" : "over";
    console.log(
      `Landing CSS: ${formatBytes(cssGzipBytes)} gzip / ${formatBytes(cssBudget)} budget (${cssStatus})`,
    );
    if (cssGzipBytes > cssBudget) {
      failures.push(
        `Landing CSS is ${formatBytes(cssGzipBytes - cssBudget)} over its gzip budget.`,
      );
    }
  }

  if (!existsSync(LANDING_SOCIAL_IMAGE)) {
    failures.push("Landing social image is missing from the static build.");
  } else {
    const imageBytes = readFileSync(LANDING_SOCIAL_IMAGE).byteLength;
    const imageBudget = 350 * 1024;
    const imageStatus = imageBytes <= imageBudget ? "within" : "over";
    console.log(
      `Landing social image: ${formatBytes(imageBytes)} raw / ${formatBytes(imageBudget)} budget (${imageStatus})`,
    );
    if (imageBytes > imageBudget) {
      failures.push(
        `Landing social image is ${formatBytes(imageBytes - imageBudget)} over its raw budget.`,
      );
    }
  }

  if (failures.length > 0) {
    console.error("Bundle budget gate failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KiB`;
}
