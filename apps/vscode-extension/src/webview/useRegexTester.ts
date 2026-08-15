import { err, ok, type RegexTestResult, type ToolResult } from "@kitland/core";
import type { RegexTesterHook } from "@kitland/ui/tools/RegexTesterTool";
import { useEffect, useRef, useState } from "react";

const TEST_DEBOUNCE_MS = 120;
const HOST_RESPONSE_TIMEOUT_MS = 4000;

declare function acquireVsCodeApi(): { postMessage(message: unknown): void };
const vscode = acquireVsCodeApi();

type State = { result: ToolResult<RegexTestResult>; isProcessing: boolean };
const EMPTY_MATCHES: RegexTestResult = { matches: [], truncated: false };

/**
 * VS Code extension host hook for the shared Regex Tester. User-provided
 * patterns are evaluated in the extension host process (worker_threads with
 * deadline) so a catastrophic pattern cannot freeze the workbench. The hook
 * times out with DEADLINE_EXCEEDED if the host never answers.
 */
export const useVscodeRegexTester: RegexTesterHook = (pattern, input, flags) => {
  const [state, setState] = useState<State>(() => immediateState(pattern, input));
  const requestId = useRef(0);
  const latestId = useRef(0);
  const hostTimeoutRef = useRef<number | undefined>(undefined);
  const deadlineFiredRef = useRef(false);

  useEffect(() => {
    const immediate = immediateState(pattern, input);
    if (!immediate.isProcessing) {
      setState(immediate);
      return;
    }

    setState({ result: { ok: true, value: EMPTY_MATCHES }, isProcessing: true });

    const id = requestId.current === Number.MAX_SAFE_INTEGER ? 1 : requestId.current + 1;
    requestId.current = id;
    latestId.current = id;
    deadlineFiredRef.current = false;

    const timer = window.setTimeout(() => {
      vscode.postMessage({ type: "regexTest", requestId: id, pattern, input, flags });
      // Guard against hosts that never answer and worker hangs.
      hostTimeoutRef.current = window.setTimeout(() => {
        if (latestId.current !== id) return;
        hostTimeoutRef.current = undefined;
        deadlineFiredRef.current = true;
        setState({
          result: err(
            "DEADLINE_EXCEEDED",
            "The local regex tester did not respond. Retry or simplify the pattern.",
          ),
          isProcessing: false,
        });
      }, HOST_RESPONSE_TIMEOUT_MS);
    }, TEST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      if (hostTimeoutRef.current !== undefined) {
        window.clearTimeout(hostTimeoutRef.current);
        hostTimeoutRef.current = undefined;
      }
    };
  }, [pattern, input, flags]);

  useEffect(() => {
    const handler = (event: MessageEvent<unknown>) => {
      const message = event.data as
        | { type?: string; requestId?: number; result?: ToolResult<RegexTestResult> }
        | undefined;
      if (!message || message.type !== "regexResult") return;
      if (message.requestId !== latestId.current) return;
      if (deadlineFiredRef.current) return;
      if (message.result) {
        if (hostTimeoutRef.current !== undefined) {
          window.clearTimeout(hostTimeoutRef.current);
          hostTimeoutRef.current = undefined;
        }
        setState({ result: message.result, isProcessing: false });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return state;
};

function immediateState(pattern: string, input: string): State {
  if (pattern.length === 0 || input.length === 0) {
    return { result: ok(EMPTY_MATCHES), isProcessing: false };
  }
  return { result: { ok: true, value: EMPTY_MATCHES }, isProcessing: true };
}
