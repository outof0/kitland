/**
 * Best-effort JSON repair: strip comments, trailing commas, unquoted keys,
 * and single-quoted strings so common hand-edited or copy-pasted fragments
 * become parseable JSON again. Never silently corrupts valid input — only a
 * text transformation is applied, then the result must parse.
 */
export function repairJson(source: string): string | null {
  const cleaned = repairJsonText(source);
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    return null;
  }
}

function repairJsonText(source: string): string {
  let out = "";
  let mode: "plain" | "double" | "single" = "plain";
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1] ?? "";

    if (mode !== "plain") {
      if (character === "\\") {
        if (mode === "single" && next === "'") {
          // `\'` is not a valid JSON escape; the apostrophe survives unescaped.
          out += "'";
          index += 2;
          continue;
        }
        out += character + next;
        index += 2;
        continue;
      }
      if (mode === "single" && character === "'") {
        out += '"';
        mode = "plain";
        index += 1;
        continue;
      }
      if (mode === "double" && character === '"') {
        mode = "plain";
      }
      out += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      mode = "double";
      out += character;
      index += 1;
      continue;
    }
    if (character === "'") {
      mode = "single";
      out += '"';
      index += 1;
      continue;
    }
    if (character === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      if (index < source.length) index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? source.length : end + 2;
      continue;
    }
    if (character === ",") {
      let cursor = index + 1;
      while (cursor < source.length && /\s/.test(source[cursor] ?? "")) cursor += 1;
      if (source[cursor] === "}" || source[cursor] === "]") {
        index += 1;
        while (index < source.length && /\s/.test(source[index] ?? "")) index += 1;
        continue;
      }
    }
    out += character;
    index += 1;
  }

  return out.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$-]*)(\s*:)/g, '$1"$2"$3');
}
