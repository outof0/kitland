import { describe, expect, it } from "vitest";
import { calculateAge } from "./age-calculator";

describe("calculateAge", () => {
  it("computes years months days", () => {
    const result = calculateAge("2000-01-01", "2001-03-02");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.years).toBe(1);
    expect(result.value.months).toBe(2);
    expect(result.value.days).toBe(1);
    expect(result.value.totalDays).toBeGreaterThan(400);
  });
  it("rejects future birthdate", () => {
    expect(calculateAge("2030-01-01", "2020-01-01").ok).toBe(false);
  });
});
