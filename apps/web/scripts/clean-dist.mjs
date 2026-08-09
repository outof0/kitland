import { rm } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const webDirectory = resolve(scriptsDirectory, "..");
const distDirectory = resolve(webDirectory, "dist");

// Astro leaves files for routes removed between builds. Only ever remove this
// package's exact generated output directory; fail closed if that invariant
// changes rather than risking a broad recursive delete.
if (relative(webDirectory, distDirectory) !== "dist") {
  throw new Error(`Refusing to clean unexpected build output: ${distDirectory}`);
}

await rm(distDirectory, { recursive: true, force: true });
