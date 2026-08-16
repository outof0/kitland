import { chmod, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const outdir = fileURLToPath(new URL("../dist/", import.meta.url));
const outCli = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const metafilePath = fileURLToPath(new URL("../dist/metafile.json", import.meta.url));
const coreEntry = fileURLToPath(new URL("../../../packages/core/src/index.ts", import.meta.url));
const registryEntry = fileURLToPath(
  new URL("../../../packages/tools/src/index.ts", import.meta.url),
);

await rm(outdir, { force: true, recursive: true });

const result = await build({
  absWorkingDir: packageRoot,
  alias: {
    "@kitland/core": coreEntry,
    "@kitland/tools": registryEntry,
  },
  banner: {
    js: "#!/usr/bin/env node\n",
  },
  bundle: true,
  entryPoints: ["src/cli.ts"],
  format: "esm",
  legalComments: "none",
  logLevel: "info",
  metafile: true,
  minify: true,
  outfile: "dist/cli.js",
  platform: "node",
  sourcemap: false,
  target: "node22",
  treeShaking: true,
});

if (result.metafile) {
  await writeFile(metafilePath, JSON.stringify(result.metafile, null, 2), "utf8");
}

await chmod(outCli, 0o755);
