/**
 * Workspace preference only. Never stores input, output, or secrets.
 * Shared by web, the browser extension, and the VS Code webview.
 */
export const AUTO_TRANSFORM_STORAGE_KEY = "kitland.auto-transform";

export function readAutoTransformPreference(): boolean | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(AUTO_TRANSFORM_STORAGE_KEY);
    if (raw === null) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === true || parsed === false) return parsed;
    if (typeof parsed === "object" && parsed !== null && "value" in parsed) {
      const value = (parsed as { value: unknown }).value;
      if (value === true || value === false) return value;
    }
  } catch {
    // Storage can be unavailable or hold a non-JSON legacy value.
  }
  return undefined;
}

export function writeAutoTransformPreference(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTO_TRANSFORM_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode or quota — keep the in-memory toggle only.
  }
}
