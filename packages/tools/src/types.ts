/**
 * Shared registry types. Platform apps (web / VS Code / Chrome) consume these
 * without importing React or host APIs.
 */

export type ToolFamilyId =
  | "json-markup"
  | "encoding-text"
  | "generators"
  | "hash-crypto"
  | "text-regex"
  | "time-network";

/**
 * UI pattern the workspace should render. Agents adding a tool pick the
 * closest pattern instead of inventing a one-off layout.
 */
export type ToolUiPattern =
  | "transform" // dual pane input → output (Base64, URL encode, …)
  | "generate" // options + generate button (UUID, password, …)
  | "diff" // two inputs + annotated output
  | "inspect"; // single input + structured fields (JWT decode, …)

export type ToolStatus = "available" | "coming-soon";

/**
 * Delivery maturity is separate from preview availability. A reference tool
 * may be usable during development without counting toward a product release.
 * `release-ready` means that at least one explicitly named product surface has
 * completed its certification contract; it does not make the whole registry or
 * every host releasable.
 */
export type ToolReleaseStage = "reference" | "planned" | "implemented" | "release-ready";

/**
 * Product hosts supported by the shared registry. `browser-extension` refers to
 * Chromium/Firefox-style extensions; it is deliberately distinct from the
 * ordinary public web application.
 */
export const TOOL_PLATFORM_IDS = ["web", "browser-extension", "vscode-extension"] as const;

export type ToolPlatformId = (typeof TOOL_PLATFORM_IDS)[number];

/**
 * `available` means an implementation is exposed and verified in this
 * repository. It does not mean the coordinated product or a marketplace
 * package has been publicly released; `releaseStage` and the suite gate own
 * that decision.
 */
export type ToolPlatformStatus = "available" | "planned" | "unsupported";

/**
 * Host-neutral capabilities used to review a tool before exposing it on a new
 * platform. These describe user-visible powers, not concrete browser/VS Code
 * permission names; each host adapter maps them to its narrowest permissions.
 */
export const TOOL_CAPABILITY_IDS = [
  "transform-text",
  "generate-value",
  "inspect-text",
  "compare-text",
  "clipboard-write",
  "file-import",
  "file-export",
  "share-link",
  "active-editor",
] as const;

export type ToolCapabilityId = (typeof TOOL_CAPABILITY_IDS)[number];

export type ToolPlatformContract = {
  readonly status: ToolPlatformStatus;
  readonly capabilities: readonly ToolCapabilityId[];
};

export type ToolDefinition = {
  /** Stable machine id, kebab-case, unique across the registry */
  readonly id: string;
  /** URL segment under /explore/:slug */
  readonly slug: string;
  readonly name: string;
  readonly shortName: string;
  readonly family: ToolFamilyId;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly pattern: ToolUiPattern;
  /** Web preview/navigation status; this does not imply product release readiness. */
  readonly status: ToolStatus;
  /** Explicit maturity consumed by the complete-suite production release gate. */
  readonly releaseStage: ToolReleaseStage;
  /**
   * Product surfaces certified for this tool's rollout. Omit this field (the
   * normalized value is an empty list) until a surface has passed its own
   * release contract. A `release-ready` tool must name at least one available
   * surface; an earlier-stage tool may not name any.
   *
   * This is deliberately separate from `platforms`: a host can implement and
   * expose a tool before that surface has passed promotion review.
   */
  readonly releasePlatforms?: readonly ToolPlatformId[];
  /** Explicit host exposure; availability is never inferred across hosts. */
  readonly platforms: Readonly<Record<ToolPlatformId, ToolPlatformContract>>;
  /** Path to design frame name when available */
  readonly designFrame?: string;
};
