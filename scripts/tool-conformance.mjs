#!/usr/bin/env node
/**
 * KIT-0004: static conformance scan against inventory + web registry source.
 * Does not execute TS catalog (avoids build). Deterministic exit codes.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inventorySource = readFileSync(join(root, "packages/tools/src/inventory.ts"), "utf8");
const registrySource = readFileSync(join(root, "apps/web/src/tools/registry.tsx"), "utf8");

const inventoryIds = [...inventorySource.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
const inventorySlugs = [...inventorySource.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
const loadersBlock =
  registrySource.match(
    /TOOL_RENDERER_LOADERS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\s*satisfies/,
  )?.[1] || registrySource;
const registrySlugs = [...loadersBlock.matchAll(/^\s*(?:["']([a-z0-9-]+)["']|([a-z0-9-]+))\s*:/gm)]
  .map((m) => m[1] || m[2])
  .filter((slug) => slug !== "default");

const issues = [];
if (inventoryIds.length !== 64) {
  issues.push(`Inventory has ${inventoryIds.length} ids (expected 64).`);
}
if (new Set(inventoryIds).size !== inventoryIds.length) {
  issues.push("Duplicate inventory ids.");
}

// Every registry loader must map to an inventory slug.
for (const slug of registrySlugs) {
  if (!inventorySlugs.includes(slug) && !inventoryIds.includes(slug)) {
    issues.push(`Registry slug "${slug}" is not in inventory.`);
  }
}

const report = {
  generatedAt: "1970-01-01T00:00:00.000Z",
  inventoryCount: inventoryIds.length,
  registryCount: registrySlugs.length,
  inventoryIds,
  registrySlugs: [...new Set(registrySlugs)].sort(),
  issues,
  ready: issues.length === 0,
};

const outDir = join(root, "docs/generated");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "tool-conformance-report.json");
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (!report.ready) {
  console.error("Conformance failed:");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(
  `Conformance OK: inventory=${report.inventoryCount} registry=${report.registryCount} → ${outPath}`,
);
