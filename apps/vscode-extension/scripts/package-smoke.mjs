import { access, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import ts from "typescript";
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
  "kitland.curlConverter.convertSelection",
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

// Budgets after mounting the shared React WorkspaceShell, @kitland/ui tools,
// and CodeMirror 6 syntax highlighters in the webview.
const bundleBudgets = new Map([
  ["dist/desktop/extension.cjs", 120 * 1024],
  ["dist/web/extension.js", 120 * 1024],
  ["dist/webview/main.js", 500 * 1024],
  ["dist/webview/main.css", 24 * 1024],
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
// Web bundle string literals contain descriptive text (e.g. HTTP status "process the request") –
// check via AST so we don't flag inert string content, only actual code references.
for (const nodePrimitive of [/require\(["']node:/u, /\bBuffer\b/u]) {
  if (nodePrimitive.test(webBundle.source)) {
    throw new Error("Web-extension bundle contains a Node.js-only primitive.");
  }
}
{
  const sourceFile = ts.createSourceFile(
    "dist/web/extension.js",
    webBundle.source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.JS,
  );
  let usesProcess = false;
  function visitProcess(node) {
    if (usesProcess) return;
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "process"
    ) {
      // Only flag Node runtime properties, not descriptive string content
      const prop = node.name.text;
      if (
        [
          "env",
          "argv",
          "platform",
          "exit",
          "cwd",
          "stdout",
          "stdin",
          "nextTick",
          "hrtime",
        ].includes(prop)
      ) {
        usesProcess = true;
        return;
      }
    }
    ts.forEachChild(node, visitProcess);
  }
  visitProcess(sourceFile);
  if (usesProcess)
    throw new Error("Web-extension bundle contains a Node.js-only primitive: process.*");
}

for (const { relativePath, source } of productionBundles) {
  const forbiddenPrimitive = findForbiddenNetworkPrimitive(source, relativePath);
  if (forbiddenPrimitive) {
    throw new Error(`${relativePath} contains forbidden network primitive: ${forbiddenPrimitive}`);
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

function findForbiddenNetworkPrimitive(source, relativePath) {
  if (!/\.(?:c?js)$/u.test(relativePath)) return undefined;
  const sourceFile = ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.JS,
  );
  let found;
  const networkConstructors = new Set(["XMLHttpRequest", "WebSocket", "EventSource"]);

  function visit(node) {
    if (found) return;
    if (ts.isCallExpression(node)) {
      const name = expressionName(node.expression);
      if (name === "fetch" || name === "sendBeacon") {
        found = name;
        return;
      }
    } else if (ts.isNewExpression(node)) {
      const name = expressionName(node.expression);
      if (name && networkConstructors.has(name)) {
        found = name;
        return;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

function expressionName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  if (
    ts.isElementAccessExpression(expression) &&
    expression.argumentExpression &&
    ts.isStringLiteral(expression.argumentExpression)
  ) {
    return expression.argumentExpression.text;
  }
  return undefined;
}

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
