/**
 * Host-declared powers for shared @kitland/ui tool components.
 *
 * Shared tool UIs render identical markup on every host; the host decides
 * which local capabilities are enabled and passes them explicitly. Absent
 * capabilities stay hidden — availability on one host never authorizes
 * another (see docs/architecture/platform-capabilities.md).
 *
 * Share is NOT part of ToolCapabilities: it is a Web-only platform contract
 * with tool-specific state, carried by each tool's own typed `share` prop
 * (e.g. Base64Tool). Extension and VS Code hosts never pass it.
 */
export type ToolCapabilities = {
  /** Host may open a local text file into the input pane (file picker). */
  readonly fileOpen?: boolean;
  /** Host may save/download the derived output file. */
  readonly fileSave?: boolean;
  /**
   * Host may open a print view for the derived output. Gated separately from
   * fileSave because some hosts (VS Code webview, browser-extension) forbid
   * the `window.open` + `document.write` popup the shared UI uses.
   */
  readonly print?: boolean;
};

/** Web and browser-extension expose both local powers today. */
export const FULL_CAPABILITIES: ToolCapabilities = {
  fileOpen: true,
  fileSave: true,
};

/** Minimal local host (e.g. VS Code webview): clipboard and engine only. */
export const LOCAL_ONLY_CAPABILITIES: ToolCapabilities = {
  fileOpen: false,
  fileSave: false,
};
