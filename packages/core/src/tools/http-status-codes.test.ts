import { describe, expect, it } from "vitest";
import { findHttpStatuses, getHttpStatus, HTTP_STATUS_CODES } from "./http-status-codes";

describe("HTTP statuses", () => {
  it("has full coverage across all 5 series", () => {
    expect(HTTP_STATUS_CODES.length).toBeGreaterThanOrEqual(60);

    const categories = new Set(HTTP_STATUS_CODES.map((s) => s.category));
    expect(categories).toEqual(
      new Set(["Informational", "Success", "Redirection", "Client Error", "Server Error"]),
    );
  });

  it("looks up numeric and text queries", () => {
    expect(findHttpStatuses("404")[0]?.name).toBe("Not Found");
    expect(findHttpStatuses("server error").every((x) => x.category === "Server Error")).toBe(true);
    expect(findHttpStatuses("teapot")[0]?.code).toBe(418);
    expect(findHttpStatuses("early hints")[0]?.code).toBe(103);
    expect(findHttpStatuses("rate limit")[0]?.code).toBe(429);
  });

  it("gets status by exact numeric code", () => {
    expect(getHttpStatus(200)?.name).toBe("OK");
    expect(getHttpStatus(404)?.spec).toContain("RFC 9110");
    expect(getHttpStatus(999)).toBeUndefined();
  });

  it("contains rich metadata including spec and cacheability", () => {
    const s200 = getHttpStatus(200);
    expect(s200?.cacheable).toBe(true);
    expect(s200?.commonHeaders).toContain("ETag");

    const s301 = getHttpStatus(301);
    expect(s301?.commonHeaders).toContain("Location");

    const s429 = getHttpStatus(429);
    expect(s429?.commonHeaders).toContain("Retry-After");
  });
});
