import { type CanonicalToolInventoryEntry } from "./inventory";
import {
  evaluateRegistrySurfaceRolloutReadiness,
  selectSurfaceRolloutTools,
  SURFACE_ROLLOUT_POLICY,
  type RegistrySurfaceRolloutIssue,
  type RegistrySurfaceRolloutIssueCode,
  type RegistrySurfaceRolloutReadiness,
} from "./surface-rollout";
import type { ToolDefinition } from "./types";

/**
 * @deprecated Use the explicit surface-rollout APIs. This web alias remains
 * for existing callers while rollout certification moves from a filtered web
 * artifact to per-surface release contracts.
 */
export const PHASED_RELEASE_POLICY = Object.freeze({
  requiredWebPlatform: "web" as const,
  requiredReleaseStage: SURFACE_ROLLOUT_POLICY.requiredReleaseStage,
});

/** @deprecated Use RegistrySurfaceRolloutIssueCode. */
export type RegistryPhasedReleaseIssueCode = RegistrySurfaceRolloutIssueCode;
/** @deprecated Use RegistrySurfaceRolloutIssue. */
export type RegistryPhasedReleaseIssue = RegistrySurfaceRolloutIssue;
/** @deprecated Use RegistrySurfaceRolloutReadiness. */
export type RegistryPhasedReleaseReadiness = RegistrySurfaceRolloutReadiness;

/** @deprecated Use selectSurfaceRolloutTools(tools, "web"). */
export function selectPhasedReleaseTools(
  tools: readonly ToolDefinition[],
): readonly ToolDefinition[] {
  return selectSurfaceRolloutTools(tools, "web");
}

/** @deprecated Use evaluateRegistrySurfaceRolloutReadiness(tools, "web"). */
export function evaluateRegistryPhasedReleaseReadiness(
  tools: readonly ToolDefinition[],
  canonicalInventory?: readonly CanonicalToolInventoryEntry[],
): RegistryPhasedReleaseReadiness {
  return canonicalInventory === undefined
    ? evaluateRegistrySurfaceRolloutReadiness(tools, "web")
    : evaluateRegistrySurfaceRolloutReadiness(tools, "web", canonicalInventory);
}
