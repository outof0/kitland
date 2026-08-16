import { afterEach, describe, expect, it } from "vitest";
import { CANONICAL_TOOL_INVENTORY } from "@kitland/tools";
import {
  AUTO_TRANSFORM_STORAGE_KEY,
  readAutoTransformPreference,
  writeAutoTransformPreference,
} from "./auto-transform-preference";
import { toolIconFor } from "../tool-meta";

describe("auto-transform preference", () => {
  afterEach(() => {
    window.localStorage.removeItem(AUTO_TRANSFORM_STORAGE_KEY);
  });

  it("returns undefined when nothing is stored", () => {
    expect(readAutoTransformPreference()).toBeUndefined();
  });

  it("round-trips a boolean without storing payloads", () => {
    writeAutoTransformPreference(false);
    expect(readAutoTransformPreference()).toBe(false);
    expect(window.localStorage.getItem(AUTO_TRANSFORM_STORAGE_KEY)).toBe("false");
    writeAutoTransformPreference(true);
    expect(readAutoTransformPreference()).toBe(true);
  });
});

describe("sidebar tool icons", () => {
  it("gives every registry slug a dedicated glyph", () => {
    const icons = CANONICAL_TOOL_INVENTORY.map((entry) => toolIconFor(entry.slug));
    expect(icons.every((svg) => svg.includes("<svg"))).toBe(true);
    expect(new Set(icons).size).toBeGreaterThan(20);
  });
});
