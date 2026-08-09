import { err, ok, type ToolResult } from "../result";

/** JSON values accepted by the structural diff engine. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonDiffOperation = "added" | "removed" | "changed";

export type JsonDiffEntry = {
  /** RFC 6901 JSON Pointer. The document root is the empty string. */
  readonly path: string;
  readonly operation: JsonDiffOperation;
  readonly before?: JsonValue;
  readonly after?: JsonValue;
};

export type JsonDiffResult = {
  readonly entries: readonly JsonDiffEntry[];
  readonly summary: {
    readonly added: number;
    readonly removed: number;
    readonly changed: number;
    readonly total: number;
  };
};

/** Maximum UTF-16 source size accepted for either document. */
export const JSON_DIFF_MAX_INPUT_CHARS = 1_000_000;
/** Maximum values visited while comparing two parsed documents. */
export const JSON_DIFF_MAX_NODES = 100_000;
/** Maximum nesting depth inspected by the iterative traversal. */
export const JSON_DIFF_MAX_DEPTH = 128;
/** Maximum difference rows retained for a single comparison. */
export const JSON_DIFF_MAX_ENTRIES = 10_000;

type CompareFrame = {
  readonly path: string;
  readonly depth: number;
  readonly before?: JsonValue;
  readonly after?: JsonValue;
  readonly operation?: "added" | "removed";
};

/**
 * Parse and structurally compare two JSON documents.
 *
 * Object keys are traversed in stable lexical order and array values by index, so
 * the result is deterministic regardless of source-property insertion order.
 * This is deliberately a structural comparison, not a textual diff: whitespace
 * and object-key ordering never produce a change.
 */
export function diffJson(leftSource: string, rightSource: string): ToolResult<JsonDiffResult> {
  const left = parseJsonDocument(leftSource, "left");
  if (!left.ok) return left;

  const right = parseJsonDocument(rightSource, "right");
  if (!right.ok) return right;

  const entries: JsonDiffEntry[] = [];
  const summary = { added: 0, removed: 0, changed: 0, total: 0 };
  const frames: CompareFrame[] = [{ before: left.value, after: right.value, path: "", depth: 0 }];
  let visitedNodes = 0;

  while (frames.length > 0) {
    const frame = frames.pop();
    if (!frame) continue;

    visitedNodes += 1;
    if (visitedNodes > JSON_DIFF_MAX_NODES) {
      return err(
        "DIFF_TOO_COMPLEX",
        `Comparison exceeds the ${JSON_DIFF_MAX_NODES.toLocaleString()} value limit.`,
      );
    }
    if (frame.depth > JSON_DIFF_MAX_DEPTH) {
      return err(
        "DIFF_TOO_DEEP",
        `Comparison exceeds the ${JSON_DIFF_MAX_DEPTH}-level nesting limit.`,
      );
    }

    if (frame.operation === "added") {
      const entry = addEntry(entries, summary, {
        path: frame.path,
        operation: "added",
        after: frame.after as JsonValue,
      });
      if (!entry.ok) return entry;
      continue;
    }
    if (frame.operation === "removed") {
      const entry = addEntry(entries, summary, {
        path: frame.path,
        operation: "removed",
        before: frame.before as JsonValue,
      });
      if (!entry.ok) return entry;
      continue;
    }

    // The initial frame and every recursive frame have both values. The casts
    // keep the work-frame representation compact while JSON itself guarantees
    // that neither side can be `undefined`.
    const beforeValue = frame.before as JsonValue;
    const afterValue = frame.after as JsonValue;

    const beforeKind = jsonKind(beforeValue);
    const afterKind = jsonKind(afterValue);
    if (beforeKind !== afterKind) {
      const entry = addEntry(entries, summary, {
        path: frame.path,
        operation: "changed",
        before: beforeValue,
        after: afterValue,
      });
      if (!entry.ok) return entry;
      continue;
    }

    if (beforeKind === "array") {
      const before = beforeValue as JsonValue[];
      const after = afterValue as JsonValue[];
      const maxLength = Math.max(before.length, after.length);
      // Push backwards because this is a LIFO work stack: output remains index-ascending.
      for (let index = maxLength - 1; index >= 0; index -= 1) {
        const path = appendPointer(frame.path, String(index));
        const hasBefore = index < before.length;
        const hasAfter = index < after.length;
        if (!hasBefore) {
          frames.push({
            path,
            depth: frame.depth + 1,
            operation: "added",
            after: after[index] as JsonValue,
          });
        } else if (!hasAfter) {
          frames.push({
            path,
            depth: frame.depth + 1,
            operation: "removed",
            before: before[index] as JsonValue,
          });
        } else {
          frames.push({
            before: before[index] as JsonValue,
            after: after[index] as JsonValue,
            path,
            depth: frame.depth + 1,
          });
        }
      }
      continue;
    }

    if (beforeKind === "object") {
      const before = beforeValue as Record<string, JsonValue>;
      const after = afterValue as Record<string, JsonValue>;
      const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
      for (let index = keys.length - 1; index >= 0; index -= 1) {
        const key = keys[index];
        if (key === undefined) continue;
        const path = appendPointer(frame.path, key);
        const hasBefore = Object.hasOwn(before, key);
        const hasAfter = Object.hasOwn(after, key);
        if (!hasBefore) {
          frames.push({
            path,
            depth: frame.depth + 1,
            operation: "added",
            after: after[key] as JsonValue,
          });
        } else if (!hasAfter) {
          frames.push({
            path,
            depth: frame.depth + 1,
            operation: "removed",
            before: before[key] as JsonValue,
          });
        } else {
          frames.push({
            before: before[key] as JsonValue,
            after: after[key] as JsonValue,
            path,
            depth: frame.depth + 1,
          });
        }
      }
      continue;
    }

    if (!Object.is(beforeValue, afterValue)) {
      const entry = addEntry(entries, summary, {
        path: frame.path,
        operation: "changed",
        before: beforeValue,
        after: afterValue,
      });
      if (!entry.ok) return entry;
    }
  }

  return ok({ entries, summary });
}

function parseJsonDocument(source: string, side: "left" | "right"): ToolResult<JsonValue> {
  if (source.length > JSON_DIFF_MAX_INPUT_CHARS) {
    return err(
      `${side.toUpperCase()}_INPUT_TOO_LARGE`,
      `${capitalize(side)} JSON exceeds the ${JSON_DIFF_MAX_INPUT_CHARS.toLocaleString()} character limit.`,
    );
  }

  try {
    return ok(JSON.parse(source) as JsonValue);
  } catch (cause) {
    const detail = cause instanceof SyntaxError && cause.message ? ` ${cause.message}` : "";
    return err(
      `${side.toUpperCase()}_INVALID_JSON`,
      `${capitalize(side)} JSON is invalid.${detail}`,
    );
  }
}

function addEntry(
  entries: JsonDiffEntry[],
  summary: { added: number; removed: number; changed: number; total: number },
  entry: JsonDiffEntry,
): ToolResult<void> {
  if (entries.length >= JSON_DIFF_MAX_ENTRIES) {
    return err(
      "TOO_MANY_DIFFERENCES",
      `Comparison exceeds the ${JSON_DIFF_MAX_ENTRIES.toLocaleString()} difference limit.`,
    );
  }
  entries.push(entry);
  summary[entry.operation] += 1;
  summary.total += 1;
  return ok(undefined);
}

function jsonKind(value: JsonValue): "null" | "array" | "object" | "boolean" | "number" | "string" {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value as "boolean" | "number" | "string";
}

function appendPointer(parent: string, token: string): string {
  return `${parent}/${token.replaceAll("~", "~0").replaceAll("/", "~1")}`;
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
