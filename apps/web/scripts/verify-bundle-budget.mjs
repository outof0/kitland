#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const DIST_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..", "dist");
const ASSET_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..", "dist", "_astro");
const LANDING_DOCUMENT = resolve(DIST_DIRECTORY, "index.html");

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
];

if (!existsSync(ASSET_DIRECTORY)) {
  console.error(`Bundle budget gate failed: missing build assets at ${ASSET_DIRECTORY}`);
  process.exitCode = 1;
} else {
  const files = readdirSync(ASSET_DIRECTORY).filter((file) => file.endsWith(".js"));
  const failures = [];

  for (const budget of BUDGETS) {
    const matches = files.filter((file) => budget.file.test(file));
    if (matches.length !== 1) {
      failures.push(
        `${budget.label} expected exactly one entry matching ${budget.file}, found ${matches.length}.`,
      );
      continue;
    }

    const file = matches[0];
    const raw = readFileSync(resolve(ASSET_DIRECTORY, file));
    const gzipBytes = gzipSync(raw, { level: 9 }).byteLength;
    const status = gzipBytes <= budget.maxGzipBytes ? "within" : "over";
    console.log(
      `${budget.label}: ${formatBytes(gzipBytes)} gzip / ${formatBytes(budget.maxGzipBytes)} budget (${status})`,
    );

    if (gzipBytes > budget.maxGzipBytes) {
      failures.push(
        `${budget.label} is ${formatBytes(gzipBytes - budget.maxGzipBytes)} over its gzip budget (${file}).`,
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
