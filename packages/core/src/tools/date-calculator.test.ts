import { describe, expect, it } from "vitest";
import { addDaysToIsoDate, diffIsoDates } from "./date-calculator";

describe("date-calculator", () => {
  it("diffs and adds days in UTC", () => {
    expect(diffIsoDates("2024-01-01", "2024-01-03")).toEqual({
      ok: true,
      value: { days: 2, from: "2024-01-01", to: "2024-01-03" },
    });
    expect(addDaysToIsoDate("2024-02-28", "1")).toEqual({
      ok: true,
      value: { date: "2024-02-29", days: 1 },
    });
  });
  it("rejects invalid dates", () => {
    expect(diffIsoDates("2024-02-30", "2024-03-01").ok).toBe(false);
  });
});
