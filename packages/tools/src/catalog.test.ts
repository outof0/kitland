import { describe, expect, it } from "vitest";
import {
  getToolBySlug,
  getCatalogReleaseReadiness,
  getToolPlatformContract,
  isAvailableToolSlug,
  isToolSlug,
  listAvailableTools,
  listTools,
  listToolsByFamily,
  listToolsByPlatform,
  supportsToolPlatform,
} from "./catalog";
import { defineTool } from "./define-tool";
import { CATALOG_RELEASE_POLICY, evaluateCatalogReleaseReadiness } from "./release";
import { base64Tool } from "./tools/encoding";
import type { ToolDefinition } from "./types";
import { CANONICAL_TOOL_INVENTORY, type CanonicalToolInventoryEntry } from "./inventory";

describe("tool catalog", () => {
  it("includes Base64 as a release-ready available tool", () => {
    const tools = listTools();
    expect(tools.length).toBeGreaterThanOrEqual(1);
    const base64 = getToolBySlug("base64");
    expect(base64).toBeDefined();
    expect(base64?.status).toBe("available");
    expect(base64?.pattern).toBe("transform");
    expect(base64?.family).toBe("encoding-text");
    expect(base64?.releaseStage).toBe("release-ready");
  });

  it("lists available tools and family filter", () => {
    const availableSlugs = listAvailableTools().map((tool) => tool.slug);
    expect(availableSlugs).toEqual([
      "beautify-minify",
      "json-diff",
      "json-formatter",
      "json-to-yaml",
      "yaml-to-json",
      "json-to-csv",
      "json-to-toml",
      "xml-formatter",
      "sql-formatter",
      "markdown-preview",
      "base64",
      "url-encode",
      "html-entities",
      "hex-text",
      "unicode-converter",
      "binary-text",
      "rot13-caesar",
      "morse-code",
      "sha-hash",
      "hmac-generator",
      "aes-cipher",
      "bcrypt-hash",
      "jwt-decoder",
      "token-generator",
      "rsa-key-pair",
      "uuid-id",
      "url-parser",
      "http-status-codes",
      "mime-types",
      "user-agent-parser",
      "basic-auth-header",
      "curl-converter",
      "cron-parser",
      "ip-subnet-calculator",
      "text-stats",
      "text-diff",
      "case-converter",
      "sort-lines",
      "dedupe-lines",
      "lorem-ipsum",
      "text-reverser",
      "regex-tester",
      "password-generator",
      "nanoid-generator",
      "ulid-generator",
      "objectid-generator",
      "mock-data",
      "random-port",
      "random-number",
      "qr-code",
      "unix-timestamp",
      "date-calculator",
      "timezone-converter",
      "duration-formatter",
      "number-base",
      "color-converter",
      "temperature",
      "data-size",
      "age-calculator",
      "json-to-typescript",
      "json-to-js-const",
      "html-to-jsx",
      "json-escape",
      "split-to-newlines",
    ]);
    expect(listToolsByFamily("encoding-text").some((t) => t.slug === "base64")).toBe(true);
  });

  it("uses unique ids and slugs", () => {
    const tools = listTools();
    const ids = tools.map((t) => t.id);
    const slugs = tools.map((t) => t.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("publishes explicit platform contracts without inferring future hosts", () => {
    expect(listToolsByPlatform("web").map((tool) => tool.slug)).toContain("base64");
    expect(listToolsByPlatform("browser-extension").map((tool) => tool.slug)).toContain("base64");
    expect(supportsToolPlatform("base64", "web")).toBe(true);
    expect(supportsToolPlatform("base64", "browser-extension")).toBe(true);
    expect(supportsToolPlatform("base64", "vscode-extension")).toBe(true);
    expect(getToolPlatformContract("base64", "browser-extension")?.capabilities).toEqual([
      "transform-text",
      "clipboard-write",
      "file-import",
      "file-export",
    ]);
    expect(getToolPlatformContract("base64", "vscode-extension")?.capabilities).toContain(
      "active-editor",
    );

    const curl = getToolBySlug("curl-converter");
    expect(curl?.releaseStage).toBe("release-ready");
    expect(curl?.platforms).toEqual({
      web: {
        status: "available",
        capabilities: ["transform-text", "clipboard-write"],
      },
      "browser-extension": {
        status: "available",
        capabilities: ["transform-text", "clipboard-write"],
      },
      "vscode-extension": {
        status: "available",
        capabilities: ["transform-text", "clipboard-write", "active-editor"],
      },
    });

    const jsonFormatter = getToolBySlug("json-formatter");
    expect(jsonFormatter?.releaseStage).toBe("release-ready");
    expect(jsonFormatter?.designFrame).toContain("FdGX5");
    expect(jsonFormatter?.designFrame).not.toContain("NChG5");
    expect(jsonFormatter?.platforms).toEqual({
      web: {
        status: "available",
        capabilities: ["transform-text", "inspect-text", "clipboard-write", "share-link"],
      },
      "browser-extension": {
        status: "available",
        capabilities: ["transform-text", "inspect-text", "clipboard-write"],
      },
      "vscode-extension": {
        status: "available",
        capabilities: ["transform-text", "inspect-text", "clipboard-write", "active-editor"],
      },
    });

    const jsonDiff = getToolBySlug("json-diff");
    expect(jsonDiff?.designFrame).toContain("lMoqW");
    expect(jsonDiff?.designFrame).toContain("pYYdG");

    for (const slug of ["lorem-ipsum", "random-port", "random-number"]) {
      const generator = getToolBySlug(slug);
      expect(generator?.releaseStage).toBe("release-ready");
      expect(generator?.releasePlatforms).toEqual(["web", "browser-extension", "vscode-extension"]);
      expect(generator?.platforms.web.capabilities).toEqual([
        "generate-value",
        "clipboard-write",
        "file-export",
      ]);
      expect(generator?.platforms["browser-extension"].status).toBe("available");
      expect(generator?.platforms["vscode-extension"].status).toBe("available");
    }

    for (const slug of [
      "beautify-minify",
      "json-to-yaml",
      "yaml-to-json",
      "json-to-csv",
      "json-to-toml",
      "xml-formatter",
      "sql-formatter",
      "case-converter",
      "sort-lines",
      "dedupe-lines",
      "text-reverser",
    ]) {
      const transform = getToolBySlug(slug);
      expect(transform?.releaseStage).toBe("release-ready");
      expect(transform?.releasePlatforms).toEqual(["web", "browser-extension", "vscode-extension"]);
      expect(transform?.platforms.web.status).toBe("available");
      expect(transform?.platforms["browser-extension"].status).toBe("available");
      expect(transform?.platforms["vscode-extension"].status).toBe("available");
    }
  });

  it("provides runtime slug guards for exhaustive host registries", () => {
    expect(isToolSlug("base64")).toBe(true);
    expect(isAvailableToolSlug("base64")).toBe(true);
    expect(isToolSlug("not-a-tool")).toBe(false);
    expect(isAvailableToolSlug("not-a-tool")).toBe(false);
  });

  it("deeply freezes definitions so lookup maps cannot become stale", () => {
    const catalogBase64 = getToolBySlug("base64");
    expect(catalogBase64).toBeDefined();
    expect(Object.isFrozen(catalogBase64)).toBe(true);
    expect(Object.isFrozen(catalogBase64!.keywords)).toBe(true);
    expect(Object.isFrozen(catalogBase64!.platforms)).toBe(true);
    expect(Object.isFrozen(catalogBase64!.platforms.web)).toBe(true);
    expect(Object.isFrozen(catalogBase64!.platforms.web.capabilities)).toBe(true);
    expect(Reflect.set(catalogBase64 as object, "slug", "mutated")).toBe(false);
    expect(getToolBySlug("base64")).toBe(catalogBase64);
  });

  it("rejects invalid declarations before they enter the catalog", () => {
    expect(() => defineTool({ ...base64Tool, id: "Not Valid" })).toThrow(/kebab-case/);
    expect(() =>
      defineTool({
        ...base64Tool,
        platforms: {
          ...base64Tool.platforms,
          web: { ...base64Tool.platforms.web, status: "planned" },
        },
      }),
    ).toThrow(/must match its web platform availability/);
    expect(() =>
      defineTool({
        ...base64Tool,
        platforms: {
          ...base64Tool.platforms,
          web: {
            ...base64Tool.platforms.web,
            capabilities: ["transform-text", "transform-text"],
          },
        },
      }),
    ).toThrow(/must not contain duplicates/);
  });

  it("passes the complete-suite release gate on the assembled catalog", () => {
    const readiness = getCatalogReleaseReadiness();
    expect(readiness.ready).toBe(true);
    expect(readiness.targetToolCount).toBe(64);
    expect(readiness.currentToolCount).toBe(64);
    expect(readiness.canonicalInventoryCount).toBe(64);
    expect(readiness.releaseReadyToolCount).toBe(64);
    // Every host contract is resolved and every tool declares its release platforms.
    expect(readiness.issues).toEqual([]);
  });

  it("matches every Pencil tool artboard with one declared delivery stage", () => {
    const tools = listTools();
    expect(tools).toHaveLength(64);
    expect(CANONICAL_TOOL_INVENTORY).toHaveLength(64);
    expect(tools.map(({ id, slug }) => ({ id, slug }))).toEqual(CANONICAL_TOOL_INVENTORY);
    expect(tools.every((tool) => tool.designFrame)).toBe(true);
    expect(tools.filter((tool) => tool.releaseStage === "planned")).toHaveLength(0);
    expect(tools.filter((tool) => tool.releaseStage === "implemented")).toHaveLength(0);
    expect(tools.filter((tool) => tool.releaseStage === "release-ready")).toHaveLength(64);
  });

  it("passes only when the complete catalog is release-ready with resolved platforms", () => {
    const tools: ToolDefinition[] = Array.from(
      { length: CATALOG_RELEASE_POLICY.targetToolCount },
      (_, index) => ({
        ...base64Tool,
        id: `release-tool-${index + 1}`,
        slug: `release-tool-${index + 1}`,
        releaseStage: "release-ready",
        platforms: {
          web: base64Tool.platforms.web,
          "browser-extension": { status: "unsupported", capabilities: [] },
          "vscode-extension": { status: "unsupported", capabilities: [] },
        },
      }),
    );
    const inventory: CanonicalToolInventoryEntry[] = tools.map(({ id, slug }) => ({ id, slug }));

    expect(evaluateCatalogReleaseReadiness(tools, null)).toMatchObject({
      ready: false,
      currentToolCount: 64,
      canonicalInventoryCount: null,
    });
    expect(
      evaluateCatalogReleaseReadiness(tools, null).issues.map((issue) => issue.code),
    ).toContain("CANONICAL_INVENTORY_MISSING");

    expect(evaluateCatalogReleaseReadiness(tools, inventory)).toMatchObject({
      ready: true,
      currentToolCount: 64,
      canonicalInventoryCount: 64,
      releaseReadyToolCount: 64,
      issues: [],
    });
  });

  it("rejects catalogs above the exact 64-tool product boundary", () => {
    const tools: ToolDefinition[] = Array.from(
      { length: CATALOG_RELEASE_POLICY.targetToolCount + 1 },
      (_, index) => ({
        ...base64Tool,
        id: `extra-tool-${index + 1}`,
        slug: `extra-tool-${index + 1}`,
        releaseStage: "release-ready",
        platforms: {
          web: base64Tool.platforms.web,
          "browser-extension": { status: "unsupported", capabilities: [] },
          "vscode-extension": { status: "unsupported", capabilities: [] },
        },
      }),
    );
    const inventory: CanonicalToolInventoryEntry[] = tools.map(({ id, slug }) => ({ id, slug }));

    expect(evaluateCatalogReleaseReadiness(tools, inventory)).toMatchObject({
      ready: false,
      currentToolCount: 65,
      canonicalInventoryCount: 65,
    });
    expect(
      evaluateCatalogReleaseReadiness(tools, inventory).issues.map((issue) => issue.code),
    ).toEqual(
      expect.arrayContaining(["TOOL_COUNT_MISMATCH", "CANONICAL_INVENTORY_COUNT_MISMATCH"]),
    );
  });

  it("rejects a full catalog that does not match its canonical identities", () => {
    const tools: ToolDefinition[] = Array.from(
      { length: CATALOG_RELEASE_POLICY.targetToolCount },
      (_, index) => ({
        ...base64Tool,
        id: `identity-tool-${index + 1}`,
        slug: `identity-tool-${index + 1}`,
        releaseStage: "release-ready",
        platforms: {
          web: base64Tool.platforms.web,
          "browser-extension": { status: "unsupported", capabilities: [] },
          "vscode-extension": { status: "unsupported", capabilities: [] },
        },
      }),
    );
    const inventory: CanonicalToolInventoryEntry[] = tools.map(({ id, slug }) => ({ id, slug }));
    inventory[0] = { id: tools[0]!.id, slug: "agreed-slug" };

    const readiness = evaluateCatalogReleaseReadiness(tools, inventory);
    expect(readiness.ready).toBe(false);
    expect(readiness.issues.map((issue) => issue.code)).toContain("CATALOG_INVENTORY_MISMATCH");
  });
});
