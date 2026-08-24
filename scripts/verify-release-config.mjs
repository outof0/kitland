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
  /permissions:\s*[\s\S]*?id-token:\s*write/,
  "The release workflow must grant id-token write for npm provenance",
);
requireMatch(
  release,
  /NODE_AUTH_TOKEN:\s*\$\{\{\s*secrets\.NPM_TOKEN\s*\}\}/,
  "The npm runtime token must be sourced from the NPM_TOKEN GitHub secret",
);
const referencedRepositorySecrets = [
  "NPM_TOKEN",
  "VSCE_PAT",
  "OVSX_PAT",
  "CHROME_EXTENSION_ID",
  "CHROME_CLIENT_ID",
  "CHROME_CLIENT_SECRET",
  "CHROME_REFRESH_TOKEN",
  "WEB_EXT_API_KEY",
  "WEB_EXT_API_SECRET",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
];
for (const secret of referencedRepositorySecrets) {
  requireMatch(
    release,
    new RegExp(`secrets\\.${secret}\\b`),
    `The release workflow must read the ${secret} GitHub repository secret`,
  );
}
if (/Secret Manager|GCP_WIF_PROVIDER|gcloud secrets/.test(release)) {
  failures.push("The release workflow must not depend on GCP Secret Manager.");
}
requireMatch(
  release,
  /NPM_TOKEN:NODE_AUTH_TOKEN[\s\S]*CHROME_EXTENSION_ID:CHROME_EXTENSION_ID[\s\S]*WEB_EXT_API_KEY:WEB_EXT_API_KEY[\s\S]*CLOUDFLARE_API_TOKEN:CLOUDFLARE_API_TOKEN/,
  "The release preflight must require credentials for every required distribution",
);
if (/VSCE_PAT:VSCE_PAT|OVSX_PAT:OVSX_PAT/.test(release)) {
  failures.push("VSCE_PAT and OVSX_PAT must not block the coordinated release.");
}
requireMatch(
  release,
  /if:\s*env\.VSCE_PAT != ''[\s\S]*if:\s*env\.OVSX_PAT != ''/,
  "VS Code store publication must run only when its corresponding optional PAT exists",
);
requireMatch(
  release,
  /VSCE_PAT is not configured; skipping VS Code Marketplace publication[\s\S]*OVSX_PAT is not configured; skipping Open VSX publication/,
  "Missing optional VS Code store PATs must produce actionable warnings",
);
requireMatch(
  release,
  /missing GitHub repository secrets:[\s\S]*Settings > Secrets and variables > Actions > Repository secrets/,
  "The release preflight must report the canonical GitHub secret names and setup location",
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
