import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const coreSrc = fileURLToPath(new URL("../../packages/core/src", import.meta.url));
const registryEntry = fileURLToPath(new URL("../../packages/tools/src/index.ts", import.meta.url));
const toolUiEntry = fileURLToPath(new URL("../../packages/ui/src/index.ts", import.meta.url));
const toolUiStyles = fileURLToPath(new URL("../../packages/ui/src/styles.css", import.meta.url));
const toolUiTheme = fileURLToPath(new URL("../../packages/ui/theme.css", import.meta.url));
const toolUiWorkspace = fileURLToPath(new URL("../../packages/ui/workspace.css", import.meta.url));
const toolUiTokens = fileURLToPath(new URL("../../packages/ui/tokens.css", import.meta.url));
const toolUiSources = fileURLToPath(new URL("../../packages/ui/sources.css", import.meta.url));

const interDir = fileURLToPath(
  new URL(
    "../../node_modules/.pnpm/@fontsource-variable+inter@5.3.0/node_modules/@fontsource-variable/inter",
    import.meta.url,
  ),
);
const manropeDir = fileURLToPath(
  new URL(
    "../../node_modules/.pnpm/@fontsource-variable+manrope@5.3.0/node_modules/@fontsource-variable/manrope",
    import.meta.url,
  ),
);
const jetbrainsDir = fileURLToPath(
  new URL(
    "../../node_modules/.pnpm/@fontsource-variable+jetbrains-mono@5.3.0/node_modules/@fontsource-variable/jetbrains-mono",
    import.meta.url,
  ),
);

export default defineConfig({
  root: fileURLToPath(new URL("./src", import.meta.url)),
  base: "./",
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  plugins: [tailwindcss()],
  resolve: {
    alias: [
      // Deep imports first so workers can pull focused core modules.
      { find: /^@kitland\/core\/(.*)$/, replacement: `${coreSrc}/$1` },
      { find: "@kitland/core", replacement: `${coreSrc}/index.ts` },
      { find: "@kitland/tools", replacement: registryEntry },
      { find: "@kitland/ui/workspace.css", replacement: toolUiWorkspace },
      { find: "@kitland/ui/theme.css", replacement: toolUiTheme },
      { find: "@kitland/ui/tokens.css", replacement: toolUiTokens },
      { find: "@kitland/ui/sources.css", replacement: toolUiSources },
      { find: "@kitland/ui/styles.css", replacement: toolUiStyles },
      {
        find: "@kitland/ui/registry",
        replacement: fileURLToPath(
          new URL("../../packages/ui/src/tools/shared-registry-tools.tsx", import.meta.url),
        ),
      },
      {
        find: /^@kitland\/ui\/tools\/(.*)$/,
        replacement: fileURLToPath(new URL("../../packages/ui/src/tools/$1", import.meta.url)),
      },
      { find: "@kitland/ui", replacement: toolUiEntry },
      { find: "@fontsource-variable/inter", replacement: interDir },
      { find: "@fontsource-variable/manrope", replacement: manropeDir },
      { find: "@fontsource-variable/jetbrains-mono", replacement: jetbrainsDir },
    ],
  },
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    target: "es2022",
    modulePreload: false,
    rollupOptions: {
      input: fileURLToPath(new URL("./src/popup.html", import.meta.url)),
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks(id) {
          if (
            id.includes("react-dom") ||
            id.includes("node_modules/react/") ||
            id.includes("node_modules/scheduler")
          ) {
            return "react-vendor";
          }
        },
      },
    },
  },
  cacheDir: `${appRoot}/node_modules/.vite`,
});
