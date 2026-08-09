import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
import type { CanonicalToolInventoryEntry } from "./inventory";
import { CATALOG_RELEASE_POLICY, evaluateCatalogReleaseReadiness } from "./release";
import { base64Tool } from "./tools/base64";
import type { ToolDefinition } from "./types";
import { CANONICAL_TOOL_INVENTORY } from "./inventory";

describe("tool catalog", () => {
  it("includes base64 as the sample available tool", () => {
    const tools = listTools();
    expect(tools.length).toBeGreaterThanOrEqual(1);
    const base64 = getToolBySlug("base64");
    expect(base64).toBeDefined();
    expect(base64?.status).toBe("available");
    expect(base64?.pattern).toBe("transform");
    expect(base64?.family).toBe("encoding-text");
    expect(base64?.releaseStage).toBe("reference");
  });

  it("lists available tools and family filter", () => {
    const availableSlugs = listAvailableTools().map((tool) => tool.slug);
    expect(availableSlugs).toEqual([
      "beautify-minify",
      "json-diff",
      "json-toolbox",
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
      "uuid-id",
      "text-stats",
      "text-diff",
      "case-converter",
      "sort-lines",
      "dedupe-lines",
      "lorem-ipsum",
      "text-reverser",
      "regex-tester",
      "random-port",
      "random-number",
      "json-escape",
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
    expect(getToolPlatformContract("base64", "vscode-extension")?.capabilities).toContain(
      "active-editor",
    );
  });

  it("provides runtime slug guards for exhaustive host registries", () => {
    expect(isToolSlug("base64")).toBe(true);
    expect(isAvailableToolSlug("base64")).toBe(true);
    expect(isToolSlug("not-a-tool")).toBe(false);
    expect(isAvailableToolSlug("not-a-tool")).toBe(false);
  });

  it("deeply freezes definitions so lookup maps cannot become stale", () => {
    expect(Object.isFrozen(base64Tool)).toBe(true);
    expect(Object.isFrozen(base64Tool.keywords)).toBe(true);
    expect(Object.isFrozen(base64Tool.platforms)).toBe(true);
    expect(Object.isFrozen(base64Tool.platforms.web)).toBe(true);
    expect(Object.isFrozen(base64Tool.platforms.web.capabilities)).toBe(true);
    expect(Reflect.set(base64Tool, "slug", "mutated")).toBe(false);
    expect(getToolBySlug("base64")).toBe(base64Tool);
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

  it("keeps the reference slice explicitly outside the complete-suite release", () => {
    const readiness = getCatalogReleaseReadiness();
    expect(readiness.ready).toBe(false);
    expect(readiness.targetToolCount).toBe(64);
    expect(readiness.currentToolCount).toBe(64);
    expect(readiness.canonicalInventoryCount).toBe(64);
    expect(readiness.releaseReadyToolCount).toBe(0);
    expect(readiness.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["TOOL_NOT_RELEASE_READY", "PLATFORM_CONTRACT_UNRESOLVED"]),
    );
  });

  it("matches every Pencil tool artboard with one planned or implemented definition", () => {
    const tools = listTools();
    expect(tools).toHaveLength(64);
    expect(CANONICAL_TOOL_INVENTORY).toHaveLength(64);
    expect(tools.map(({ id, slug }) => ({ id, slug }))).toEqual(CANONICAL_TOOL_INVENTORY);
    expect(tools.every((tool) => tool.designFrame)).toBe(true);
    expect(tools.filter((tool) => tool.releaseStage === "planned")).toHaveLength(36);
    expect(tools.filter((tool) => tool.releaseStage === "implemented")).toHaveLength(27);
  });

  it("keeps the committed inventory in Pencil artboard order", () => {
    const pencil = JSON.parse(
      readFileSync(new URL("../../../design/design.pen", import.meta.url), "utf8"),
    ) as {
      children?: Array<{
        id: string;
        name: string;
        type: string;
        width: number;
        height: number;
        x: number;
        y: number;
      }>;
    };
    const artboards = (pencil.children ?? [])
      .filter(
        (node) =>
          node.type === "frame" &&
          node.width === 1440 &&
          node.height === 900 &&
          node.y >= 0 &&
          node.y < 6860,
      )
      .sort((a, b) => a.y - b.y || a.x - b.x);

    expect(artboards).toHaveLength(64);
    expect(listTools().map((tool) => tool.designFrame)).toEqual(
      artboards.map((artboard) => `${artboard.name} (${artboard.id})`),
    );
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
