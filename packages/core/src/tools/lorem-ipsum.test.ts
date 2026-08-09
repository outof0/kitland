import { describe, expect, it } from "vitest";
import {
  LOREM_MAX_AMOUNT,
  LOREM_MAX_OUTPUT_BYTES,
  generateLoremIpsum,
  type LoremUnit,
} from "./lorem-ipsum";

describe("generateLoremIpsum", () => {
  it("generates the requested paragraph count with the optional classic opening", () => {
    const result = generateLoremIpsum({ amount: 2, unit: "paragraphs", startWithClassic: true });
    if (!result.ok) throw new Error("Expected paragraphs to be generated.");
    expect(result.value.split("\n\n")).toHaveLength(2);
    expect(result.value).toMatch(/^Lorem ipsum dolor sit amet,/);
  });

  it("generates exact requested bytes from an ASCII corpus", () => {
    expect(generateLoremIpsum({ amount: 64, unit: "bytes" })).toMatchObject({
      ok: true,
      value: expect.any(String),
    });
    const result = generateLoremIpsum({ amount: 64, unit: "bytes" });
    if (!result.ok) throw new Error("Expected lorem bytes to be generated.");
    expect(new TextEncoder().encode(result.value)).toHaveLength(64);
  });

  it("supports words and list items without randomness", () => {
    const words = generateLoremIpsum({ amount: 7, unit: "words", startWithClassic: false });
    const list = generateLoremIpsum({ amount: 3, unit: "list-items" });
    expect(words).toEqual({
      ok: true,
      value: "Lorem ipsum dolor sit amet consectetur adipiscing.",
    });
    if (!list.ok) throw new Error("Expected list items to be generated.");
    expect(list.value.split("\n")).toHaveLength(3);
    expect(list.value).toMatch(/^- /m);
  });

  it("rejects invalid units and bounds", () => {
    expect(generateLoremIpsum({ amount: 0, unit: "words" })).toMatchObject({
      ok: false,
      error: { code: "INVALID_AMOUNT" },
    });
    expect(generateLoremIpsum({ amount: LOREM_MAX_AMOUNT + 1, unit: "words" })).toMatchObject({
      ok: false,
      error: { code: "INVALID_AMOUNT" },
    });
    expect(generateLoremIpsum({ amount: 1, unit: "unknown" as LoremUnit })).toMatchObject({
      ok: false,
      error: { code: "INVALID_UNIT" },
    });
    expect(generateLoremIpsum({ amount: LOREM_MAX_OUTPUT_BYTES + 1, unit: "bytes" })).toMatchObject(
      {
        ok: false,
        error: { code: "INVALID_AMOUNT" },
      },
    );
  });
});
