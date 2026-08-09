/**
 * Pure JSON Diff workflow state machine.
 *
 * Modes live on one route: Editor owns A/B inputs; Compare owns one derived
 * result. Edits never leave a previous comparison marked as current.
 */

export type JsonDiffMode = "editor" | "compare";

export type JsonDiffDocumentSide = {
  readonly name: string;
  readonly value: string;
};

export type JsonDiffWorkflowState = {
  readonly mode: JsonDiffMode;
  readonly left: JsonDiffDocumentSide;
  readonly right: JsonDiffDocumentSide;
  /** Snapshot of values used for the last successful Compare entry. */
  readonly comparedLeft: string | null;
  readonly comparedRight: string | null;
};

export const JSON_DIFF_DEFAULT_LEFT_NAME = "Before";
export const JSON_DIFF_DEFAULT_RIGHT_NAME = "After";

export function createJsonDiffWorkflow(
  leftValue = "",
  rightValue = "",
  leftName = JSON_DIFF_DEFAULT_LEFT_NAME,
  rightName = JSON_DIFF_DEFAULT_RIGHT_NAME,
): JsonDiffWorkflowState {
  return {
    mode: "editor",
    left: { name: leftName, value: leftValue },
    right: { name: rightName, value: rightValue },
    comparedLeft: null,
    comparedRight: null,
  };
}

/** True when Compare is showing a result that still matches current A/B. */
export function isCompareCurrent(state: JsonDiffWorkflowState): boolean {
  return (
    state.mode === "compare" &&
    state.comparedLeft === state.left.value &&
    state.comparedRight === state.right.value
  );
}

/**
 * True when Compare mode is active but A/B no longer match the snapshot.
 * Callers must not present a stale result as current.
 */
export function isCompareStale(state: JsonDiffWorkflowState): boolean {
  return (
    state.mode === "compare" &&
    (state.comparedLeft !== state.left.value || state.comparedRight !== state.right.value)
  );
}

export function setJsonDiffMode(
  state: JsonDiffWorkflowState,
  mode: JsonDiffMode,
): JsonDiffWorkflowState {
  if (mode === "editor") {
    return { ...state, mode: "editor" };
  }
  // Entering Compare freezes the current A/B as the comparison source.
  return {
    ...state,
    mode: "compare",
    comparedLeft: state.left.value,
    comparedRight: state.right.value,
  };
}

export function setJsonDiffLeft(
  state: JsonDiffWorkflowState,
  value: string,
): JsonDiffWorkflowState {
  const next = { ...state, left: { ...state.left, value } };
  // Edits return to Editor so Compare is never shown as current after a change.
  return next.mode === "compare" ? { ...next, mode: "editor" } : next;
}

export function setJsonDiffRight(
  state: JsonDiffWorkflowState,
  value: string,
): JsonDiffWorkflowState {
  const next = { ...state, right: { ...state.right, value } };
  return next.mode === "compare" ? { ...next, mode: "editor" } : next;
}

/**
 * Swap names, values, and any compare snapshot together so a second swap
 * restores the prior arrangement (reversible).
 */
export function swapJsonDiffSides(state: JsonDiffWorkflowState): JsonDiffWorkflowState {
  return {
    ...state,
    left: state.right,
    right: state.left,
    comparedLeft: state.comparedRight,
    comparedRight: state.comparedLeft,
  };
}

export function clearJsonDiffInputs(state: JsonDiffWorkflowState): JsonDiffWorkflowState {
  return {
    ...state,
    mode: "editor",
    left: { ...state.left, value: "" },
    right: { ...state.right, value: "" },
    comparedLeft: null,
    comparedRight: null,
  };
}

export function loadJsonDiffSample(
  state: JsonDiffWorkflowState,
  leftValue: string,
  rightValue: string,
): JsonDiffWorkflowState {
  return {
    ...state,
    mode: "editor",
    left: { ...state.left, value: leftValue },
    right: { ...state.right, value: rightValue },
    comparedLeft: null,
    comparedRight: null,
  };
}

/** Operation labels for non-color-only change semantics. */
export function jsonDiffOperationLabel(operation: "added" | "removed" | "changed"): string {
  switch (operation) {
    case "added":
      return "added";
    case "removed":
      return "removed";
    case "changed":
      return "changed";
  }
}
