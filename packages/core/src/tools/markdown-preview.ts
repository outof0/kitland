import { err, ok, type ToolResult } from "../result";

export const MARKDOWN_PREVIEW_MAX_INPUT_CHARS = 500_000;
export const MARKDOWN_PREVIEW_MAX_OUTPUT_CHARS = 1_000_000;

export type MarkdownPreview = {
  readonly html: string;
  readonly headings: number;
  readonly words: number;
  readonly lines: number;
};

/** Render a deliberately small, safe Markdown subset without accepting raw HTML. */
export function renderMarkdown(source: string): ToolResult<MarkdownPreview> {
  if (source.length > MARKDOWN_PREVIEW_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Markdown input exceeds the ${MARKDOWN_PREVIEW_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (!source.trim()) return err("EMPTY_INPUT", "Enter Markdown to preview.");

  const lines = source.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
  const html: string[] = [];
  let inCode = false;
  let codeLanguage = "";
  let codeLines: string[] = [];
  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let headings = 0;

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join("\n"))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) html.push(`</${listType}>`);
    listType = null;
  };

  for (const line of lines) {
    const fence = /^\s*```\s*([\w-]*)\s*$/u.exec(line);
    if (fence) {
      flushParagraph();
      closeList();
      if (inCode) {
        const className = codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : "";
        html.push(`<pre><code${className}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
        codeLanguage = "";
        codeLines = [];
      } else {
        inCode = true;
        codeLanguage = fence[1] ?? "";
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    const heading = /^(#{1,6})\s+(.+?)\s*#*$/u.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      const hashes = heading[1];
      const headingText = heading[2];
      if (!hashes || !headingText) continue;
      const level = hashes.length;
      headings += 1;
      html.push(`<h${level}>${inlineMarkdown(headingText)}</h${level}>`);
      continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/u.test(line)) {
      flushParagraph();
      closeList();
      html.push("<hr>");
      continue;
    }
    const listItem = /^\s*([-+*]|\d+[.)])\s+(.+)$/u.exec(line);
    if (listItem) {
      flushParagraph();
      const marker = listItem[1];
      const itemText = listItem[2];
      if (!marker || !itemText) continue;
      const nextType: "ul" | "ol" = /^\d/u.test(marker) ? "ol" : "ul";
      if (listType !== nextType) {
        closeList();
        html.push(`<${nextType}>`);
        listType = nextType;
      }
      html.push(`<li>${inlineMarkdown(itemText)}</li>`);
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      flushParagraph();
      closeList();
      html.push(`<blockquote><p>${inlineMarkdown(line.replace(/^\s*>\s?/u, ""))}</p></blockquote>`);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    closeList();
    paragraph.push(line);
  }
  flushParagraph();
  closeList();
  if (inCode) {
    const className = codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : "";
    html.push(`<pre><code${className}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  const output = html.join("\n");
  if (output.length > MARKDOWN_PREVIEW_MAX_OUTPUT_CHARS) {
    return err("OUTPUT_TOO_LARGE", "Rendered Markdown exceeds the output size limit.");
  }
  return ok({ html: output, headings, words: countWords(source), lines: lines.length });
}

function inlineMarkdown(source: string): string {
  let value = escapeHtml(source);
  value = value.replace(/`([^`\n]+)`/gu, "<code>$1</code>");
  value = value.replace(/\*\*([^*\n]+)\*\*/gu, "<strong>$1</strong>");
  value = value.replace(/__([^_\n]+)__/gu, "<strong>$1</strong>");
  value = value.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/gu, "<em>$1</em>");
  value = value.replace(/(?<!\w)_([^_\n]+)_(?!\w)/gu, "<em>$1</em>");
  value = value.replace(
    /\[([^\]]+)\]\(([^\s)]+)(?:\s+&quot;[^\n]*&quot;)?\)/gu,
    (_match, label: string, href: string) => {
      const safeHref = isSafeHref(unescapeHtml(href)) ? href : "#";
      return `<a href="${safeHref}" rel="noreferrer noopener">${label}</a>`;
    },
  );
  return value.replace(/\n/gu, "<br>");
}

function isSafeHref(href: string): boolean {
  return /^(?:https?:|mailto:|\/|#)/iu.test(href);
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
      character,
  );
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/[^\w-]/gu, "");
}

function unescapeHtml(value: string): string {
  return value.replace(/&amp;/gu, "&").replace(/&quot;/gu, '"');
}

function countWords(value: string): number {
  return value.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’-]*/gu)?.length ?? 0;
}
