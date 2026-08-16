import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const coreSrc = path.resolve(rootDir, "../../packages/core/src");
const toolsEntry = path.resolve(rootDir, "../../packages/tools/src/index.ts");
const uiRoot = path.resolve(rootDir, "../../packages/ui");
const uiSrc = path.resolve(uiRoot, "src");

export const workspaceAliases: Array<{ find: string | RegExp; replacement: string }> = [
  { find: "@", replacement: path.resolve(rootDir, "src") },
  { find: /^@kitland\/core\/(.*)$/, replacement: `${coreSrc}/$1` },
  { find: "@kitland/core", replacement: path.join(coreSrc, "index.ts") },
  { find: "@kitland/tools", replacement: toolsEntry },
  { find: "@kitland/ui/workspace.css", replacement: path.join(uiRoot, "workspace.css") },
  { find: "@kitland/ui/theme.css", replacement: path.join(uiRoot, "theme.css") },
  { find: "@kitland/ui/tokens.css", replacement: path.join(uiRoot, "tokens.css") },
  { find: "@kitland/ui/sources.css", replacement: path.join(uiRoot, "sources.css") },
  { find: "@kitland/ui/styles.css", replacement: path.join(uiSrc, "styles.css") },
  { find: "@kitland/ui/code-editor.css", replacement: path.join(uiRoot, "code-editor.css") },
  {
    find: "@kitland/ui/registry",
    replacement: path.join(uiSrc, "tools/shared-registry-tools.tsx"),
  },
  {
    find: "@kitland/ui/code-editor",
    replacement: path.join(uiSrc, "components/CodeEditor.tsx"),
  },
  {
    find: "@kitland/ui/base64-protocol",
    replacement: path.join(uiSrc, "lib/base64-worker-protocol.ts"),
  },
  { find: /^@kitland\/ui\/tools\/(.*)$/, replacement: `${path.join(uiSrc, "tools")}/$1` },
  { find: "@kitland/ui", replacement: path.join(uiSrc, "index.ts") },
];

export const workspacePackageNames = ["@kitland/core", "@kitland/tools", "@kitland/ui"] as const;
