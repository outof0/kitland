import { err, ok, type ToolResult } from "../result";

export const MARKDOWN_PREVIEW_MAX_INPUT_CHARS = 500_000;
export const MARKDOWN_PREVIEW_MAX_OUTPUT_CHARS = 1_000_000;

export type MarkdownPreview = {
  readonly html: string;
  readonly headings: number;
  readonly words: number;
  readonly lines: number;
};

/**
 * Render a deliberately small, safe Markdown subset.
 * Covers the GFM constructs of the reference renderer (marked): ATX/setext
 * headings, emphasis, strikethrough, links (inline/reference/autolink), images,
 * fenced code, code spans, blockquotes (nested), lists (nested/task), tables,
 * thematic breaks, hard breaks, and raw HTML through a GitHub-style allowlist
 * sanitizer — scripts, event handlers, and other dangerous markup are stripped,
 * never executed.
 */
export function renderMarkdown(source: string): ToolResult<MarkdownPreview> {
  if (source.length > MARKDOWN_PREVIEW_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Markdown input exceeds the ${MARKDOWN_PREVIEW_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (!source.trim()) return err("EMPTY_INPUT", "Enter Markdown to preview.");

  const rawLines = source.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
  const { lines, refs } = extractReferences(rawLines);
  const { html, headings } = renderBlockLines(lines, refs);

  const output = html.join("\n");
  if (output.length > MARKDOWN_PREVIEW_MAX_OUTPUT_CHARS) {
    return err("OUTPUT_TOO_LARGE", "Rendered Markdown exceeds the output size limit.");
  }
  return ok({ html: output, headings, words: countWords(source), lines: rawLines.length });
}

/** Collect `[ref]: url` definitions and remove those lines from the block stream. */
function extractReferences(lines: string[]): { lines: string[]; refs: Map<string, string> } {
  const refs = new Map<string, string>();
  const kept: string[] = [];
  for (const line of lines) {
    const def = /^ {0,3}\[([^\]]+)\]:\s*(\S+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/u.exec(line);
    if (def?.[1] && def?.[2]) {
      refs.set(def[1].toLowerCase(), def[2]);
    } else {
      kept.push(line);
    }
  }
  return { lines: kept, refs };
}

type ListItem = { content: string; children: string[] };
type ListState = {
  type: "ul" | "ol";
  indent: number;
  loose: boolean;
  start: number | null;
  items: ListItem[];
};

function renderBlockLines(
  lines: string[],
  refs: Map<string, string>,
): { html: string[]; headings: number } {
  const html: string[] = [];
  let headings = 0;
  let paragraph: string[] = [];
  let inCode = false;
  let codeLanguage = "";
  let codeLines: string[] = [];
  const listStack: ListState[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join("\n"), refs)}</p>`);
      paragraph = [];
    }
  };
  const closeListLevel = () => {
    const state = listStack.pop();
    if (!state) return;
    const itemsHtml = state.items
      .map((item) => {
        const inner = state.loose ? `<p>${item.content}</p>` : item.content;
        return `<li>${inner}${item.children.join("")}</li>`;
      })
      .join("");
    const startAttr =
      state.type === "ol" && state.start !== null && state.start !== 1
        ? ` start="${state.start}"`
        : "";
    const listHtml = `<${state.type}${startAttr}>${itemsHtml}</${state.type}>`;
    const parent = listStack[listStack.length - 1];
    if (parent) {
      const lastItem = parent.items[parent.items.length - 1];
      if (lastItem) lastItem.children.push(listHtml);
      else parent.items.push({ content: "", children: [listHtml] });
    } else {
      html.push(listHtml);
    }
  };
  const closeAllLists = () => {
    while (listStack.length > 0) closeListLevel();
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";

    const fence = /^\s*```\s*([\w-]*)\s*$/u.exec(line);
    if (fence) {
      flushParagraph();
      closeAllLists();
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

    // ATX heading. A closing hash run only counts when preceded by a space.
    const heading = /^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/u.exec(line);
    if (heading) {
      flushParagraph();
      closeAllLists();
      const hashes = heading[1];
      const headingText = heading[2];
      if (!hashes || !headingText) continue;
      const level = hashes.length;
      headings += 1;
      html.push(`<h${level}>${inlineMarkdown(headingText, refs)}</h${level}>`);
      continue;
    }

    // Setext heading underline; only `=`/`-` runs count, and only over a paragraph.
    const setext = /^ {0,3}(=+|-+)\s*$/u.exec(line);
    if (setext?.[1] && paragraph.length > 0) {
      const level = setext[1][0] === "=" ? 1 : 2;
      headings += 1;
      html.push(`<h${level}>${inlineMarkdown(paragraph.join("\n"), refs)}</h${level}>`);
      paragraph = [];
      continue;
    }

    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/u.test(line)) {
      flushParagraph();
      closeAllLists();
      html.push("<hr>");
      continue;
    }

    // List item; deeper indentation nests under the current item.
    const listItem = /^(\s*)([-+*]|\d+[.)])\s+(.+)$/u.exec(line);
    if (listItem) {
      flushParagraph();
      const indent = (listItem[1] ?? "").length;
      const marker = listItem[2];
      const itemText = listItem[3];
      if (!marker || itemText === undefined) continue;
      const nextType: "ul" | "ol" = /^\d/u.test(marker) ? "ol" : "ul";
      const startNum = nextType === "ol" ? parseInt(marker, 10) : null;

      while ((listStack[listStack.length - 1]?.indent ?? -1) > indent) closeListLevel();
      const top = listStack[listStack.length - 1];
      if (!top || top.indent < indent) {
        listStack.push({ type: nextType, indent, loose: false, start: startNum, items: [] });
      } else if (top.type !== nextType) {
        closeListLevel();
        listStack.push({ type: nextType, indent, loose: false, start: startNum, items: [] });
      }
      const task = /^\[([ xX])\]\s+(.*)$/su.exec(itemText);
      let content: string;
      if (task) {
        const checked = (task[1] ?? "").toLowerCase() === "x" ? " checked" : "";
        content = `<input type="checkbox" disabled${checked}> ${inlineMarkdown(task[2] ?? "", refs)}`;
      } else {
        content = inlineMarkdown(itemText, refs);
      }
      listStack[listStack.length - 1]?.items.push({ content, children: [] });
      continue;
    }

    const table = parseTable(lines, index, refs);
    if (table) {
      flushParagraph();
      closeAllLists();
      html.push(table.html);
      index = table.nextIndex;
      continue;
    }

    // Raw HTML block: a block-level tag (or comment/PI/declaration) starts the
    // line; the block runs until a blank line and its markdown is left raw.
    const htmlOpen = /^ {0,3}(?:<([a-zA-Z][a-zA-Z0-9-]*)|<!--|<\?|<!)/.exec(line);
    if (htmlOpen && (!htmlOpen[1] || HTML_BLOCK_TAGS.has(htmlOpen[1].toLowerCase()))) {
      flushParagraph();
      closeAllLists();
      const blockLines: string[] = [];
      let j = index;
      while (j < lines.length && (lines[j] ?? "").trim() !== "") {
        blockLines.push(lines[j] ?? "");
        j++;
      }
      index = j - 1;
      const sanitized = sanitizeHtml(blockLines.join("\n"));
      if (sanitized.trim()) html.push(sanitized);
      continue;
    }

    // Blockquote; nesting is handled by recursing into the stripped lines.
    if (/^\s*>\s?/u.test(line)) {
      flushParagraph();
      closeAllLists();
      const quoteLines: string[] = [];
      while (index < lines.length && /^\s*>\s?/u.test(lines[index] ?? "")) {
        quoteLines.push((lines[index] ?? "").replace(/^\s*>\s?/u, ""));
        index++;
      }
      index--;
      const inner = renderBlockLines(quoteLines, refs);
      headings += inner.headings;
      html.push(`<blockquote>${inner.html.join("\n")}</blockquote>`);
      continue;
    }

    // Indented text under an open list item continues that item.
    const continuation = /^(\s+)\S/u.exec(line);
    if (continuation) {
      const top = listStack[listStack.length - 1];
      const lastItem = top?.items[top.items.length - 1];
      if (top && lastItem && (continuation[1]?.length ?? 0) > top.indent) {
        lastItem.content += ` ${inlineMarkdown(line.trim(), refs)}`;
        continue;
      }
    }

    if (!line.trim()) {
      flushParagraph();
      // A blank line ends the lists unless a list item of a matching open
      // level follows, in which case that level becomes loose (CommonMark).
      let next = index + 1;
      while (next < lines.length && !(lines[next] ?? "").trim()) next++;
      const nextItem = /^(\s*)([-+*]|\d+[.)])\s+/u.exec(lines[next] ?? "");
      if (nextItem?.[1] !== undefined && nextItem?.[2]) {
        const nextIndent = nextItem[1].length;
        const nextType: "ul" | "ol" = /^\d/u.test(nextItem[2]) ? "ol" : "ul";
        const level = listStack.find((state) => state.indent === nextIndent);
        if (level && level.type === nextType) level.loose = true;
      } else {
        closeAllLists();
      }
      continue;
    }

    closeAllLists();
    paragraph.push(line);
  }

  flushParagraph();
  closeAllLists();
  if (inCode) {
    const className = codeLanguage ? ` class="language-${escapeAttribute(codeLanguage)}"` : "";
    html.push(`<pre><code${className}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }
  return { html, headings };
}

function inlineMarkdown(source: string, refs: Map<string, string>): string {
  // Strip literal placeholder control chars so stash markers stay unambiguous.
  // oxlint-disable-next-line eslint/no-control-regex -- Placeholder markers are intentional control chars.
  const clean = source.replace(/[\u0000\u0001]/gu, "");

  // Stash code spans first (raw content) so neither HTML parsing nor inline
  // rules can touch them.
  const codeSpans: string[] = [];
  const stashCode = (code: string): string => {
    codeSpans.push(code);
    return `\u0000${codeSpans.length - 1}\u0000`;
  };
  let value = clean.replace(/``((?:[^`]|`[^`])*)``/gu, (_match, code: string) => stashCode(code));
  value = value.replace(/`([^`\n]+)`/gu, (_match, code: string) => stashCode(code));

  // Stash raw HTML fragments (sanitized on the way in) before escaping the rest.
  const htmlFrags: string[] = [];
  value = stashRawHtml(value, htmlFrags);

  value = escapeHtml(value);

  // Autolinks in their escaped form (&lt;...&gt;).
  value = value.replace(/&lt;((?:https?|ftp):[^<>\s]+)&gt;/gu, (_match, url: string) => {
    const safeUrl = isSafeHref(url) ? url : "#";
    return `<a href="${safeUrl}">${url}</a>`;
  });
  value = value.replace(
    /&lt;([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})&gt;/gu,
    (_match, email: string) => `<a href="mailto:${email}">${email}</a>`,
  );

  value = value.replace(/\*\*([^*\n]+)\*\*/gu, "<strong>$1</strong>");
  value = value.replace(/__([^_\n]+)__/gu, "<strong>$1</strong>");
  value = value.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/gu, "<em>$1</em>");
  value = value.replace(/(?<!\w)_([^_\n]+)_(?!\w)/gu, "<em>$1</em>");
  value = value.replace(/~~([^~\n]+)~~/gu, "<del>$1</del>");

  // Images before links; unsafe sources degrade to plain alt text.
  value = value.replace(
    /!\[([^\]]*)\]\(((?:[^\s()]|\([^()\s]*\))+)(?:\s+&quot;[^\n]*&quot;)?\)/gu,
    (_match, alt: string, src: string) =>
      isSafeHref(src) ? `<img src="${src}" alt="${alt}">` : alt,
  );
  value = value.replace(
    /\[([^\]]+)\]\(((?:[^\s()]|\([^()\s]*\))+)(?:\s+&quot;[^\n]*&quot;)?\)/gu,
    (_match, label: string, href: string) => {
      const safeHref = isSafeHref(href) ? href : "#";
      return `<a href="${safeHref}" rel="noreferrer noopener">${label}</a>`;
    },
  );
  value = value.replace(/\[([^\]]+)\]\[([^\]]*)\]/gu, (_match, label: string, ref: string) => {
    const href = refs.get((ref || label).toLowerCase());
    if (href === undefined) return _match;
    const safeHref = isSafeHref(href) ? href : "#";
    return `<a href="${safeHref}" rel="noreferrer noopener">${label}</a>`;
  });
  value = value.replace(/\[([^\]]+)\]/gu, (_match, label: string) => {
    const href = refs.get(label.toLowerCase());
    if (href === undefined) return _match;
    const safeHref = isSafeHref(href) ? href : "#";
    return `<a href="${safeHref}" rel="noreferrer noopener">${label}</a>`;
  });

  // Hard breaks: two trailing spaces or a backslash; single newlines stay soft.
  value = value.replace(/ {2,}\n/gu, "<br>");
  value = value.replace(/\\\n/gu, "<br>");

  // Restore code spans (escaping their content now) and sanitized HTML last.
  value = value.replace(
    // oxlint-disable-next-line eslint/no-control-regex -- Placeholder markers are intentional control chars.
    /\u0000(\d+)\u0000/gu,
    (_match, i: string) => `<code>${escapeHtml(stripCodeSpace(codeSpans[Number(i)] ?? ""))}</code>`,
  );
  // oxlint-disable-next-line eslint/no-control-regex -- Placeholder markers are intentional control chars.
  return value.replace(/\u0001(\d+)\u0001/gu, (_match, i: string) => htmlFrags[Number(i)] ?? "");
}

function isSafeHref(href: string): boolean {
  return /^(?:https?:|mailto:|\/|#)/iu.test(href);
}

// ---------------------------------------------------------------------------
// Raw HTML through a GitHub-style allowlist sanitizer. Only safe
// tags/attributes survive; everything else degrades to escaped text, and
// dangerous tags (script, style, iframe, …) lose their content entirely.
// Malformed markup always degrades to text, never to executable markup.
// ---------------------------------------------------------------------------

const ALLOWED_HTML_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "caption",
  "code",
  "col",
  "colgroup",
  "del",
  "details",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "ol",
  "p",
  "pre",
  "q",
  "s",
  "samp",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
  "var",
]);

/** Tags whose content is dropped entirely — never legitimate content. */
const DROP_HTML_CONTENT_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "noembed",
  "noframes",
  "noscript",
  "template",
  "frame",
  "frameset",
  "link",
  "meta",
  "base",
]);

/** Block-level tags that open an HTML block (CommonMark type 6 + droppables). */
const HTML_BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "base",
  "basefont",
  "blockquote",
  "body",
  "caption",
  "center",
  "col",
  "colgroup",
  "dd",
  "details",
  "dialog",
  "dir",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "frame",
  "frameset",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hr",
  "html",
  "iframe",
  "legend",
  "li",
  "link",
  "main",
  "menu",
  "menuitem",
  "meta",
  "nav",
  "noframes",
  "ol",
  "optgroup",
  "option",
  "p",
  "param",
  "section",
  "source",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "title",
  "tr",
  "track",
  "ul",
  ...DROP_HTML_CONTENT_TAGS,
]);

const GLOBAL_HTML_ATTRS = new Set(["title"]);
const TAG_HTML_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href"]),
  img: new Set(["src", "alt", "width", "height"]),
  th: new Set(["align", "colspan", "rowspan"]),
  td: new Set(["align", "colspan", "rowspan"]),
  ol: new Set(["start", "type"]),
  li: new Set(["value"]),
  details: new Set(["open"]),
};
const URL_HTML_ATTRS = new Set(["href", "src"]);

type HtmlToken = { next: number; html?: string; drop?: boolean } | null;

/**
 * Parse one HTML token (tag, comment, PI, declaration) at `src[pos]`, which
 * must be "<". Returns null when `<` does not start a token — the caller then
 * treats `<` as literal text.
 */
function parseHtmlToken(src: string, pos: number): HtmlToken {
  let i = pos + 1;
  const charAt = (at: number): string => src[at] ?? "";
  // Comments are dropped entirely.
  if (src.startsWith("!--", i)) {
    const end = src.indexOf("-->", i + 3);
    return { next: end === -1 ? src.length : end + 3, drop: true };
  }
  // Doctype and other declarations are dropped.
  if (charAt(i) === "!") {
    const end = src.indexOf(">", i);
    return { next: end === -1 ? src.length : end + 1, drop: true };
  }
  // Processing instructions are dropped.
  if (charAt(i) === "?") {
    const end = src.indexOf("?>", i);
    return { next: end === -1 ? src.length : end + 2, drop: true };
  }

  let closing = false;
  if (charAt(i) === "/") {
    closing = true;
    i++;
  }
  const nameMatch = /^[a-zA-Z][a-zA-Z0-9-]*/.exec(src.slice(i));
  if (!nameMatch) return null;
  const tagName = nameMatch[0].toLowerCase();
  i += nameMatch[0].length;

  if (closing) {
    const closeMatch = /^\s*>/.exec(src.slice(i));
    if (!closeMatch) return null;
    i += closeMatch[0].length;
    if (ALLOWED_HTML_TAGS.has(tagName)) return { next: i, html: `</${tagName}>` };
    return { next: i, drop: true };
  }

  const attrs: Array<[string, string | null]> = [];
  let selfClosing = false;
  let malformed = false;
  let closed = false;
  while (i < src.length && !malformed) {
    const ws = /^\s+/.exec(src.slice(i));
    if (ws) i += ws[0].length;
    if (charAt(i) === ">") {
      i++;
      closed = true;
      break;
    }
    if (charAt(i) === "/" && charAt(i + 1) === ">") {
      i += 2;
      selfClosing = true;
      closed = true;
      break;
    }
    const attrMatch = /^[a-zA-Z_:][a-zA-Z0-9_:.-]*/.exec(src.slice(i));
    if (!attrMatch) {
      malformed = true;
      break;
    }
    const attrName = attrMatch[0].toLowerCase();
    i += attrMatch[0].length;
    i += /^\s*/.exec(src.slice(i))?.[0].length ?? 0;
    let attrValue: string | null = null;
    if (charAt(i) === "=") {
      i++;
      i += /^\s*/.exec(src.slice(i))?.[0].length ?? 0;
      const quote = charAt(i);
      if (quote === '"' || quote === "'") {
        const end = src.indexOf(quote, i + 1);
        if (end === -1) {
          malformed = true;
          break;
        }
        attrValue = src.slice(i + 1, end);
        i = end + 1;
      } else {
        const valueMatch = /^[^\s"'`=<>`]+/.exec(src.slice(i));
        if (!valueMatch) {
          malformed = true;
          break;
        }
        attrValue = valueMatch[0];
        i += valueMatch[0].length;
        if (attrValue.endsWith("/") && charAt(i) === ">") {
          attrValue = attrValue.slice(0, -1);
          selfClosing = true;
        }
      }
    }
    attrs.push([attrName, attrValue]);
  }
  if (malformed || !closed) return null;

  // Dangerous tags: drop the tag and everything up to the matching close tag.
  if (DROP_HTML_CONTENT_TAGS.has(tagName)) {
    return { next: skipToCloseTag(src, i, tagName), drop: true };
  }
  // Disallowed tags are dropped but their text content is kept.
  if (!ALLOWED_HTML_TAGS.has(tagName)) {
    return { next: i, drop: true };
  }

  let attrStr = "";
  const tagAttrs = TAG_HTML_ATTRS[tagName];
  for (const [name, val] of attrs) {
    if (name.startsWith("on")) continue; // defense in depth; never allowlisted
    const allowed = GLOBAL_HTML_ATTRS.has(name) || tagAttrs?.has(name) === true;
    if (!allowed) continue;
    if (val === null) {
      attrStr += ` ${name}`;
      continue;
    }
    if (URL_HTML_ATTRS.has(name) && !isSafeHref(val)) continue;
    attrStr += ` ${name}="${escapeHtml(val)}"`;
  }
  if (tagName === "a") attrStr += ' rel="noreferrer noopener"';
  return { next: i, html: `<${tagName}${attrStr}${selfClosing ? " />" : ">"}` };
}

/** Skip from `from` to just past the matching close tag, nesting-aware. */
function skipToCloseTag(src: string, from: number, tagName: string): number {
  const re = new RegExp(`</?${tagName}(?=[\\s/>])`, "gi");
  re.lastIndex = from;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = re.exec(src)) !== null) {
    if (match[0].charCodeAt(1) === 47) depth--;
    else depth++;
    if (depth === 0) {
      const end = src.indexOf(">", match.index);
      return end === -1 ? src.length : end + 1;
    }
  }
  return src.length;
}

/**
 * Sanitize a raw HTML string: allowlisted tags/attributes survive, everything
 * else degrades to escaped text (dangerous tags lose their content too).
 */
function sanitizeHtml(src: string): string {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf("<", i);
    if (lt === -1) {
      out += escapeHtml(src.slice(i));
      break;
    }
    out += escapeHtml(src.slice(i, lt));
    const token = parseHtmlToken(src, lt);
    if (!token) {
      out += "&lt;";
      i = lt + 1;
      continue;
    }
    if (!token.drop) out += token.html ?? "";
    i = token.next;
  }
  return out;
}

const HTML_PLACEHOLDER = "\u0001";

/**
 * Replace raw HTML fragments in `source` with placeholders, sanitizing each
 * fragment on the way in. Non-tag `<` sequences are left untouched.
 */
function stashRawHtml(source: string, frags: string[]): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const lt = source.indexOf("<", i);
    if (lt === -1) {
      out += source.slice(i);
      break;
    }
    out += source.slice(i, lt);
    const token = parseHtmlToken(source, lt);
    if (!token) {
      out += "<";
      i = lt + 1;
      continue;
    }
    if (!token.drop) {
      frags.push(token.html ?? "");
      out += `${HTML_PLACEHOLDER}${frags.length - 1}${HTML_PLACEHOLDER}`;
    }
    i = token.next;
  }
  return out;
}

/**
 * CommonMark: when a code span begins and ends with a space (and is not all
 * spaces), strip one space from each end.
 */
function stripCodeSpace(code: string): string {
  return code.length > 2 && code.startsWith(" ") && code.endsWith(" ") ? code.slice(1, -1) : code;
}

type TableAlign = "left" | "center" | "right" | null;

/**
 * Try to parse a GFM table starting at `lines[index]` (header row).
 * Like marked (the reference renderer), header/delimiter/body rows must start
 * with a pipe. Returns null when the lines do not form a table.
 */
function parseTable(
  lines: string[],
  index: number,
  refs: Map<string, string>,
): { html: string; nextIndex: number } | null {
  const headerLine = lines[index] ?? "";
  if (!/^ *\|/.test(headerLine)) return null;
  const delimiterLine = lines[index + 1] ?? "";
  if (!isTableDelimiter(delimiterLine)) return null;
  const headerCells = splitTableRow(headerLine);
  const delimiterCells = splitTableRow(delimiterLine);
  if (headerCells.length === 0 || headerCells.length !== delimiterCells.length) return null;
  const aligns = delimiterCells.map(parseTableAlign);
  const columns = headerCells.length;

  const bodyRows: string[][] = [];
  let nextIndex = index + 2;
  while (nextIndex < lines.length && /^ *\|/.test(lines[nextIndex] ?? "")) {
    const row = splitTableRow(lines[nextIndex] ?? "").slice(0, columns);
    while (row.length < columns) row.push("");
    bodyRows.push(row);
    nextIndex++;
  }
  return { html: renderTable(headerCells, aligns, bodyRows, refs), nextIndex: nextIndex - 1 };
}

function isTableDelimiter(line: string): boolean {
  if (!/^ *\|/.test(line)) return false;
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{1,}:?$/.test(cell));
}

function parseTableAlign(cell: string): TableAlign {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  if (left) return "left";
  return null;
}

/** Split a table row on unescaped pipes; `\|` stays inside the cell. */
function splitTableRow(row: string): string[] {
  const cells: string[] = [];
  let current = "";
  for (const character of row) {
    if (character === "|") {
      let backslashes = 0;
      for (let i = current.length - 1; i >= 0 && current[i] === "\\"; i--) backslashes++;
      if (backslashes % 2 === 1) {
        current = `${current.slice(0, -1)}|`;
      } else {
        cells.push(current);
        current = "";
      }
    } else {
      current += character;
    }
  }
  cells.push(current);
  // Drop the empty cells produced by leading/trailing pipes.
  if (cells.length > 0 && !(cells[0] ?? "").trim()) cells.shift();
  if (cells.length > 0 && !(cells[cells.length - 1] ?? "").trim()) cells.pop();
  return cells.map((cell) => cell.trim());
}

function renderTable(
  header: string[],
  aligns: TableAlign[],
  rows: string[][],
  refs: Map<string, string>,
): string {
  const cell = (tag: "th" | "td", content: string, align: TableAlign): string => {
    const attribute = align ? ` align="${align}"` : "";
    return `<${tag}${attribute}>${inlineMarkdown(content, refs)}</${tag}>`;
  };
  const thead = `<thead><tr>${header
    .map((content, i) => cell("th", content, aligns[i] ?? null))
    .join("")}</tr></thead>`;
  const tbody = rows.length
    ? `<tbody>${rows
        .map(
          (row) =>
            `<tr>${row.map((content, i) => cell("td", content, aligns[i] ?? null)).join("")}</tr>`,
        )
        .join("")}</tbody>`
    : "";
  return `<table>${thead}${tbody}</table>`;
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

function countWords(value: string): number {
  return value.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’-]*/gu)?.length ?? 0;
}
