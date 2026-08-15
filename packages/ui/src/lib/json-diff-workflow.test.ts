import { describe, expect, it } from "vitest";
import {
  clearJsonDiffInputs,
  createJsonDiffWorkflow,
  isCompareCurrent,
  isCompareStale,
  jsonDiffOperationLabel,
  loadJsonDiffSample,
  setJsonDiffLeft,
  setJsonDiffMode,
  setJsonDiffRight,
  swapJsonDiffSides,
} from "./json-diff-workflow";

describe("json-diff-workflow", () => {
  it("starts in Editor with durable A/B names", () => {
    const state = createJsonDiffWorkflow('{"a":1}', '{"a":2}');
    expect(state.mode).toBe("editor");
    expect(state.left.name).toBe("Before");
    expect(state.right.name).toBe("After");
    expect(state.left.value).toBe('{"a":1}');
    expect(state.right.value).toBe('{"a":2}');
    expect(isCompareCurrent(state)).toBe(false);
  });

  it("preserves A/B values when switching Editor ↔ Compare", () => {
    const editor = createJsonDiffWorkflow('{"x":1}', '{"x":2}');
    const compare = setJsonDiffMode(editor, "compare");
    expect(compare.mode).toBe("compare");
    expect(compare.left.value).toBe('{"x":1}');
    expect(compare.right.value).toBe('{"x":2}');
    expect(isCompareCurrent(compare)).toBe(true);

    const back = setJsonDiffMode(compare, "editor");
    expect(back.mode).toBe("editor");
    expect(back.left.value).toBe('{"x":1}');
    expect(back.right.value).toBe('{"x":2}');
  });

  it("returns to Editor when A or B is edited after Compare", () => {
    const compare = setJsonDiffMode(createJsonDiffWorkflow("{}", '{"a":1}'), "compare");
    expect(isCompareCurrent(compare)).toBe(true);

    const editedLeft = setJsonDiffLeft(compare, '{"b":2}');
    expect(editedLeft.mode).toBe("editor");
    expect(isCompareCurrent(editedLeft)).toBe(false);
    expect(isCompareStale({ ...editedLeft, mode: "compare" })).toBe(true);

    const editedRight = setJsonDiffRight(compare, '{"c":3}');
    expect(editedRight.mode).toBe("editor");
    expect(editedRight.right.value).toBe('{"c":3}');
  });

  it("swaps names and values reversibly, including compare snapshots", () => {
    const compare = setJsonDiffMode(
      createJsonDiffWorkflow("left-doc", "right-doc", "Original", "Changed"),
      "compare",
    );
    const once = swapJsonDiffSides(compare);
    expect(once.left).toEqual({ name: "Changed", value: "right-doc" });
    expect(once.right).toEqual({ name: "Original", value: "left-doc" });
    expect(once.comparedLeft).toBe("right-doc");
    expect(once.comparedRight).toBe("left-doc");
    expect(isCompareCurrent(once)).toBe(true);

    const twice = swapJsonDiffSides(once);
    expect(twice.left).toEqual(compare.left);
    expect(twice.right).toEqual(compare.right);
    expect(twice.comparedLeft).toBe(compare.comparedLeft);
    expect(twice.comparedRight).toBe(compare.comparedRight);
  });

  it("clear and sample reset to Editor without keeping a current compare", () => {
    const compare = setJsonDiffMode(createJsonDiffWorkflow("a", "b"), "compare");
    const cleared = clearJsonDiffInputs(compare);
    expect(cleared.mode).toBe("editor");
    expect(cleared.left.value).toBe("");
    expect(cleared.right.value).toBe("");
    expect(cleared.comparedLeft).toBeNull();

    const sampled = loadJsonDiffSample(compare, "L", "R");
    expect(sampled.mode).toBe("editor");
    expect(sampled.left.value).toBe("L");
    expect(sampled.right.value).toBe("R");
    expect(isCompareCurrent(sampled)).toBe(false);
  });

  it("exposes text labels for added/removed/changed beyond color", () => {
    expect(jsonDiffOperationLabel("added")).toBe("added");
    expect(jsonDiffOperationLabel("removed")).toBe("removed");
    expect(jsonDiffOperationLabel("changed")).toBe("changed");
  });
});
