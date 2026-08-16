import {
  TOOL_CAPABILITY_IDS,
  TOOL_PLATFORM_IDS,
  type ToolCapabilityId,
  type ToolDefinition,
  type ToolPlatformContract,
  type ToolPlatformId,
} from "./types";

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CAPABILITY_IDS = new Set<ToolCapabilityId>(TOOL_CAPABILITY_IDS);
const FAMILY_IDS = new Set([
  "json-markup",
  "encoding-text",
  "generators",
  "hash-crypto",
  "text-regex",
  "time-network",
]);
const UI_PATTERNS = new Set(["transform", "generate", "diff", "inspect"]);

/**
 * Validate and deeply freeze a registry entry at its declaration boundary.
 *
 * `satisfies ToolDefinition` gives authors compile-time feedback; these runtime
 * checks also protect JavaScript consumers and keep lookup maps coherent.
 */
export function defineTool<const T extends ToolDefinition>(
  definition: T,
): T & { readonly releasePlatforms: readonly ToolPlatformId[] } {
  assertKebabCase("id", definition.id);
  assertKebabCase("slug", definition.slug);
  assertNonEmpty("name", definition.name);
  assertNonEmpty("shortName", definition.shortName);
  assertNonEmpty("description", definition.description);
  assertUniqueStrings("keywords", definition.keywords);
  if (!FAMILY_IDS.has(definition.family)) {
    throw new Error(`Tool "${definition.slug}" has an invalid family.`);
  }
  if (!UI_PATTERNS.has(definition.pattern)) {
    throw new Error(`Tool "${definition.slug}" has an invalid UI pattern.`);
  }
  if (definition.status !== "available" && definition.status !== "coming-soon") {
    throw new Error(`Tool "${definition.slug}" has an invalid web status.`);
  }
  if (
    definition.releaseStage !== "reference" &&
    definition.releaseStage !== "planned" &&
    definition.releaseStage !== "implemented" &&
    definition.releaseStage !== "release-ready"
  ) {
    throw new Error(`Tool "${definition.slug}" has an invalid release stage.`);
  }
  if (definition.releaseStage === "planned" && definition.status === "available") {
    throw new Error(`Planned tool "${definition.slug}" cannot be available in web navigation.`);
  }

  if (typeof definition.platforms !== "object" || definition.platforms === null) {
    throw new Error(`Tool "${definition.slug}" must declare platform contracts.`);
  }

  for (const platform of TOOL_PLATFORM_IDS) {
    const contract = definition.platforms[platform];
    assertPlatformContract(platform, contract);
  }

  const webAvailable = definition.platforms.web.status === "available";
  if ((definition.status === "available") !== webAvailable) {
    throw new Error(`Tool "${definition.slug}" status must match its web platform availability.`);
  }

  const releasePlatforms = definition.releasePlatforms ?? [];
  assertReleasePlatforms(definition, releasePlatforms);

  // Normalize the omitted pre-certification state to an immutable empty list.
  // This lets rollout tooling reason about every registry item uniformly without
  // forcing authors to repeat `releasePlatforms: []` on unfinished tools.
  const normalized = {
    ...definition,
    releasePlatforms: Object.freeze([...releasePlatforms]),
  } as T & { readonly releasePlatforms: readonly ToolPlatformId[] };

  for (const platform of TOOL_PLATFORM_IDS) {
    const contract = normalized.platforms[platform];
    Object.freeze(contract.capabilities);
    Object.freeze(contract);
  }
  Object.freeze(normalized.platforms);
  Object.freeze(normalized.keywords);
  return Object.freeze(normalized);
}

function assertReleasePlatforms(
  definition: ToolDefinition,
  releasePlatforms: readonly ToolPlatformId[],
): void {
  assertUniqueStrings("release platforms", releasePlatforms);

  for (const platform of releasePlatforms) {
    if (!TOOL_PLATFORM_IDS.includes(platform)) {
      throw new Error(`Tool "${definition.slug}" has an invalid release platform "${platform}".`);
    }
    if (definition.platforms[platform].status !== "available") {
      throw new Error(
        `Tool "${definition.slug}" cannot certify ${platform} while its platform contract is not available.`,
      );
    }
  }

  if (definition.releaseStage === "release-ready" && releasePlatforms.length === 0) {
    throw new Error(`Release-ready tool "${definition.slug}" must certify at least one platform.`);
  }
  if (definition.releaseStage !== "release-ready" && releasePlatforms.length > 0) {
    throw new Error(
      `Tool "${definition.slug}" cannot certify release platforms before it is release-ready.`,
    );
  }
}

function assertKebabCase(field: "id" | "slug", value: unknown): asserts value is string {
  if (typeof value !== "string" || !KEBAB_CASE.test(value)) {
    throw new Error(`Tool ${field} must be a non-empty kebab-case identifier.`);
  }
}

function assertNonEmpty(
  field: "name" | "shortName" | "description",
  value: unknown,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Tool ${field} must not be empty.`);
  }
}

function assertUniqueStrings(field: string, values: unknown): asserts values is readonly string[] {
  if (!Array.isArray(values)) {
    throw new Error(`Tool ${field} must be an array.`);
  }
  if (values.some((value) => typeof value !== "string" || value.trim().length === 0)) {
    throw new Error(`Tool ${field} must not contain empty values.`);
  }
  if (new Set(values).size !== values.length) {
    throw new Error(`Tool ${field} must not contain duplicates.`);
  }
}

function assertPlatformContract(
  platform: string,
  contract: ToolPlatformContract | undefined,
): asserts contract is ToolPlatformContract {
  if (!contract || typeof contract !== "object") {
    throw new Error(`Tool platform "${platform}" needs an explicit contract.`);
  }
  if (
    contract.status !== "available" &&
    contract.status !== "planned" &&
    contract.status !== "unsupported"
  ) {
    throw new Error(`Tool platform "${platform}" has an invalid status.`);
  }
  assertUniqueStrings(`${platform} capabilities`, contract.capabilities);

  for (const capability of contract.capabilities) {
    if (!CAPABILITY_IDS.has(capability)) {
      throw new Error(`Unknown capability "${capability}" for platform "${platform}".`);
    }
  }

  if (contract.status === "unsupported" && contract.capabilities.length > 0) {
    throw new Error(`Unsupported platform "${platform}" must not declare capabilities.`);
  }
  if (contract.status !== "unsupported" && contract.capabilities.length === 0) {
    throw new Error(`Platform "${platform}" must declare at least one capability.`);
  }
}
