import { type CanonicalToolInventoryEntry } from "./inventory";
import {
  evaluateCatalogSurfaceRolloutReadiness,
  selectSurfaceRolloutTools,
  SURFACE_ROLLOUT_POLICY,
  type CatalogSurfaceRolloutIssue,
  type CatalogSurfaceRolloutIssueCode,
  type CatalogSurfaceRolloutReadiness,
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

/** @deprecated Use CatalogSurfaceRolloutIssueCode. */
export type CatalogPhasedReleaseIssueCode = CatalogSurfaceRolloutIssueCode;
/** @deprecated Use CatalogSurfaceRolloutIssue. */
export type CatalogPhasedReleaseIssue = CatalogSurfaceRolloutIssue;
/** @deprecated Use CatalogSurfaceRolloutReadiness. */
export type CatalogPhasedReleaseReadiness = CatalogSurfaceRolloutReadiness;

/** @deprecated Use selectSurfaceRolloutTools(tools, "web"). */
export function selectPhasedReleaseTools(
  tools: readonly ToolDefinition[],
): readonly ToolDefinition[] {
  return selectSurfaceRolloutTools(tools, "web");
}

/** @deprecated Use evaluateCatalogSurfaceRolloutReadiness(tools, "web"). */
export function evaluateCatalogPhasedReleaseReadiness(
  tools: readonly ToolDefinition[],
  canonicalInventory?: readonly CanonicalToolInventoryEntry[],
): CatalogPhasedReleaseReadiness {
  return canonicalInventory === undefined
    ? evaluateCatalogSurfaceRolloutReadiness(tools, "web")
    : evaluateCatalogSurfaceRolloutReadiness(tools, "web", canonicalInventory);
}
