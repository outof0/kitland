import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { crawlDecision, linksCanonicalHome, parseRobots } from "./crawl-policy";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

const managedRobots = `
User-agent: *
Content-Signal: search=yes,ai-train=no
Allow: /

User-agent: GoogleOther
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: *
Allow: /

Sitemap: https://kitland.dev/sitemap-index.xml
`;

describe("crawlDecision", () => {
  const groups = parseRobots(managedRobots);

  it("allows Googlebot when only the star group allows the site", () => {
    expect(crawlDecision(groups, "Googlebot", "/")).toBe("allow");
    expect(crawlDecision(groups, "Googlebot", "/explore/json-formatter")).toBe("allow");
  });

  it("keeps a more specific disallow for GoogleOther and GPTBot", () => {
    expect(crawlDecision(groups, "GoogleOther", "/")).toBe("disallow");
    expect(crawlDecision(groups, "GPTBot", "/explore/json-formatter")).toBe("disallow");
  });

  it("disallows Googlebot when the star group disallows the site", () => {
    const blocked = parseRobots("User-agent: *\nDisallow: /\n");
    expect(crawlDecision(blocked, "Googlebot", "/")).toBe("disallow");
    expect(crawlDecision(blocked, "Googlebot", "/explore/json-formatter")).toBe("disallow");
  });

  it("lets the longer rule win, and lets allow win when the lengths match", () => {
    const mixed = parseRobots(
      "User-agent: *\nAllow: /\nDisallow: /private\nDisallow: /explore\nAllow: /explore\n",
    );
    expect(crawlDecision(mixed, "Googlebot", "/explore/json-formatter")).toBe("allow");
    expect(crawlDecision(mixed, "Googlebot", "/private")).toBe("disallow");
    expect(crawlDecision(mixed, "Googlebot", "/")).toBe("allow");
  });
});

describe("linksCanonicalHome", () => {
  it("ignores code spans and fenced blocks", () => {
    expect(linksCanonicalHome("Cloudflare Pages (`kitland.dev`)")).toBe(false);
    expect(linksCanonicalHome("See `https://kitland.dev/` in a span.")).toBe(false);
    expect(linksCanonicalHome("```\n[Kitland](https://kitland.dev/)\n```")).toBe(false);
  });

  it("accepts a markdown link or autolink to the canonical home", () => {
    expect(linksCanonicalHome("[Kitland](https://kitland.dev/)")).toBe(true);
    expect(linksCanonicalHome("See <https://kitland.dev/>.")).toBe(true);
    expect(linksCanonicalHome("[JSON Formatter](https://kitland.dev/explore/json-formatter)")).toBe(
      false,
    );
  });

  it("requires each published readme to link the canonical home", () => {
    for (const relativePath of [
      "README.md",
      "apps/vscode-extension/README.md",
      "apps/browser-extension/README.md",
      "packages/mcp/README.md",
    ]) {
      expect(linksCanonicalHome(readFileSync(join(root, relativePath), "utf8")), relativePath).toBe(
        true,
      );
    }
  });
});
