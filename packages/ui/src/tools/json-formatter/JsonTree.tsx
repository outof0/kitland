import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronsDownUp } from "lucide-react";
import type { JsonValue } from "./types";

const MAX_TREE_ROWS = 500;

type TreeRow =
  | {
      kind: "container";
      key: string;
      path: string;
      child: JsonValue;
      depth: number;
      collapsed: boolean;
    }
  | { kind: "leaf"; key: string; child: JsonValue; depth: number; path: string };

/** Read-only outline of a parsed JSON document with collapsible containers. */
export function TreePane({
  value,
  totalValues,
  sizeLabel,
}: {
  value: JsonValue;
  totalValues: number;
  sizeLabel: string;
}) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [rootCollapsed, setRootCollapsed] = useState(false);
  const rootIsArray = Array.isArray(value);
  const rows = useMemo(() => {
    const budget = { count: 0 };
    return collectTreeRows(value, 0, "root", collapsed, budget);
  }, [collapsed, value]);
  const remaining = Math.max(0, totalValues - 1 - rows.length);
  const rootMeta = rootIsArray
    ? `${(value as JsonValue[]).length} item${(value as JsonValue[]).length === 1 ? "" : "s"}`
    : `${Object.keys(value as object).length} key${
        Object.keys(value as object).length === 1 ? "" : "s"
      }`;

  const toggle = (path: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const collapseAll = () => {
    setRootCollapsed(true);
    setCollapsed((current) => {
      const next = new Set(current);
      for (const row of rows) {
        if (row.kind === "container") next.add(row.path);
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-3.5 pl-0">
      <div className="flex min-h-0 flex-col">
        <div className="flex h-5 shrink-0 items-center gap-2 rounded-md bg-bg-elevated px-2">
          <button
            type="button"
            aria-expanded={!rootCollapsed}
            aria-label={rootIsArray ? "Toggle root array" : "Toggle root object"}
            onClick={() => setRootCollapsed((current) => !current)}
            className="shrink-0 text-on-muted hover:text-on-surface cursor-pointer"
          >
            {rootCollapsed ? (
              <ChevronRight className="size-[13px]" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-[13px]" aria-hidden="true" />
            )}
          </button>
          <span className="font-mono text-[12.5px] leading-[1.5] text-code-key">
            {rootIsArray ? "[ root" : "{ root"}
          </span>
          <span className="text-[10px] font-medium tracking-[0.3px] text-on-faint">{rootMeta}</span>
          <span className="text-[10px] font-medium tracking-[0.3px] text-on-faint">
            {sizeLabel}
          </span>
          <button
            type="button"
            onClick={collapseAll}
            aria-label="Collapse all"
            title="Collapse all"
            className="shrink-0 text-on-faint hover:text-on-muted cursor-pointer"
          >
            <ChevronsDownUp className="size-[13px]" aria-hidden="true" />
          </button>
        </div>
        {rootCollapsed ? null : (
          <>
            {rows.map((row) =>
              row.kind === "container" ? (
                <button
                  key={row.path}
                  type="button"
                  aria-expanded={!row.collapsed}
                  aria-label={`${row.collapsed ? "Expand" : "Collapse"} ${row.key}`}
                  onClick={() => toggle(row.path)}
                  className="flex h-5 w-full shrink-0 items-center gap-2 px-2 text-left font-mono text-[12.5px] leading-[1.5] hover:bg-surface-low cursor-pointer"
                  style={{ paddingLeft: 8 + row.depth * 22 }}
                >
                  {row.collapsed ? (
                    <ChevronRight
                      className="size-[13px] shrink-0 text-on-faint"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDown
                      className="size-[13px] shrink-0 text-on-faint"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-code-key">{row.key}</span>
                  <span className="text-code-punct">:</span>
                  <span className="text-code-punct">
                    {Array.isArray(row.child)
                      ? `[ ${row.child.length} ]`
                      : `{ ${Object.keys(row.child as object).length} }`}
                  </span>
                </button>
              ) : (
                <div
                  key={row.path}
                  className="flex h-5 w-full shrink-0 items-center gap-2 px-2 font-mono text-[12.5px] leading-[1.5]"
                  style={{ paddingLeft: 8 + row.depth * 22 }}
                >
                  <span className="size-[13px] shrink-0" aria-hidden="true" />
                  <span className="text-code-key">{row.key}</span>
                  <span className="text-code-punct">:</span>
                  <span className={leafClass(row.child)}>{leafText(row.child)}</span>
                </div>
              ),
            )}
            {remaining > 0 ? (
              <div className="flex h-5 shrink-0 items-center gap-2 pl-[52px] font-mono text-[12.5px] leading-[1.5] text-on-faint">
                … {remaining.toLocaleString()} more values
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function collectTreeRows(
  value: JsonValue,
  depth: number,
  path: string,
  collapsed: ReadonlySet<string>,
  budget: { count: number },
): TreeRow[] {
  if (budget.count >= MAX_TREE_ROWS) return [];
  const rows: TreeRow[] = [];
  const entries: ReadonlyArray<readonly [string, JsonValue]> = Array.isArray(value)
    ? value.map((child, index) => [String(index), child] as const)
    : Object.entries(value as Record<string, JsonValue>);
  for (const [key, child] of entries) {
    if (budget.count >= MAX_TREE_ROWS) break;
    budget.count += 1;
    const childPath = `${path}.${key}`;
    if (child !== null && typeof child === "object") {
      const isCollapsed = collapsed.has(childPath);
      rows.push({
        kind: "container",
        key,
        path: childPath,
        child: child as JsonValue,
        depth,
        collapsed: isCollapsed,
      });
      if (!isCollapsed) {
        rows.push(...collectTreeRows(child as JsonValue, depth + 1, childPath, collapsed, budget));
      }
    } else {
      rows.push({ kind: "leaf", key, child, depth, path: childPath });
    }
  }
  return rows;
}

function leafClass(value: JsonValue): string {
  if (typeof value === "string") return "text-code-string";
  if (typeof value === "number") return "text-code-number";
  return "text-code-key";
}

function leafText(value: JsonValue): string {
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}
