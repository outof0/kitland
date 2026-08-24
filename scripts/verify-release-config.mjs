import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function requireMatch(source, pattern, message) {
  if (!pattern.test(source)) failures.push(message);
}

function requireExact(value, expected, message) {
  if (value !== expected)
    failures.push(
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}.`,
    );
}

const manifests = [
  "package.json",
  "packages/mcp/package.json",
  "apps/browser-extension/package.json",
  "apps/vscode-extension/package.json",
].map((path) => ({ path, json: readJson(path) }));
const rootVersion = manifests[0].json.version;

for (const manifest of manifests) {
  requireExact(
    manifest.json.version,
    rootVersion,
    `${manifest.path} must share the release version`,
  );
}
requireExact(
  manifests.find(({ path }) => path === "apps/vscode-extension/package.json").json.publisher,
  "kitland",
  "The VS Code Marketplace publisher must be Kitland",
);

const release = read(".github/workflows/release.yml");
requireMatch(
  release,
  /NODE_AUTH_TOKEN=\$\(sm npm-token\)/,
  "The npm token must be read from the GCP Secret Manager secret named npm-token",
);
requireMatch(
  release,
  /NODE_AUTH_TOKEN[\s\S]*VSCE_PAT[\s\S]*OVSX_PAT[\s\S]*CHROME_EXTENSION_ID[\s\S]*WEB_EXT_API_KEY[\s\S]*CLOUDFLARE_API_TOKEN/,
  "The release preflight must require credentials for every public distribution",
);
requireMatch(
  release,
  /wrangler pages deploy apps\/web\/dist --project-name=kitland --branch=main/,
  "The release workflow must deploy the verified web build to the Pages production branch",
);
requireMatch(
  release,
  /gh release create "\$RELEASE_TAG"/,
  "The release workflow must create a GitHub Release only after publishing",
);
if (/skip_(npm|vscode|browser)/.test(release)) {
  failures.push("The release workflow must not offer a partial-release skip switch.");
}

for (const filename of readdirSync(join(root, ".github/workflows"))) {
  if (!filename.endsWith(".yml") && !filename.endsWith(".yaml")) continue;
  const workflowPath = `.github/workflows/${filename}`;
  const workflow = read(workflowPath);
  for (const match of workflow.matchAll(/^\s*uses:\s*([^\s#]+).*$/gm)) {
    const action = match[1];
    if (action.startsWith("./")) continue;
    if (!/^[\w.-]+(?:\/[\w.-]+)+@[a-f0-9]{40}$/.test(action)) {
      failures.push(`${workflowPath} has an unpinned action reference: ${action}.`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`release configuration error: ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`release configuration is internally consistent for v${rootVersion}.`);
}
