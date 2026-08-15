import { describe, expect, it } from "vitest";
import { getNextCronRuns, parseCronExpression } from "./cron-parser";

describe("cron parser", () => {
  it("parses steps, lists and named weekdays", () => {
    const result = parseCronExpression("*/15 9-17 * * MON-FRI");
    expect(result).toMatchObject({ ok: true, value: { expression: "*/15 9-17 * * MON-FRI" } });
    if (!result.ok) return;
    expect([...result.value.fields.minute.values]).toEqual([0, 15, 30, 45]);
    expect([...result.value.fields.dayOfWeek.values]).toEqual([1, 2, 3, 4, 5]);
  });

  it("previews the next matching run", () => {
    const parsed = parseCronExpression("0 9 * * *");
    if (!parsed.ok) throw new Error("fixture must parse");
    const result = getNextCronRuns(parsed.value, new Date(2026, 0, 5, 8, 59), 2);
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.map((date) => date.toISOString())).toEqual([
      new Date(2026, 0, 5, 9, 0).toISOString(),
      new Date(2026, 0, 6, 9, 0).toISOString(),
    ]);
  });

  it("uses Unix OR semantics when day of month and day of week are both restricted", () => {
    const parsed = parseCronExpression("0 9 1 * MON");
    if (!parsed.ok) throw new Error("fixture must parse");
    const monday = getNextCronRuns(parsed.value, new Date(2026, 0, 4, 9, 0), 1);
    expect(monday).toMatchObject({ ok: true });
    if (!monday.ok) return;
    expect(monday.value[0]?.getDate()).toBe(5);
  });

  it("rejects unsupported field counts and invalid values", () => {
    expect(parseCronExpression("@daily")).toMatchObject({
      ok: false,
      error: { code: "INVALID_FIELD_COUNT" },
    });
    expect(parseCronExpression("61 * * * *")).toMatchObject({
      ok: false,
      error: { code: "VALUE_OUT_OF_RANGE" },
    });
  });
});
