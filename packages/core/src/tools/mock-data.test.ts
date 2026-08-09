import { describe, expect, it } from "vitest";
import { generateMockData } from "./mock-data";
describe("mock data", () => {
  it("generates bounded local rows", () => {
    const r = generateMockData(
      { count: 2, includeId: true, includeName: true, includeEmail: true, includeRole: true },
      (n) => Uint8Array.from({ length: n }, (_, i) => i),
    );
    expect(r).toMatchObject({ ok: true });
    if (!r.ok) throw new Error("Expected mock data generation to succeed.");

    expect(r.value).toHaveLength(2);
    expect(r.value[0]?.email).toContain("@example.test");
  });
  it("requires a schema", () =>
    expect(
      generateMockData(
        { count: 1, includeId: false, includeName: false, includeEmail: false, includeRole: false },
        () => new Uint8Array(),
      ),
    ).toMatchObject({ ok: false, error: { code: "EMPTY_SCHEMA" } }));
});
