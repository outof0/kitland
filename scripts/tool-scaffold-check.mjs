#!/usr/bin/env node
/**
 * KIT-0004: scaffold gate. Exit 0 only for a committed inventory id.
 * Usage: node scripts/tool-scaffold-check.mjs <tool-id>
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inventorySource = readFileSync(join(root, "packages/tools/src/inventory.ts"), "utf8");
const ids = [...inventorySource.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
const id = process.argv[2];

if (!id) {
  console.error("Usage: node scripts/tool-scaffold-check.mjs <tool-id>");
  process.exit(2);
}

if (!ids.includes(id)) {
  console.error(
    `Refusing scaffold for "${id}": not in the committed 64-tool inventory (${ids.length} ids).`,
  );
  process.exit(1);
}

console.log(`OK: "${id}" is a committed inventory tool id.`);
process.exit(0);
