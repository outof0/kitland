import { describe, expect, it } from "vitest";
import { parseUrl } from "./url-parser";
describe("parseUrl", () => {
  it("preserves URL parts and duplicate query values", () =>
    expect(parseUrl("https://a.dev:8080/p?q=1&q=2#x")).toMatchObject({
      ok: true,
      value: {
        hostname: "a.dev",
        port: "8080",
        params: [
          { name: "q", value: "1" },
          { name: "q", value: "2" },
        ],
      },
    }));
});
