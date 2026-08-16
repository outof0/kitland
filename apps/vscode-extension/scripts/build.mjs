import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const outdir = fileURLToPath(new URL("../dist/", import.meta.url));
const coreSrc = fileURLToPath(new URL("../../../packages/core/src", import.meta.url));
const registryEntry = fileURLToPath(
  new URL("../../../packages/tools/src/index.ts", import.meta.url),
);
const uiEntry = fileURLToPath(new URL("../../../packages/ui/src/index.ts", import.meta.url));

const shared = {
  absWorkingDir: appRoot,
  bundle: true,
  legalComments: "none",
  logLevel: "info",
  // Production host bundles include multi-tool pure transforms; minify keeps
  // gzip under the package smoke budgets without changing runtime behavior.
  minify: true,
  sourcemap: false,
  treeShaking: true,
};

await rm(outdir, { force: true, recursive: true });

await Promise.all([
  build({
    ...shared,
    alias: { "@kitland/core": coreSrc },
    entryPoints: ["src/extension.ts"],
    external: ["vscode"],
    format: "cjs",
    outfile: "dist/desktop/extension.cjs",
    platform: "node",
    target: "node20",
  }),
  build({
    ...shared,
    alias: { "@kitland/core": coreSrc },
    entryPoints: ["src/extension.ts"],
    external: ["vscode"],
    format: "cjs",
    outfile: "dist/web/extension.js",
    platform: "browser",
    target: "es2022",
  }),
  build({
    ...shared,
    alias: {
      "@kitland/core": coreSrc,
      "@kitland/tools": registryEntry,
      "@kitland/ui/registry": fileURLToPath(
        new URL("../../../packages/ui/src/tools/shared-registry-tools.tsx", import.meta.url),
      ),
      "@kitland/ui/tools": fileURLToPath(
        new URL("../../../packages/ui/src/tools", import.meta.url),
      ),
      "@kitland/ui": uiEntry,
    },
    entryPoints: ["src/webview/entry.tsx"],
    format: "iife",
    outfile: "dist/webview/main.js",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
  }),
  build({
    ...shared,
    alias: { "@kitland/core": coreSrc },
    entryPoints: ["src/test/extension.test.ts"],
    external: ["vscode"],
    format: "cjs",
    outfile: "dist/test/extension.test.cjs",
    platform: "node",
    target: "node20",
  }),
]);

// The webview stylesheet compiles the shared Kitland theme plus @kitland/ui
// component sources so WorkspaceShell and tool editors match web 1:1.
const webviewCssEntry = fileURLToPath(new URL("../src/webview/styles.css", import.meta.url));
const webviewCssOutfile = fileURLToPath(new URL("../dist/webview/main.css", import.meta.url));
const webviewCssSource = await readFile(webviewCssEntry, "utf8");
const webviewCss = await postcss([tailwindcss({ base: appRoot })]).process(webviewCssSource, {
  from: webviewCssEntry,
});
await mkdir(dirname(webviewCssOutfile), { recursive: true });
await writeFile(webviewCssOutfile, webviewCss.css);
