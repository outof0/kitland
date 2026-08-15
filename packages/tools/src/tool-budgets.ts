/**
 * Per-tool web chunk budgets (KB, gzip-equivalent planning targets).
 * Tools inherit DEFAULT when not listed. Reportable by slug for package checks.
 */
export type ToolBudget = {
  readonly webChunkKb: number;
  readonly notes?: string;
};

export const DEFAULT_TOOL_BUDGET: ToolBudget = Object.freeze({
  webChunkKb: 48,
  notes: "Default lazy tool chunk budget",
});

/** Explicit overrides for heavier tools. */
const TOOL_BUDGET_OVERRIDES: Readonly<Record<string, ToolBudget>> = Object.freeze({
  "json-formatter": { webChunkKb: 96, notes: "Tree + worker formatter" },
  "json-diff": { webChunkKb: 64, notes: "Structural diff UI" },
  "regex-tester": { webChunkKb: 64, notes: "Worker-backed matcher" },
  "markdown-preview": { webChunkKb: 72, notes: "Sanitized renderer" },
  "qr-code": { webChunkKb: 80, notes: "QR encoder dependency" },
  "curl-converter": { webChunkKb: 56 },
  base64: { webChunkKb: 56, notes: "Share + worker" },
});

export function getToolBudget(slug: string): ToolBudget {
  return TOOL_BUDGET_OVERRIDES[slug] ?? DEFAULT_TOOL_BUDGET;
}

export function listToolBudgetOverrides(): Readonly<Record<string, ToolBudget>> {
  return TOOL_BUDGET_OVERRIDES;
}
