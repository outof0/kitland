import { describe, expect, it } from "vitest";
import { htmlToJsx, HTML_TO_JSX_MAX_INPUT_CHARS } from "./html-to-jsx";

describe("htmlToJsx", () => {
  it("maps class/for and strips script bodies", () => {
    const result = htmlToJsx(
      '<label class="x" for="a">A</label><script>alert(1)</script \t\nbar><style>.x { color: red; }</style \t\nbar>',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("className=");
    expect(result.value).toContain("htmlFor=");
    expect(result.value).not.toContain("alert(1)");
    expect(result.value).not.toContain("color: red");
  });
  it("rejects empty and oversize", () => {
    expect(htmlToJsx("").ok).toBe(false);
    expect(htmlToJsx("x".repeat(HTML_TO_JSX_MAX_INPUT_CHARS + 1)).ok).toBe(false);
  });
});
