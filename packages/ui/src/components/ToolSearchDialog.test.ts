import { describe, expect, it } from "vitest";
import { getToolBySlug } from "@kitland/tools";
import { rankToolSuggestions } from "./ToolSearchDialog";

describe("rankToolSuggestions", () => {
  const tools = ["base64", "beautify-minify", "json-formatter", "json-diff"]
    .map((slug) => getToolBySlug(slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  it("ranks prefix matches first and supports empty autocomplete", () => {
    const ranked = rankToolSuggestions(tools, "base", []);
    expect(ranked[0]?.slug).toBe("base64");

    const empty = rankToolSuggestions(tools, "", ["json-diff"]);
    expect(empty[0]?.slug).toBe("json-diff");
    expect(empty.length).toBeGreaterThan(0);
  });
});
