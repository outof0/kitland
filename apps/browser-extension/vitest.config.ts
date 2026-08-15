import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const coreSrc = fileURLToPath(new URL("../../packages/core/src", import.meta.url));
const catalogEntry = fileURLToPath(new URL("../../packages/tools/src/index.ts", import.meta.url));
const toolUiEntry = fileURLToPath(new URL("../../packages/ui/src/index.ts", import.meta.url));
const toolUiStyles = fileURLToPath(new URL("../../packages/ui/src/styles.css", import.meta.url));
const toolUiTheme = fileURLToPath(new URL("../../packages/ui/theme.css", import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  resolve: {
    alias: [
      { find: /^@kitland\/core\/(.*)$/, replacement: `${coreSrc}/$1` },
      { find: "@kitland/core", replacement: `${coreSrc}/index.ts` },
      { find: "@kitland/tools", replacement: catalogEntry },
      { find: "@kitland/ui/theme.css", replacement: toolUiTheme },
      { find: "@kitland/ui/styles.css", replacement: toolUiStyles },
      {
        find: "@kitland/ui/catalog",
        replacement: fileURLToPath(
          new URL("../../packages/ui/src/tools/shared-catalog-tools.tsx", import.meta.url),
        ),
      },
      {
        find: /^@kitland\/ui\/tools\/(.*)$/,
        replacement: fileURLToPath(new URL("../../packages/ui/src/tools/$1", import.meta.url)),
      },
      { find: "@kitland/ui", replacement: toolUiEntry },
    ],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
