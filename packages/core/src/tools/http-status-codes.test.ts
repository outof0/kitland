import { describe, expect, it } from "vitest";
import { findHttpStatuses } from "./http-status-codes";
describe("HTTP statuses", () =>
  it("looks up numeric and text queries", () => {
    expect(findHttpStatuses("404")[0]?.name).toBe("Not Found");
    expect(findHttpStatuses("server").every((x) => x.category === "Server Error")).toBe(true);
  }));
