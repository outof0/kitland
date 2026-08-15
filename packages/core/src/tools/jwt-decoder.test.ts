import { describe, expect, it } from "vitest";
import { inspectJwt } from "./jwt-decoder";
describe("inspectJwt", () => {
  it("decodes local token segments", () =>
    expect(inspectJwt("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature")).toMatchObject({
      ok: true,
      value: { header: { alg: "HS256" }, payload: { sub: "123" } },
    }));
});
