/**
 * Shared catalog types. Platform apps (web / VS Code / Chrome) consume these
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
 */
export type ToolReleaseStage = "reference" | "planned" | "implemented" | "release-ready";

/**
 * Product hosts supported by the shared catalog. `browser-extension` refers to
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
  /** Stable machine id, kebab-case, unique across the catalog */
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
  /** Explicit host exposure; availability is never inferred across hosts. */
  readonly platforms: Readonly<Record<ToolPlatformId, ToolPlatformContract>>;
  /** Path to design frame name when available */
  readonly designFrame?: string;
};
