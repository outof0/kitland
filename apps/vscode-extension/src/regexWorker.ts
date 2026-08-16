import { err, type RegexTestResult, type ToolResult } from "@kitland/core";
import {
  REGEX_TEST_MAX_INPUT_CHARS,
  REGEX_TEST_MAX_PATTERN_CHARS,
} from "@kitland/core";

export const REGEX_WORKER_TIMEOUT_MS = 2500;

/**
 * Execute user-provided regex off the extension-host event loop.
 * Uses Node worker_threads when available; otherwise falls back to
 * synchronous core testRegex (best-effort: cannot preempt ReDoS in
 * browser/web extension host but still enforces size limits).
 */
export async function runRegexIsolated(
  pattern: string,
  input: string,
  flags: string,
  timeoutMs: number = REGEX_WORKER_TIMEOUT_MS,
): Promise<ToolResult<RegexTestResult>> {
  if (pattern.length > REGEX_TEST_MAX_PATTERN_CHARS) {
    return err(
      "PATTERN_TOO_LARGE",
      `Regular expression exceeds ${REGEX_TEST_MAX_PATTERN_CHARS.toLocaleString()} characters.`,
    );
  }
  if (input.length > REGEX_TEST_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Test text exceeds ${REGEX_TEST_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  // Browser/web extension host has no node:worker_threads.
  let WorkerCtor: typeof import("node:worker_threads").Worker | undefined;
  try {
    const wt = await import("node:worker_threads");
    WorkerCtor = wt.Worker;
  } catch {
    WorkerCtor = undefined;
  }

  if (!WorkerCtor) {
    return err(
      "WORKER_UNAVAILABLE",
      "The local regex tester is unavailable. Reopen the extension and try again.",
    );
  }

  const workerCode = `
      const { parentPort, workerData } = require("node:worker_threads");
      const { pattern, input, flags } = workerData;

      function withGlobalFlag(f) {
        return f.includes("g") ? f : f + "g";
      }
      function advanceStringIndex(str, idx, unicode) {
        if (!unicode) return idx + 1;
        const first = str.charCodeAt(idx);
        const second = str.charCodeAt(idx + 1);
        if (first >= 0xd800 && first <= 0xdbff && second >= 0xdc00 && second <= 0xdfff) return idx + 2;
        return idx + 1;
      }

      try {
        const expression = new RegExp(pattern, withGlobalFlag(flags));
        const matches = [];
        while (matches.length < 1000) {
          const match = expression.exec(input);
          if (!match) {
            parentPort.postMessage({ ok: true, value: { matches, truncated: false } });
            break;
          }
          matches.push({
            value: match[0] ?? "",
            index: match.index,
            end: match.index + (match[0]?.length ?? 0),
            captures: match.slice(1).map((val, i) => ({ index: i + 1, value: val ?? null })),
            namedCaptures: match.groups ? { ...match.groups } : {},
          });
          if (match[0] === "") {
            expression.lastIndex = advanceStringIndex(input, expression.lastIndex, expression.unicode);
          }
        }
        if (matches.length >= 1000) {
          parentPort.postMessage({ ok: true, value: { matches, truncated: true } });
        }
      } catch (e) {
        parentPort.postMessage({
          ok: false,
          error: { code: "INVALID_REGEX", message: e instanceof Error ? e.message : "Invalid regular expression." }
        });
      }
    `;

  return new Promise((resolve) => {
    let settled = false;
    let worker: InstanceType<NonNullable<typeof WorkerCtor>> | null = null;
    try {
      const Ctor = WorkerCtor as unknown as new (code: string, opts: unknown) => InstanceType<
        NonNullable<typeof WorkerCtor>
      >;
      worker = new Ctor(workerCode, {
        eval: true,
        workerData: { pattern, input, flags },
      } as unknown as never);
    } catch {
      return resolve(
        err(
          "WORKER_UNAVAILABLE",
          "The local regex tester is unavailable. Reopen the extension and try again.",
        ),
      );
    }
    if (!worker) {
      return resolve(
        err(
          "WORKER_UNAVAILABLE",
          "The local regex tester is unavailable. Reopen the extension and try again.",
        ),
      );
    }
    const w = worker;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        void w.terminate();
        resolve(err("DEADLINE_EXCEEDED", "Operation timed out before completion."));
      }
    }, timeoutMs);

    w.on("message", (msg: ToolResult<RegexTestResult>) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        void w.terminate();
        resolve(msg);
      }
    });

    w.on("error", (workerErr: Error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        void w.terminate();
        resolve(err("INVALID_REGEX", workerErr.message));
      }
    });

    w.on("exit", (code: number) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        if (code !== 0) {
          resolve(err("INTERNAL_ERROR", `Worker thread terminated with code ${code}`));
        } else {
          resolve(err("INTERNAL_ERROR", "Regex worker terminated without result."));
        }
      }
    });
  });
}
