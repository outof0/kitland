import { access, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const requiredFiles = [
  "dist/desktop/extension.cjs",
  "dist/web/extension.js",
  "dist/webview/main.js",
  "dist/webview/main.css",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
];

for (const relativePath of requiredFiles) {
  await access(new URL(`../${relativePath}`, import.meta.url));
}

const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const expectedCommands = new Set([
  "kitland.base64.encodeSelection",
  "kitland.base64.decodeSelection",
  "kitland.openTool",
]);
const actualCommands = new Set(manifest.contributes?.commands?.map((entry) => entry.command) ?? []);

for (const command of expectedCommands) {
  if (!actualCommands.has(command)) {
    throw new Error(`Missing contributed command: ${command}`);
  }
}

if (manifest.main !== "./dist/desktop/extension.cjs") {
  throw new Error("Desktop entry point does not match the packaged bundle.");
}
if (manifest.browser !== "./dist/web/extension.js") {
  throw new Error("Web entry point does not match the packaged bundle.");
}
if (manifest.capabilities?.untrustedWorkspaces?.supported !== true) {
  throw new Error("Untrusted-workspace support must be declared explicitly.");
}
if (manifest.capabilities?.virtualWorkspaces?.supported !== true) {
  throw new Error("Virtual-workspace support must be declared explicitly.");
}

const productionBundles = await Promise.all(
  [
    "dist/desktop/extension.cjs",
    "dist/web/extension.js",
    "dist/webview/main.js",
    "dist/webview/main.css",
  ].map(async (relativePath) => ({
    relativePath,
    source: await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"),
  })),
);

const bundleBudgets = new Map([
  ["dist/desktop/extension.cjs", 32 * 1024],
  ["dist/web/extension.js", 32 * 1024],
  ["dist/webview/main.js", 16 * 1024],
  ["dist/webview/main.css", 8 * 1024],
]);
for (const { relativePath, source } of productionBundles) {
  const gzipBytes = gzipSync(source, { level: 9 }).byteLength;
  const budget = bundleBudgets.get(relativePath);
  if (budget === undefined) throw new Error(`Missing package budget for ${relativePath}.`);
  console.log(`${relativePath}: ${formatKiB(gzipBytes)} gzip / ${formatKiB(budget)} budget`);
  if (gzipBytes > budget) {
    throw new Error(`${relativePath} exceeds its ${formatKiB(budget)} gzip budget.`);
  }
}

for (const entryPoint of productionBundles.filter(({ relativePath }) =>
  relativePath.includes("/extension."),
)) {
  if (!/require\(["']vscode["']\)/u.test(entryPoint.source)) {
    throw new Error(`${entryPoint.relativePath} does not keep the VS Code API external.`);
  }
}

const webBundle = productionBundles.find(
  ({ relativePath }) => relativePath === "dist/web/extension.js",
);
if (!webBundle) throw new Error("Web-extension bundle was not inspected.");
for (const nodePrimitive of [/require\(["']node:/u, /\bBuffer\b/u, /\bprocess\./u]) {
  if (nodePrimitive.test(webBundle.source)) {
    throw new Error("Web-extension bundle contains a Node.js-only primitive.");
  }
}

const forbiddenNetworkPrimitives = [
  [/(^|[^\w])fetch\s*\(/u, "fetch"],
  [/\bXMLHttpRequest\b/u, "XMLHttpRequest"],
  [/\bWebSocket\b/u, "WebSocket"],
  [/\bEventSource\b/u, "EventSource"],
  [/\bsendBeacon\b/u, "sendBeacon"],
];

for (const { relativePath, source } of productionBundles) {
  for (const [pattern, label] of forbiddenNetworkPrimitives) {
    if (pattern.test(source)) {
      throw new Error(`${relativePath} contains forbidden network primitive: ${label}`);
    }
  }
}

const ignoreFile = await readFile(new URL("../.vscodeignore", import.meta.url), "utf8");
for (const requiredPattern of [
  "src/**",
  "test/**",
  "dist/test/**",
  "node_modules/**",
  ".vscode-test/**",
]) {
  if (!ignoreFile.split(/\r?\n/u).includes(requiredPattern)) {
    throw new Error(`.vscodeignore is missing: ${requiredPattern}`);
  }
}

console.log(`Package smoke passed for ${manifest.publisher}.${manifest.name}.`);

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
