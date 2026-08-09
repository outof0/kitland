import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const outdir = fileURLToPath(new URL("../dist/", import.meta.url));
const coreEntry = fileURLToPath(new URL("../../../packages/core/src/index.ts", import.meta.url));

const shared = {
  absWorkingDir: appRoot,
  bundle: true,
  legalComments: "none",
  logLevel: "info",
  minify: false,
  sourcemap: false,
  treeShaking: true,
};

await rm(outdir, { force: true, recursive: true });

await Promise.all([
  build({
    ...shared,
    alias: { "@kitland/core": coreEntry },
    entryPoints: ["src/extension.ts"],
    external: ["vscode"],
    format: "cjs",
    outfile: "dist/desktop/extension.cjs",
    platform: "node",
    target: "node20",
  }),
  build({
    ...shared,
    alias: { "@kitland/core": coreEntry },
    entryPoints: ["src/extension.ts"],
    external: ["vscode"],
    format: "cjs",
    outfile: "dist/web/extension.js",
    platform: "browser",
    target: "es2022",
  }),
  build({
    ...shared,
    alias: { "@kitland/core": coreEntry },
    entryPoints: ["src/webview/main.ts"],
    format: "iife",
    outfile: "dist/webview/main.js",
    platform: "browser",
    target: "es2022",
  }),
  build({
    ...shared,
    alias: { "@kitland/core": coreEntry },
    entryPoints: ["src/test/extension.test.ts"],
    external: ["vscode"],
    format: "cjs",
    outfile: "dist/test/extension.test.cjs",
    platform: "node",
    target: "node20",
  }),
]);
