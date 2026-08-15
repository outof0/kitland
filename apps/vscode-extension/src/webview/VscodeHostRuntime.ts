import { createWebCryptoHostRuntime, type HostRuntime, type ToolResult } from "@kitland/core";

type VsCodeApi = { postMessage(message: Record<string, unknown>): void };
declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

let sequence = 0;
function nextRequestId(): number {
  sequence = sequence === Number.MAX_SAFE_INTEGER ? 1 : sequence + 1;
  return sequence;
}

type PendingRequest<T> = {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

const pendingTransforms = new Map<number, PendingRequest<ToolResult<string>>>();
const pendingInspects = new Map<number, PendingRequest<ToolResult<string>>>();

/**
 * Listen for host responses and resolve the corresponding pending promise.
 * This module is imported once at app startup; the listener stays active for
 * the webview lifetime.
 */
window.addEventListener("message", (event: MessageEvent<unknown>) => {
  const data = event.data as Record<string, unknown> | null;
  if (!data || typeof data !== "object") return;

  const { type, requestId } = data;
  if (typeof requestId !== "number") return;

  if (type === "transformResult") {
    const pending = pendingTransforms.get(requestId);
    if (!pending) return;
    pendingTransforms.delete(requestId);
    if (data.ok === true && typeof data.value === "string") {
      pending.resolve({ ok: true, value: data.value });
    } else {
      pending.resolve({
        ok: false,
        error: {
          code: typeof data.code === "string" ? data.code : "TRANSFORM_FAILED",
          message: typeof data.message === "string" ? data.message : "Transform failed.",
        },
      });
    }
    return;
  }

  if (type === "inspectResult") {
    const pending = pendingInspects.get(requestId);
    if (!pending) return;
    pendingInspects.delete(requestId);
    if (data.ok === true && typeof data.inspection === "object" && data.inspection !== null) {
      const inspection = data.inspection as Record<string, unknown>;
      if (typeof inspection.formatted === "string") {
        pending.resolve({ ok: true, value: inspection.formatted });
      } else {
        pending.resolve({
          ok: false,
          error: { code: "INSPECTION_FAILED", message: "Invalid inspection result." },
        });
      }
    } else {
      pending.resolve({
        ok: false,
        error: {
          code: typeof data.code === "string" ? data.code : "INSPECTION_FAILED",
          message: typeof data.message === "string" ? data.message : "Inspection failed.",
        },
      });
    }
  }
});

/**
 * Transform a text input by delegating to the VS Code extension host.
 * The host runs the actual transform in Node.js and posts back the result.
 */
export async function vscodeTransform(
  toolId: string,
  operationId: string,
  optionId: string,
  input: string,
): Promise<ToolResult<string>> {
  const requestId = nextRequestId();
  return new Promise<ToolResult<string>>((resolve, reject) => {
    pendingTransforms.set(requestId, { resolve, reject });
    vscode.postMessage({
      type: "transform",
      requestId,
      toolId,
      operationId,
      optionId,
      input,
    });
  });
}

/**
 * Inspect JSON by delegating to the VS Code extension host.
 * Returns the formatted JSON string on success.
 */
export async function vscodeInspect(
  toolId: string,
  operationId: string,
  optionId: string,
  input: string,
): Promise<ToolResult<string>> {
  const requestId = nextRequestId();
  return new Promise<ToolResult<string>>((resolve, reject) => {
    pendingInspects.set(requestId, { resolve, reject });
    vscode.postMessage({
      type: "inspect",
      requestId,
      toolId,
      operationId,
      optionId,
      input,
    });
  });
}

/**
 * Request copy to clipboard via the extension host (webviews can't access
 * navigator.clipboard directly under VS Code's CSP).
 */
export async function vscodeCopy(toolId: string, _value: string): Promise<boolean> {
  const requestId = nextRequestId();
  return new Promise<boolean>((resolve) => {
    const handler = (event: MessageEvent<unknown>) => {
      const data = event.data as Record<string, unknown> | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "copyResult" ||
        data.requestId !== requestId
      )
        return;
      window.removeEventListener("message", handler);
      resolve(data.ok === true);
    };
    window.addEventListener("message", handler);
    vscode.postMessage({ type: "copy", requestId, toolId });
  });
}

/**
 * Create a HostRuntime-compatible object that proxies crypto operations to
 * Web Crypto (available in the webview) and delegates transforms to the host.
 *
 * Note: GenericTransformTool only uses `getRuntime()` for the runtime argument
 * passed to `spec.transform()`. Since our spec.transform proxy ignores the
 * runtime and posts to the host instead, we provide a minimal stub.
 */
export function createVscodeHostRuntime(): HostRuntime {
  return createWebCryptoHostRuntime(globalThis.crypto);
}
