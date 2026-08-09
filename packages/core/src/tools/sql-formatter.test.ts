import { describe, expect, it } from "vitest";
import { formatSql } from "./sql-formatter";

describe("formatSql", () => {
  it("formats clauses and uppercases SQL keywords", () => {
    const result = formatSql("select id,name from users where active=true and role='admin';");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value).toContain("SELECT id,\nname");
    expect(result.value).toContain("FROM users");
    expect(result.value).toContain("WHERE active = true");
    expect(result.value).toContain("AND role = 'admin';");
  });

  it("does not alter quoted strings or comments", () => {
    const result = formatSql("select '-- from' as note /* keep from */ from logs");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value).toContain("'-- from'");
    expect(result.value).toContain("/* keep from */");
  });

  it("supports lowercase keywords and rejects empty input", () => {
    expect(formatSql(" ").ok).toBe(false);
    const result = formatSql("SELECT * FROM users", { keywordCase: "lower", indent: 4 });
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value).toContain("select *\nfrom users");
  });

  it("keeps multi-word joins together", () => {
    const result = formatSql("select u.id from users u left join profiles p on p.user_id=u.id;");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.value).toContain("LEFT JOIN profiles p");
  });
});
