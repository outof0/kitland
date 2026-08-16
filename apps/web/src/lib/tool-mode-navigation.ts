export const TOOL_MODE_NAVIGATION_EVENT = "kitland:tool-mode-navigate";

/**
 * Lets a bidirectional tool update the URL and host chrome without remounting
 * its local workspace. The tool keeps its transformed input while the web host
 * updates navigation, title, favorites, and other route-derived UI.
 */
export function dispatchToolModeNavigation(slug: string): void {
  window.dispatchEvent(
    new CustomEvent<string>(TOOL_MODE_NAVIGATION_EVENT, {
      detail: slug,
    }),
  );
}
