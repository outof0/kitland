import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Static-first site shell: every public route is emitted as real HTML while
 * React hydrates only interactive islands. Keep this static until a tool
 * genuinely needs server data or an edge API.
 */
export default defineConfig({
  site: "https://kitland.dev",
  output: "static",
  trailingSlash: "never",
  build: {
    format: "file",
  },
  integrations: [react(), sitemap()],
  // No Markdown pages currently use syntax highlighting. Pick Prism now so a
  // future docs page cannot silently introduce Shiki inline styles under CSP.
  markdown: {
    syntaxHighlight: "prism",
  },
  security: {
    // Astro calculates hashes for its generated inline island/style bootstrap.
    // Keep policy sources narrow; application code avoids inline style attrs.
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "connect-src 'self'",
        "font-src 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "frame-src 'none'",
        "img-src 'self' data:",
        "object-src 'none'",
        "worker-src 'self'",
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
    },
  },
  server: {
    port: 5173,
  },
});
