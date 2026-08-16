import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { useJsonDiff } from "../hooks/useJsonDiff";
import { pickTextFile } from "../lib/clipboard";
import { beautifyCode, minifyCode } from "../lib/editor-tools";
import {
  createJsonDiffWorkflow,
  loadJsonDiffSample,
  setJsonDiffLeft,
  setJsonDiffMode,
  setJsonDiffRight,
  swapJsonDiffSides,
  type JsonDiffMode,
  type JsonDiffWorkflowState,
} from "../lib/json-diff-workflow";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import {
  diffText,
  JSON_DIFF_MAX_INPUT_CHARS,
  type JsonDiffEntry,
  type TextDiffLine,
} from "@kitland/core";
import {
  ArrowLeftRight,
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  FileCode,
  FileInput,
  Filter,
  FoldVertical,
  GitCompare,
  ListFilter,
  Trash2,
  UnfoldVertical,
  Upload,
} from "lucide-react";
import { IndentMenu } from "./json-formatter/IndentMenu";
import { HostCodeEditor } from "../components/HostCodeEditor";
import { useCallback, useId, useMemo, useState } from "react";

function validateJsonDoc(source: string): { ok: true } | { ok: false; message: string } {
  const trimmed = source.trim();
  if (!trimmed) return { ok: true };
  if (source.length > JSON_DIFF_MAX_INPUT_CHARS) {
    return {
      ok: false,
      message: `Input exceeds the ${JSON_DIFF_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    };
  }
  try {
    JSON.parse(source);
    return { ok: true };
  } catch {
    return { ok: false, message: "JSON is invalid." };
  }
}

function sortJsonKeys(val: unknown): unknown {
  if (val === null || typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(sortJsonKeys);
  const keys = Object.keys(val as Record<string, unknown>).sort();
  const res: Record<string, unknown> = {};
  for (const k of keys) {
    res[k] = sortJsonKeys((val as Record<string, unknown>)[k]);
  }
  return res;
}

function normalizeJson(source: string, indent: 2 | 4, sortKeys: boolean): string {
  try {
    const parsed = JSON.parse(source);
    const sorted = sortKeys ? sortJsonKeys(parsed) : parsed;
    return JSON.stringify(sorted, null, indent);
  } catch {
    return source;
  }
}

type SplitDiffRow = {
  id: string;
  left?: { lineNum: number; value: string; kind: "equal" | "removed" };
  right?: { lineNum: number; value: string; kind: "equal" | "added" };
};

function buildSplitRows(lines: readonly TextDiffLine[]): SplitDiffRow[] {
  const rows: SplitDiffRow[] = [];
  let i = 0;
  let rowId = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line) {
      i++;
      continue;
    }
    if (line.kind === "equal") {
      rows.push({
        id: `row-${rowId++}`,
        left: { lineNum: line.oldLine ?? 0, value: line.value, kind: "equal" },
        right: { lineNum: line.newLine ?? 0, value: line.value, kind: "equal" },
      });
      i++;
    } else if (line.kind === "removed") {
      const next = lines[i + 1];
      if (next && next.kind === "added") {
        rows.push({
          id: `row-${rowId++}`,
          left: {
            lineNum: line.oldLine ?? 0,
            value: line.value,
            kind: "removed",
          },
          right: {
            lineNum: next.newLine ?? 0,
            value: next.value,
            kind: "added",
          },
        });
        i += 2;
      } else {
        rows.push({
          id: `row-${rowId++}`,
          left: {
            lineNum: line.oldLine ?? 0,
            value: line.value,
            kind: "removed",
          },
        });
        i++;
      }
    } else if (line.kind === "added") {
      rows.push({
        id: `row-${rowId++}`,
        right: { lineNum: line.newLine ?? 0, value: line.value, kind: "added" },
      });
      i++;
    } else {
      i++;
    }
  }
  return rows;
}

const SAMPLE_LEFT = `{
  "name": "Ada",
  "age": 30,
  "active": true
}`;

const SAMPLE_RIGHT = `{
  "name": "Ada",
  "age": 31,
  "active": true,
  "status": "changed"
}`;

export type JsonDiffToolProps = {
  readonly capabilities?: ToolCapabilities;
};

export function JsonDiffTool({ capabilities = LOCAL_ONLY_CAPABILITIES }: JsonDiffToolProps = {}) {
  const headingId = useId();
  const leftId = useId();
  const rightId = useId();

  const [workflow, setWorkflow] = useState<JsonDiffWorkflowState>(() =>
    createJsonDiffWorkflow("", ""),
  );
  const [indent, setIndent] = useState<2 | 4>(2);
  const [ignoreKeyOrder, setIgnoreKeyOrder] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number>(0);
  const [compareView, setCompareView] = useState<"split" | "unified">("split");

  // Focus & Blur tracking for validation feedback (only show on blur / release, never while focused)
  const [leftFocused, setLeftFocused] = useState(false);
  const [leftBlurred, setLeftBlurred] = useState(false);
  const [rightFocused, setRightFocused] = useState(false);
  const [rightBlurred, setRightBlurred] = useState(false);

  const { isCopied, copy } = useCopyFeedback();

  const left = workflow.left.value;
  const right = workflow.right.value;
  const mode = workflow.mode;

  // Real-time validation checks
  const leftValidation = useMemo(() => validateJsonDoc(left), [left]);
  const rightValidation = useMemo(() => validateJsonDoc(right), [right]);

  const leftError = !leftValidation.ok ? leftValidation.message : null;
  const rightError = !rightValidation.ok ? rightValidation.message : null;

  const showLeftError = Boolean(leftError) && leftBlurred && !leftFocused;
  const showRightError = Boolean(rightError) && rightBlurred && !rightFocused;

  const bothNonEmpty = left.trim().length > 0 && right.trim().length > 0;
  const bothValid = leftValidation.ok && rightValidation.ok;
  const canEnterCompare = bothNonEmpty && bothValid;

  // In-place Beautify & Minify handlers
  const handleBeautifyLeft = useCallback(() => {
    if (!left.trim()) return;
    const formatted = beautifyCode(left, "json", indent);
    if (formatted !== null) {
      setWorkflow((cur) => setJsonDiffLeft(cur, formatted));
      setLeftBlurred(true);
    }
  }, [indent, left]);

  const handleMinifyLeft = useCallback(() => {
    if (!left.trim()) return;
    const minified = minifyCode(left, "json");
    if (minified !== null) {
      setWorkflow((cur) => setJsonDiffLeft(cur, minified));
      setLeftBlurred(true);
    }
  }, [left]);

  const handleBeautifyRight = useCallback(() => {
    if (!right.trim()) return;
    const formatted = beautifyCode(right, "json", indent);
    if (formatted !== null) {
      setWorkflow((cur) => setJsonDiffRight(cur, formatted));
      setRightBlurred(true);
    }
  }, [indent, right]);

  const handleMinifyRight = useCallback(() => {
    if (!right.trim()) return;
    const minified = minifyCode(right, "json");
    if (minified !== null) {
      setWorkflow((cur) => setJsonDiffRight(cur, minified));
      setRightBlurred(true);
    }
  }, [right]);

  // Prepared strings for diffing based on display options
  const preparedLeft = useMemo(
    () => normalizeJson(left, indent, ignoreKeyOrder),
    [left, indent, ignoreKeyOrder],
  );
  const preparedRight = useMemo(
    () => normalizeJson(right, indent, ignoreKeyOrder),
    [right, indent, ignoreKeyOrder],
  );

  // Hook handles structural JSON diffing (JSON Patch RFC 6902)
  const diffState = useJsonDiff(
    mode === "compare" ? preparedLeft : "",
    mode === "compare" ? preparedRight : "",
  );

  // Text diffing for visual split/unified code lines
  const textDiffResult = useMemo(() => {
    if (mode !== "compare") return null;
    return diffText(preparedLeft, preparedRight);
  }, [mode, preparedLeft, preparedRight]);

  const splitRows = useMemo(() => {
    if (!textDiffResult || !textDiffResult.ok) return [];
    return buildSplitRows(textDiffResult.value.lines);
  }, [textDiffResult]);

  const isProcessing = diffState.isProcessing;
  const comparison = diffState.result.ok ? diffState.result.value : null;
  const comparisonError = !diffState.result.ok ? diffState.result.error.message : null;

  const totalDiffs = comparison?.summary.total ?? 0;
  const addedCount = comparison?.summary.added ?? 0;
  const removedCount = comparison?.summary.removed ?? 0;
  const changedCount = comparison?.summary.changed ?? 0;

  // Filtered diff entries
  const visibleEntries: readonly JsonDiffEntry[] = useMemo(() => {
    return comparison?.entries ?? [];
  }, [comparison]);

  // Action Handlers
  const handleSample = useCallback(() => {
    setWorkflow((cur) => loadJsonDiffSample(cur, SAMPLE_LEFT, SAMPLE_RIGHT));
    setLeftBlurred(true);
    setRightBlurred(true);
  }, []);

  const handleSwap = useCallback(() => {
    setWorkflow((cur) => swapJsonDiffSides(cur));
    setLeftBlurred(true);
    setRightBlurred(true);
  }, []);

  const onModeChange = useCallback(
    (nextMode: JsonDiffMode) => {
      if (nextMode === "compare" && !canEnterCompare) return;
      setWorkflow((cur) => setJsonDiffMode(cur, nextMode));
    },
    [canEnterCompare],
  );

  const handleUploadFile = useCallback(async (side: "left" | "right") => {
    const res = await pickTextFile({
      accept: ".json,.txt",
      maxChars: JSON_DIFF_MAX_INPUT_CHARS,
    });
    if (res.ok) {
      setWorkflow((cur) =>
        side === "left" ? setJsonDiffLeft(cur, res.text) : setJsonDiffRight(cur, res.text),
      );
      if (side === "left") setLeftBlurred(true);
      if (side === "right") setRightBlurred(true);
    }
  }, []);

  const resultText = useMemo(() => {
    if (!comparison) return "";
    return JSON.stringify(comparison.entries, null, 2);
  }, [comparison]);

  const diffAsText = useMemo(() => {
    if (!textDiffResult || !textDiffResult.ok) return "";
    return textDiffResult.value.lines
      .map((l) => `${l.kind === "added" ? "+" : l.kind === "removed" ? "-" : " "} ${l.value}`)
      .join("\n");
  }, [textDiffResult]);

  const displayedUnifiedLines = useMemo(() => {
    if (!textDiffResult || !textDiffResult.ok) return [];
    if (!onlyChanges) return textDiffResult.value.lines;
    return textDiffResult.value.lines.filter((l) => l.kind !== "equal");
  }, [textDiffResult, onlyChanges]);

  const displayedSplitRows = useMemo(() => {
    if (!onlyChanges) return splitRows;
    return splitRows.filter((r) => r.left?.kind !== "equal" || r.right?.kind !== "equal");
  }, [splitRows, onlyChanges]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3.5">
          <div
            className="w-[44px] h-[44px] bg-primary-soft border border-primary/30 rounded-[11px] text-primary flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            <GitCompare className="size-[22px]" />
          </div>
          <div>
            <h2
              id={headingId}
              className="text-[20px] font-bold font-display text-on-surface tracking-[-0.02em] m-0"
            >
              JSON Diff & Compare
            </h2>
            <p className="text-[13px] text-on-muted m-0 mt-0.5 max-sm:hidden">
              Compare and find differences between two JSON structures locally in your browser.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSample}
            className="h-[34px] px-[12px] bg-surface-low border border-outline rounded-[8px] text-[13px] font-semibold text-on-surface hover:bg-surface hover:border-outline-strong transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileInput className="size-[15px] text-on-muted" />
            <span>Sample</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher & Options Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 min-h-[40px] px-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Editor vs Compare Tab Segment */}
          <div className="h-[32px] flex items-center gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            <button
              type="button"
              aria-pressed={mode === "editor"}
              onClick={() => onModeChange("editor")}
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
                mode === "editor" ? "text-primary" : "text-on-muted hover:text-on-surface"
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              aria-pressed={mode === "compare"}
              onClick={() => onModeChange("compare")}
              disabled={!canEnterCompare}
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                mode === "compare" ? "text-primary" : "text-on-muted hover:text-on-surface"
              }`}
            >
              <span>Compare</span>
              {comparison && <span className="size-1.5 rounded-full bg-primary" />}
            </button>
          </div>

          {/* Indent selector */}
          <IndentMenu value={indent} onChange={setIndent} triggerLabel="Indent" />

          {/* Compare-only filter toggles */}
          {mode === "compare" && (
            <>
              <button
                type="button"
                onClick={() => setIgnoreKeyOrder((v) => !v)}
                className={`h-[30px] px-[9px] rounded-[7px] text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  ignoreKeyOrder
                    ? "text-primary border-outline"
                    : "text-on-muted border-outline hover:text-on-surface"
                }`}
              >
                <ListFilter className="size-[13px]" />
                <span>Ignore key order</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyChanges((v) => !v)}
                className={`h-[30px] px-[9px] rounded-[7px] text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  onlyChanges
                    ? "text-primary border-outline"
                    : "text-on-muted border-outline hover:text-on-surface"
                }`}
              >
                <Filter className="size-[13px]" />
                <span>Only changes</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Mode View */}
      {mode === "editor" ? (
        /* Edit Mode: 3-Column Split with Center Compare & Swap Rail */
        <div className="tool-editor-stage flex min-h-0 min-w-0 flex-1 gap-3.5 overflow-hidden max-lg:flex-col max-lg:overflow-y-auto">
          {/* Left Card: Before JSON */}
          <JsonEditorCard
            label="Before JSON"
            dotColor="bg-primary"
            id={leftId}
            value={left}
            error={showLeftError ? leftError : null}
            onFocus={() => setLeftFocused(true)}
            onBlur={() => {
              setLeftFocused(false);
              setLeftBlurred(true);
            }}
            onBeautify={handleBeautifyLeft}
            onMinify={handleMinifyLeft}
            onChange={(val) => setWorkflow((cur) => setJsonDiffLeft(cur, val))}
            onClear={() => {
              setLeftBlurred(false);
              setWorkflow((cur) => setJsonDiffLeft(cur, ""));
            }}
            onCopy={() => void copy("left", left)}
            copied={isCopied("left")}
            onUpload={capabilities.fileOpen ? () => void handleUploadFile("left") : undefined}
          />

          {/* Center Action Rail with Swap & Compare Action */}
          <div className="flex min-h-0 min-w-0 w-[68px] flex-col items-center justify-center gap-2 select-none self-center max-lg:my-2 max-lg:flex-row max-lg:w-full">
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                className="size-[40px] rounded-[10px] bg-surface-low border border-outline text-on-muted hover:text-on-surface hover:border-primary hover:bg-surface flex items-center justify-center transition-colors cursor-pointer"
                onClick={handleSwap}
                aria-label="Swap Left and Right"
                title="Swap Left and Right"
              >
                <ArrowLeftRight className="size-[16px]" />
              </button>
              <span className="text-[9px] font-medium text-on-muted text-center max-lg:hidden">
                Swap
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                className="size-[40px] rounded-[10px] bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:bg-surface-low disabled:text-on-muted disabled:border disabled:border-outline"
                onClick={() => onModeChange("compare")}
                disabled={!canEnterCompare}
                aria-label="Compare documents"
                title="Compare documents"
              >
                <GitCompare className="size-[16px]" />
              </button>
              <span className="text-[9px] font-medium text-on-muted text-center max-lg:hidden">
                Compare
              </span>
            </div>
          </div>

          {/* Right Card: After JSON */}
          <JsonEditorCard
            label="After JSON"
            dotColor="bg-primary"
            id={rightId}
            value={right}
            error={showRightError ? rightError : null}
            onFocus={() => setRightFocused(true)}
            onBlur={() => {
              setRightFocused(false);
              setRightBlurred(true);
            }}
            onBeautify={handleBeautifyRight}
            onMinify={handleMinifyRight}
            onChange={(val) => setWorkflow((cur) => setJsonDiffRight(cur, val))}
            onClear={() => {
              setRightBlurred(false);
              setWorkflow((cur) => setJsonDiffRight(cur, ""));
            }}
            onCopy={() => void copy("right", right)}
            copied={isCopied("right")}
            onUpload={capabilities.fileOpen ? () => void handleUploadFile("right") : undefined}
          />
        </div>
      ) : (
        /* Compare View */
        <div className="tool-editor-stage flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          {/* Compare Toolbar */}
          <div className="h-[38px] flex items-center justify-between px-1 shrink-0">
            <div className="flex items-center gap-2.5 font-mono text-[11.5px]">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-primary-soft text-primary font-semibold border border-primary/30">
                <GitCompare className="size-[14px]" />
                <span>
                  {totalDiffs} {totalDiffs === 1 ? "difference" : "differences"}
                </span>
              </div>
              {visibleEntries.length > 0 && (
                <span className="text-on-muted text-[11px] max-sm:hidden">
                  Selected:{" "}
                  <code className="text-on-surface font-bold">
                    {visibleEntries[selectedEntryIndex]?.path || "/"}
                  </code>
                </span>
              )}
            </div>

            {/* Split vs Unified view switch + Edit inputs button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onModeChange("editor")}
                className="h-[30px] px-2.5 rounded-[7px] bg-surface-low border border-outline text-[12px] font-semibold text-on-surface hover:bg-surface transition-colors flex items-center gap-1.5 cursor-pointer"
                aria-label="Edit inputs"
                title="Edit inputs"
              >
                <FileCode className="size-3.5 text-on-muted" />
                <span>Edit inputs</span>
              </button>
              <div className="flex items-center gap-1 bg-surface-low border border-outline rounded-[8px] p-[2px]">
                <button
                  type="button"
                  onClick={() => setCompareView("split")}
                  className={`h-[24px] px-2.5 rounded-[5px] text-[11px] font-semibold transition-colors cursor-pointer ${
                    compareView === "split" ? "text-primary" : "text-on-muted hover:text-on-surface"
                  }`}
                >
                  Split
                </button>
                <button
                  type="button"
                  onClick={() => setCompareView("unified")}
                  className={`h-[24px] px-2.5 rounded-[5px] text-[11px] font-semibold transition-colors cursor-pointer ${
                    compareView === "unified"
                      ? "text-primary"
                      : "text-on-muted hover:text-on-surface"
                  }`}
                >
                  Unified
                </button>
              </div>
            </div>
          </div>

          {/* Compare Visualizer (3-pane split / unified) */}
          <div className="flex-1 bg-surface border border-outline rounded-[12px] overflow-hidden flex flex-col min-h-0">
            {/* Diff Header */}
            <div className="h-[42px] bg-surface-low border-b border-outline px-4 flex items-center justify-between shrink-0 font-ui text-[12px]">
              <div className="flex items-center gap-4">
                <span className="font-bold text-on-surface">Differences</span>
                {totalDiffs > 0 && (
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-success-soft text-success border border-success/20">
                      +{addedCount} added
                    </span>
                    <span className="px-2 py-0.5 rounded bg-danger-soft text-danger border border-danger/20">
                      −{removedCount} removed
                    </span>
                    <span className="px-2 py-0.5 rounded bg-primary-soft text-primary border border-primary/20">
                      ~{changedCount} modified
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* List of JSON differences accessible to screen readers and automated tests */}
            {visibleEntries.length > 0 && (
              <ul
                aria-label="JSON differences"
                className="bg-surface-low/30 border-b border-outline px-4 py-2 flex flex-col gap-1 text-[12px] font-mono divide-y divide-outline/10"
              >
                {visibleEntries.map((entry: JsonDiffEntry, idx: number) => {
                  let desc = "";
                  if (entry.operation === "added") {
                    desc = `${entry.path || "/"} — added: ${JSON.stringify(entry.after)}`;
                  } else if (entry.operation === "removed") {
                    desc = `${entry.path || "/"} — removed: ${JSON.stringify(entry.before)}`;
                  } else {
                    desc = `${entry.path || "/"} — changed: ${JSON.stringify(entry.before)} → ${JSON.stringify(entry.after)}`;
                  }
                  return (
                    <li
                      key={`diff-entry-${idx}`}
                      className="pt-1 text-on-surface flex items-center gap-2"
                    >
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          entry.operation === "added"
                            ? "bg-success-soft text-success"
                            : entry.operation === "removed"
                              ? "bg-danger-soft text-danger"
                              : "bg-primary-soft text-primary"
                        }`}
                      >
                        {entry.operation}
                      </span>
                      <span>{desc}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Structural Path Change Pills (if changes exist) */}
            {visibleEntries.length > 0 && (
              <div className="bg-surface-low/60 border-b border-outline/50 px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 font-mono text-[11px]">
                <span className="text-on-muted text-[10.5px] shrink-0 mr-1 font-sans">Paths:</span>
                {visibleEntries.map((entry: JsonDiffEntry, idx: number) => {
                  const isSelected = idx === selectedEntryIndex;
                  const isAdd = entry.operation === "added";
                  const isRem = entry.operation === "removed";
                  return (
                    <button
                      key={`${entry.path}-${entry.operation}-${idx}`}
                      type="button"
                      onClick={() => setSelectedEntryIndex(idx)}
                      className={`h-[24px] px-2 rounded-[5px] shrink-0 flex items-center gap-1 transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : isAdd
                            ? "bg-success-soft/60 text-success border-success/30 hover:bg-success-soft"
                            : isRem
                              ? "bg-danger-soft/60 text-danger border-danger/30 hover:bg-danger-soft"
                              : "bg-surface text-on-surface border-outline hover:border-primary/40"
                      }`}
                    >
                      <span className="font-bold">{isAdd ? "+" : isRem ? "−" : "~"}</span>
                      <span>{entry.path || "/"}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Diff Body Content */}
            <div className="flex-1 overflow-auto font-mono text-[12px] leading-[20px] bg-surface">
              {isProcessing ? (
                <div className="flex items-center justify-center p-16 text-on-muted">
                  Comparing documents…
                </div>
              ) : comparisonError ? (
                <div className="m-4 p-4 bg-danger-soft border border-danger/30 rounded-lg text-danger">
                  {comparisonError}
                </div>
              ) : totalDiffs === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="size-12 rounded-full bg-success-soft text-success flex items-center justify-center mb-3">
                    <Check className="size-6" />
                  </div>
                  <h3 className="text-on-surface font-semibold text-[15px] mb-1 font-ui">
                    No Differences Found
                  </h3>
                  <p className="text-on-muted text-[13px] max-w-sm font-ui">
                    Both JSON structures contain identical keys, values, and types.
                  </p>
                </div>
              ) : compareView === "unified" ? (
                /* Unified Line-by-Line Code Diff */
                <div className="divide-y divide-outline/20">
                  {displayedUnifiedLines.map((line, idx) => {
                    const isAdd = line.kind === "added";
                    const isRem = line.kind === "removed";
                    return (
                      <div
                        key={`unified-${idx}`}
                        className={`flex items-start px-2 py-0.5 transition-colors ${
                          isAdd
                            ? "bg-success-soft/25 text-success"
                            : isRem
                              ? "bg-danger-soft/25 text-danger"
                              : "text-on-surface hover:bg-surface-low"
                        }`}
                      >
                        <span className="w-[44px] shrink-0 text-right pr-2 text-on-muted select-none">
                          {line.newLine ?? line.oldLine ?? ""}
                        </span>
                        <span className="w-4 shrink-0 text-center font-bold select-none">
                          {isAdd ? "+" : isRem ? "−" : " "}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-all">{line.value}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Split Side-by-Side Code Diff */
                <div className="grid grid-cols-2 divide-x divide-outline min-h-full">
                  <div className="overflow-auto divide-y divide-outline/20">
                    {displayedSplitRows.map((row) => (
                      <div
                        key={`left-${row.id}`}
                        className={`flex items-start px-2 py-0.5 ${
                          row.left?.kind === "removed"
                            ? "bg-danger-soft/25 text-danger"
                            : "text-on-surface"
                        }`}
                      >
                        <span className="w-[36px] shrink-0 text-right pr-2 text-on-muted select-none text-[11px]">
                          {row.left?.lineNum ?? ""}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-all">
                          {row.left?.value ?? ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-auto divide-y divide-outline/20">
                    {displayedSplitRows.map((row) => (
                      <div
                        key={`right-${row.id}`}
                        className={`flex items-start px-2 py-0.5 ${
                          row.right?.kind === "added"
                            ? "bg-success-soft/25 text-success"
                            : "text-on-surface"
                        }`}
                      >
                        <span className="w-[36px] shrink-0 text-right pr-2 text-on-muted select-none text-[11px]">
                          {row.right?.lineNum ?? ""}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-all">
                          {row.right?.value ?? ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="h-[44px] bg-surface-low border-t border-outline px-4 flex items-center justify-between shrink-0 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-on-muted">
                <CircleCheck className="size-3.5 text-success" />
                <span>
                  {comparison ? `${comparison.summary.total} structural nodes checked` : "Ready"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onModeChange("editor")}
                  className="h-[30px] px-3 bg-surface border border-outline rounded-[7px] font-semibold text-on-surface hover:bg-surface-high transition-colors cursor-pointer"
                >
                  Back to edit
                </button>
                {diffAsText && (
                  <button
                    type="button"
                    onClick={() => void copy("diff_text", diffAsText)}
                    className={`h-[30px] px-3 rounded-[7px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isCopied("diff_text")
                        ? "bg-success-soft text-success border border-success/40"
                        : "bg-surface border border-outline text-on-surface hover:bg-surface-high"
                    }`}
                  >
                    {isCopied("diff_text") ? (
                      <Check className="size-3.5 text-success" />
                    ) : (
                      <Copy className="size-3.5 text-on-muted" />
                    )}
                    <span>{isCopied("diff_text") ? "Copied" : "Copy diff text"}</span>
                  </button>
                )}
                {resultText && (
                  <button
                    type="button"
                    onClick={() => void copy("diff_json", resultText)}
                    className={`h-[30px] px-3 rounded-[7px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isCopied("diff_json")
                        ? "bg-success-soft text-success border border-success/40"
                        : "bg-surface border border-outline text-on-surface hover:bg-surface-high"
                    }`}
                  >
                    {isCopied("diff_json") ? (
                      <Check className="size-3.5 text-success" />
                    ) : (
                      <Copy className="size-3.5 text-on-muted" />
                    )}
                    <span>{isCopied("diff_json") ? "Copied" : "Copy diff JSON"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="h-[36px] bg-surface-low border border-outline rounded-[8px] px-3.5 flex items-center justify-between text-[12px] shrink-0 font-ui">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {showLeftError ? (
              <>
                <CircleAlert className="size-3.5 text-danger" />
                <span>Invalid Before JSON</span>
              </>
            ) : showRightError ? (
              <>
                <CircleAlert className="size-3.5 text-danger" />
                <span>Invalid After JSON</span>
              </>
            ) : bothNonEmpty && bothValid ? (
              <>
                <CircleCheck className="size-3.5 text-success" />
                <span>Valid JSON</span>
              </>
            ) : (
              <span>Waiting for input</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-on-muted max-sm:hidden">
            {mode === "compare" && comparison ? (
              <>
                <span>{changedCount} modified</span>
                <span>· {addedCount} added</span>
                <span>· {removedCount} removed</span>
              </>
            ) : (
              <>
                <span>Left: {left.length} chars</span>
                <span>· Right: {right.length} chars</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-[28px] px-2.5 bg-surface border border-outline rounded-[6px] flex items-center gap-1.5 text-[11px] font-bold text-primary">
            <FileCode className="size-3.5 text-primary" />
            <span>JSON</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function JsonEditorCard({
  label,
  dotColor,
  id,
  value,
  onChange,
  onFocus,
  onBlur,
  onBeautify,
  onMinify,
  onClear,
  onCopy,
  copied,
  onUpload,
  error,
}: {
  label: string;
  dotColor: string;
  id: string;
  value: string;
  error?: string | null | undefined;
  onFocus?: (() => void) | undefined;
  onBlur?: (() => void) | undefined;
  onBeautify?: (() => void) | undefined;
  onMinify?: (() => void) | undefined;
  onChange: (value: string) => void;
  onClear: () => void;
  onCopy: () => void;
  copied: boolean;
  onUpload?: (() => void) | undefined;
}) {
  return (
    <div
      className={`flex min-h-0 min-w-0 flex-1 flex-col bg-surface border ${
        error ? "border-danger/40" : "border-outline"
      } rounded-[12px] overflow-hidden focus-within:${
        error ? "border-danger ring-danger/30" : "border-primary ring-primary/30"
      } focus-within:ring-1 transition-all max-lg:min-h-72 max-lg:flex-none`}
    >
      {/* Header */}
      <div className="h-[46px] bg-surface-low border-b border-outline px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${dotColor}`} />
          <label
            htmlFor={id}
            className="text-[12px] font-bold tracking-[0.4px] text-on-surface cursor-pointer"
          >
            {label}
          </label>
        </div>
        <div className="flex items-center gap-1">
          {onBeautify && (
            <button
              type="button"
              onClick={onBeautify}
              disabled={!value}
              title={`Beautify ${label} in place`}
              aria-label={`Beautify ${label}`}
              className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <UnfoldVertical className="size-4" />
            </button>
          )}
          {onMinify && (
            <button
              type="button"
              onClick={onMinify}
              disabled={!value}
              title={`Minify ${label} in place`}
              aria-label={`Minify ${label}`}
              className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FoldVertical className="size-4" />
            </button>
          )}
          <div className="w-[1px] h-[16px] bg-outline mx-0.5" />
          <button
            type="button"
            onClick={onCopy}
            disabled={!value}
            title={copied ? "Copied" : "Copy"}
            aria-label={copied ? "Copied" : "Copy"}
            className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              copied
                ? "bg-success-soft text-success border border-success/40"
                : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
            }`}
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </button>
          {onUpload && (
            <button
              type="button"
              onClick={onUpload}
              title="Upload JSON"
              aria-label="Upload JSON"
              className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer"
            >
              <Upload className="size-4" />
            </button>
          )}
          <div className="w-[1px] h-[16px] bg-outline mx-0.5" />
          <button
            type="button"
            onClick={onClear}
            disabled={!value}
            title="Clear"
            aria-label="Clear"
            className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden bg-transparent">
        <HostCodeEditor
          id={id}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          language="json"
          placeholder='{"key": "value"}'
          ariaLabel={label}
          ariaInvalid={error ? true : undefined}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="m-0 shrink-0 border-t border-danger/30 bg-danger-soft px-3.5 py-2 text-[11px] text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
