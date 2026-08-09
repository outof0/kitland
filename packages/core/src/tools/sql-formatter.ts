import { err, ok, type ToolResult } from "../result";

export const SQL_FORMATTER_MAX_INPUT_CHARS = 500_000;
export const SQL_FORMATTER_MAX_OUTPUT_CHARS = 1_000_000;

export type SqlFormatOptions = {
  readonly indent?: 2 | 4;
  readonly keywordCase?: "upper" | "lower";
};

const CLAUSE_START = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP",
  "ORDER",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "UNION",
  "RETURNING",
  "VALUES",
]);
const JOIN_PREFIXES = new Set(["JOIN", "INNER", "LEFT", "RIGHT", "FULL", "CROSS"]);
const LOGICAL = new Set(["AND", "OR"]);
const KEYWORDS = new Set([
  ...CLAUSE_START,
  ...JOIN_PREFIXES,
  ...LOGICAL,
  "ON",
  "AS",
  "DISTINCT",
  "INSERT",
  "INTO",
  "UPDATE",
  "DELETE",
  "SET",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "ASC",
  "DESC",
  "NULLS",
  "FIRST",
  "LAST",
  "WITH",
]);

/** Format common SQL while preserving literals, quoted identifiers, and comments. */
export function formatSql(source: string, options: SqlFormatOptions = {}): ToolResult<string> {
  if (source.length > SQL_FORMATTER_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `SQL input exceeds the ${SQL_FORMATTER_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }
  if (!source.trim()) return err("EMPTY_INPUT", "Enter a SQL query to format.");

  const tokens = tokenize(source);
  const indentSize = options.indent ?? 2;
  const keywordCase = options.keywordCase ?? "upper";
  const lines: string[] = [];
  let current = "";
  let depth = 0;
  let afterClause = false;

  const flush = () => {
    const value = current.trim();
    if (value) lines.push(`${" ".repeat(Math.max(0, depth) * indentSize)}${value}`);
    current = "";
  };
  const append = (value: string, spaced = true) => {
    if (!current) current = value;
    else current += spaced ? ` ${value}` : value;
  };

  for (const token of tokens) {
    const upper = token.value.toUpperCase();
    if (token.kind === "comment") {
      flush();
      lines.push(`${" ".repeat(depth * indentSize)}${token.value.trim()}`);
      continue;
    }
    if (token.kind === "word" && KEYWORDS.has(upper)) {
      const value = keywordCase === "lower" ? upper.toLowerCase() : upper;
      if (upper === "JOIN") {
        if (current && !/\b(?:INNER|LEFT|RIGHT|FULL|CROSS)$/iu.test(current)) flush();
        append(value);
        continue;
      }
      if (["INNER", "LEFT", "RIGHT", "FULL", "CROSS"].includes(upper)) {
        flush();
        append(value);
        continue;
      }
      if (CLAUSE_START.has(upper) || (upper === "JOIN" && current) || JOIN_PREFIXES.has(upper)) {
        if (upper === "GROUP" || upper === "ORDER") {
          flush();
          append(value);
          afterClause = true;
        } else if (upper === "BY" && afterClause) {
          append(value);
          afterClause = false;
        } else {
          flush();
          append(value);
          afterClause = false;
        }
      } else if (LOGICAL.has(upper)) {
        flush();
        append(value);
      } else {
        append(value);
      }
      continue;
    }
    if (token.value === "(") {
      append("(", false);
      depth += 1;
      continue;
    }
    if (token.value === ")") {
      depth = Math.max(0, depth - 1);
      current = current.trimEnd();
      append(")", false);
      continue;
    }
    if (token.value === ",") {
      current = `${current.trimEnd()},`;
      if (depth === 0) flush();
      continue;
    }
    if (token.value === ";") {
      current = `${current.trimEnd()};`;
      flush();
      continue;
    }
    append(token.value, ![".", "::"].includes(token.value));
  }
  flush();
  const output = lines.join("\n");
  if (output.length > SQL_FORMATTER_MAX_OUTPUT_CHARS) {
    return err("OUTPUT_TOO_LARGE", "Formatted SQL exceeds the output size limit.");
  }
  return ok(output);
}

type Token = { kind: "word" | "symbol" | "comment"; value: string };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const character = source[index] ?? "";
    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }
    if (source.startsWith("--", index)) {
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? source.length : end;
      tokens.push({ kind: "comment", value: source.slice(index, stop) });
      index = stop;
      continue;
    }
    if (source.startsWith("/*", index)) {
      const end = source.indexOf("*/", index + 2);
      const stop = end === -1 ? source.length : end + 2;
      tokens.push({ kind: "comment", value: source.slice(index, stop) });
      index = stop;
      continue;
    }
    if (["'", '"', "`"].includes(character)) {
      const quote = character;
      let end = index + 1;
      while (end < source.length) {
        if (source[end] === quote && source[end + 1] === quote) {
          end += 2;
          continue;
        }
        if (source[end] === quote) {
          end += 1;
          break;
        }
        end += 1;
      }
      tokens.push({ kind: "word", value: source.slice(index, end) });
      index = end;
      continue;
    }
    const match = /^[\p{L}\p{N}_$]+/u.exec(source.slice(index));
    if (match) {
      tokens.push({ kind: "word", value: match[0] });
      index += match[0].length;
      continue;
    }
    const operator = source.slice(index, index + 2);
    if (["::", "<=", ">=", "!=", "<>", "||"].includes(operator)) {
      tokens.push({ kind: "symbol", value: operator });
      index += 2;
    } else {
      tokens.push({ kind: "symbol", value: character });
      index += 1;
    }
  }
  return tokens;
}
