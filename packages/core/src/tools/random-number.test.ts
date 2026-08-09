import { describe, expect, it } from "vitest";
import {
  generateRandomNumbers,
  RANDOM_NUMBER_MAX_COUNT,
  RANDOM_NUMBER_MAX_DECIMALS,
} from "./random-number";

function sequence(...values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? 0;
}

describe("generateRandomNumbers", () => {
  it("creates deterministic inclusive integer values from injected entropy", () => {
    expect(generateRandomNumbers({ from: 1, to: 100, count: 3 }, sequence(0, 1, 99))).toEqual({
      ok: true,
      value: { values: [1, 2, 100], decimals: 0 },
    });
  });

  it("uses a decimal grid without floating output beyond the requested precision", () => {
    expect(
      generateRandomNumbers({ from: -1.5, to: -1.2, decimals: 1, count: 2 }, sequence(0, 3)),
    ).toEqual({
      ok: true,
      value: { values: [-1.5, -1.2], decimals: 1 },
    });
  });

  it("rejection-samples a non-dividing range to avoid modulo bias", () => {
    expect(generateRandomNumbers({ from: 0, to: 9 }, sequence(0xffff_ffff, 8))).toEqual({
      ok: true,
      value: { values: [8], decimals: 0 },
    });
  });

  it("rejects invalid range, precision, count, and entropy", () => {
    expect(generateRandomNumbers({ from: 5, to: 1 }, sequence(0))).toMatchObject({
      ok: false,
      error: { code: "INVALID_RANGE" },
    });
    expect(
      generateRandomNumbers(
        { from: 0, to: 1, decimals: RANDOM_NUMBER_MAX_DECIMALS + 1 },
        sequence(0),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: "INVALID_DECIMALS" },
    });
    expect(
      generateRandomNumbers({ from: 0, to: 1, count: RANDOM_NUMBER_MAX_COUNT + 1 }, sequence(0)),
    ).toMatchObject({
      ok: false,
      error: { code: "INVALID_COUNT" },
    });
    expect(generateRandomNumbers({ from: 0, to: 1 }, () => Number.NaN)).toMatchObject({
      ok: false,
      error: { code: "INVALID_ENTROPY" },
    });
  });
});
