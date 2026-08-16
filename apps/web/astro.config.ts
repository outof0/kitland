import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { workspaceAliases, workspacePackageNames } from "./workspace-aliases";

/**
 * Static-first site shell: every public route is emitted as real HTML while
 * React hydrates only interactive islands. Keep this static until a tool
 * genuinely needs server data or an edge API.
 */
export default defineConfig({
  site: "https://kitland.dev",
  output: "static",
  trailingSlash: "never",
  devToolbar: {
    enabled: false,
  },
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
        "font-src 'self' data:",
        "form-action 'self'",
        "frame-src 'none'",
        "img-src 'self' data:",
        "object-src 'none'",
        "worker-src 'self'",
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: [...workspacePackageNames],
      include: [
        "qrcode",
        "lucide-react",
        "bcryptjs",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "radix-ui",
      ],
    },
    resolve: {
      alias: workspaceAliases,
    },
    server: {
      watch: {
        ignored: [
          "**/node_modules/**",
          "**/dist/**",
          "**/.astro/**",
          "**/artifacts/**",
          "**/.hermes/**",
        ],
      },
      hmr: {
        overlay: true,
      },
    },
  },
});
