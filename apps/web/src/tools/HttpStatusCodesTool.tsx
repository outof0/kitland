import { findHttpStatuses } from "@kitland/core";
import { Search } from "lucide-react";
import { useState } from "react";
export function HttpStatusCodesTool() {
  const [q, setQ] = useState("");
  const rows = findHttpStatuses(q);
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <Search />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">HTTP Status Codes</h2>
          <p className="tool-header__subtitle">Look up and filter HTTP response status codes.</p>
        </div>
      </div>
      <label className="block">
        <span className="sr-only">Search HTTP status codes</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search 404, Not Found, Server Error…"
          className="h-10 w-full rounded-[10px] border border-[var(--outline)] bg-[var(--surface)] px-3"
        />
      </label>
      <div className="mt-4 grid gap-2">
        {rows.map((s) => (
          <article
            key={s.code}
            className="flex gap-4 rounded-xl border border-[var(--outline)] bg-[var(--surface)] p-4"
          >
            <code className="font-semibold text-sky-300">{s.code}</code>
            <div>
              <h3 className="m-0 text-sm font-semibold">{s.name}</h3>
              <p className="m-0 text-xs text-[var(--on-muted)]">
                {s.category} · {s.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
