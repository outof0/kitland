import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown-preview";

describe("renderMarkdown", () => {
  it("renders headings, emphasis, lists, links, and code", () => {
    const result = renderMarkdown(
      "# Hello\n\n**Bold** and `code`.\n\n- One\n- Two\n\n[Docs](https://example.com)",
    );
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("<h1>Hello</h1>");
    expect(result.value.html).toContain("<strong>Bold</strong>");
    expect(result.value.html).toContain("<ul>");
    expect(result.value.html).toContain('href="https://example.com"');
    expect(result.value.headings).toBe(1);
  });

  it("escapes raw HTML and blocks unsafe links", () => {
    const result = renderMarkdown('<script>alert("x")</script>\n\n[X](javascript:alert(1))');
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("&lt;script&gt;");
    expect(result.value.html).not.toContain("<script>");
    expect(result.value.html).not.toContain("javascript:");
  });

  it("renders fenced code and validates empty input", () => {
    expect(renderMarkdown(" ").ok).toBe(false);
    const result = renderMarkdown("```ts\nconst answer = 42;\n```");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain('class="language-ts"');
  });
});
