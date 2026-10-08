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

  it("strips dangerous HTML and blocks unsafe links", () => {
    const result = renderMarkdown('<script>alert("x")</script>\n\n[X](javascript:alert(1))');
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).not.toContain("<script>");
    expect(result.value.html).not.toContain("alert");
    expect(result.value.html).not.toContain("javascript:");
  });

  it("renders safe inline HTML and strips dangerous attributes", () => {
    const result = renderMarkdown(
      'a <b>bold</b> and <i>italic</i> <a href="https://example.com" onclick="evil()" style="color:red">x</a>',
    );
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("<p>a <b>bold</b> and <i>italic</i> ");
    expect(result.value.html).toContain('href="https://example.com"');
    expect(result.value.html).not.toContain("onclick");
    expect(result.value.html).not.toContain("style=");
  });

  it("drops unsafe image sources and HTML comments", () => {
    const result = renderMarkdown('<img src="javascript:alert(1)" alt="x"> a <!-- secret --> b');
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).not.toContain("javascript:");
    expect(result.value.html).not.toContain("secret");
    expect(result.value.html).toContain("a  b");
  });

  it("keeps raw HTML blocks raw without processing their markdown", () => {
    const result = renderMarkdown("<div>\n**not bold**\n</div>");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("<div>");
    expect(result.value.html).toContain("**not bold**");
    expect(result.value.html).not.toContain("<strong>");
  });

  it("treats malformed HTML as text", () => {
    const result = renderMarkdown("a <div b c");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("&lt;div b");
  });

  it("keeps already-escaped URL query delimiters without decoding them twice", () => {
    const result = renderMarkdown("[Docs](https://example.com/?one=1&two=2)");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain('href="https://example.com/?one=1&amp;two=2"');
  });

  it("renders fenced code and validates empty input", () => {
    expect(renderMarkdown(" ").ok).toBe(false);
    const result = renderMarkdown("```ts\nconst answer = 42;\n```");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain('class="language-ts"');
  });

  it("treats a single newline as a soft break, two trailing spaces as a hard break", () => {
    const soft = renderMarkdown("line one\nline two");
    if (!soft.ok) throw new Error(soft.error.message);
    expect(soft.value.html).toBe("<p>line one\nline two</p>");
    expect(soft.value.html).not.toContain("<br>");
    const hard = renderMarkdown("line one  \nline two");
    if (!hard.ok) throw new Error(hard.error.message);
    expect(hard.value.html).toContain("line one<br>line two");
  });

  it("merges consecutive blockquote lines into a single blockquote", () => {
    const result = renderMarkdown("> first\n> second");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toBe("<blockquote><p>first\nsecond</p></blockquote>");
  });

  it("supports balanced parentheses in link destinations", () => {
    const result = renderMarkdown("[Wiki](https://example.com/wiki/Markdown_(markup))");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain('href="https://example.com/wiki/Markdown_(markup)"');
    expect(result.value.html).not.toContain(")</p>");
  });

  it("keeps one loose list across blank lines instead of splitting it", () => {
    const result = renderMarkdown("- a\n- b\n\n- c");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html.match(/<ul>/gu)).toHaveLength(1);
    expect(result.value.html).toContain("<li><p>a</p></li>");
    expect(result.value.html).toContain("<li><p>c</p></li>");
  });

  it("only strips a heading closing sequence that is preceded by a space", () => {
    const result = renderMarkdown("# C#\n\n# Hello #");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("<h1>C#</h1>");
    expect(result.value.html).toContain("<h1>Hello</h1>");
  });

  it("renders GFM tables with thead and tbody", () => {
    const result = renderMarkdown(
      "| Left columns | Right columns |\n| --- | --- |\n| left foo | right foo |\n| left bar | right bar |",
    );
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("<table>");
    expect(result.value.html).toContain(
      "<thead><tr><th>Left columns</th><th>Right columns</th></tr></thead>",
    );
    expect(result.value.html).toContain("<tbody>");
    expect(result.value.html).toContain("<td>left foo</td><td>right foo</td>");
    expect(result.value.html).toContain("<td>left bar</td><td>right bar</td>");
  });

  it("applies column alignment from the delimiter row", () => {
    const result = renderMarkdown("| L | C | R |\n| :-- | :-: | --: |\n| a | b | c |");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain('<th align="left">L</th>');
    expect(result.value.html).toContain('<th align="center">C</th>');
    expect(result.value.html).toContain('<th align="right">R</th>');
    expect(result.value.html).toContain('<td align="center">b</td>');
  });

  it("keeps escaped pipes inside table cells", () => {
    const result = renderMarkdown("| col |\n| --- |\n| a \\| b |");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("<td>a | b</td>");
  });

  it("pads short rows and drops extra cells", () => {
    const result = renderMarkdown("| a | b |\n| - | - |\n| x |\n| y | z | w |");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("<tr><td>x</td><td></td></tr>");
    expect(result.value.html).toContain("<tr><td>y</td><td>z</td></tr>");
    expect(result.value.html).not.toContain("<td>w</td>");
  });

  it("renders inline markdown inside table cells", () => {
    const result = renderMarkdown(
      "| **bold** | `code` |\n| --- | --- |\n| [x](https://example.com) | y |",
    );
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("<th><strong>bold</strong></th>");
    expect(result.value.html).toContain("<th><code>code</code></th>");
    expect(result.value.html).toContain('href="https://example.com"');
  });

  it("does not treat mismatched header/delimiter column counts as a table", () => {
    const result = renderMarkdown("| a | b |\n| --- |");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).not.toContain("<table>");
  });

  it("renders a table after a paragraph and stops at a blank line", () => {
    const result = renderMarkdown("Intro\n\n| a |\n| - |\n| b |\n\nAfter");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("<p>Intro</p>");
    expect(result.value.html).toContain("<table>");
    expect(result.value.html).toContain("<p>After</p>");
  });

  it("renders strikethrough", () => {
    const result = renderMarkdown("~~deleted~~");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toBe("<p><del>deleted</del></p>");
  });

  it("renders task list checkboxes", () => {
    const result = renderMarkdown("- [ ] todo\n- [x] done");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain('<li><input type="checkbox" disabled> todo</li>');
    expect(result.value.html).toContain('<li><input type="checkbox" disabled checked> done</li>');
  });

  it("nests lists by indentation", () => {
    const result = renderMarkdown("- a\n  - b\n  - c\n- d");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toBe("<ul><li>a<ul><li>b</li><li>c</li></ul></li><li>d</li></ul>");
  });

  it("nests blockquotes", () => {
    const result = renderMarkdown("> > deep");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toBe("<blockquote><blockquote><p>deep</p></blockquote></blockquote>");
  });

  it("renders autolinks", () => {
    const result = renderMarkdown("<https://example.com>");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain('<a href="https://example.com">https://example.com</a>');
  });

  it("renders setext headings", () => {
    const result = renderMarkdown("Title\n===\n\nSub\n---");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain("<h1>Title</h1>");
    expect(result.value.html).toContain("<h2>Sub</h2>");
    expect(result.value.headings).toBe(2);
  });

  it("resolves reference links and shortcuts", () => {
    const result = renderMarkdown(
      "[a][b]\n\n[b]: https://example.com\n\n[c]\n\n[c]: https://example.org",
    );
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain(
      '<a href="https://example.com" rel="noreferrer noopener">a</a>',
    );
    expect(result.value.html).toContain(
      '<a href="https://example.org" rel="noreferrer noopener">c</a>',
    );
    expect(result.value.html).not.toContain("[b]:");
  });

  it("treats a backslash at end of line as a hard break", () => {
    const result = renderMarkdown("one\\\ntwo");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toBe("<p>one<br>two</p>");
  });

  it("renders images and blocks unsafe image sources", () => {
    const result = renderMarkdown("![alt](https://example.com/i.png)");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain('<img src="https://example.com/i.png" alt="alt">');
    const unsafe = renderMarkdown("![x](javascript:alert(1))");
    if (!unsafe.ok) throw new Error(unsafe.error.message);
    expect(unsafe.value.html).not.toContain("<img");
  });

  it("keeps code span content free of inline formatting", () => {
    const result = renderMarkdown("`**not bold** and <https://example.com>`");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toBe(
      "<p><code>**not bold** and &lt;https://example.com&gt;</code></p>",
    );
  });

  it("supports double-backtick code spans", () => {
    const result = renderMarkdown("``a ` b``");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toBe("<p><code>a ` b</code></p>");
  });

  it("emits start attribute for ordered lists not starting at 1", () => {
    const result = renderMarkdown("3. a\n4. b");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value.html).toContain('<ol start="3">');
  });
});
