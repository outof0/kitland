export const JSON_SHARE_HASH_PREFIX = "#json?";
export const JSON_SHARE_URL_MAX_LENGTH = 8_000;

export type SharedJsonState = {
  input: string;
};

/**
 * Create a canonical, fragment-only share URL.
 *
 * The caller's current query string is intentionally discarded: query values
 * often carry analytics, SSO, or temporary access data and must never be
 * copied into a user-facing share link.
 */
export function createJsonShareUrl({ input }: SharedJsonState, currentHref: string): string {
  const current = new URL(currentHref);
  const url = new URL(current.pathname, current.origin);
  const params = new URLSearchParams({ input });
  url.hash = `${JSON_SHARE_HASH_PREFIX.slice(1)}${params.toString()}`;
  return url.toString();
}

export function readJsonShareState(href: string): SharedJsonState | null {
  const url = new URL(href);
  if (!url.hash.startsWith(JSON_SHARE_HASH_PREFIX) || href.length > JSON_SHARE_URL_MAX_LENGTH) {
    return null;
  }

  const params = new URLSearchParams(url.hash.slice(JSON_SHARE_HASH_PREFIX.length));
  const input = params.get("input");
  if (input === null) return null;

  return { input };
}

export function isJsonShareHash(hash: string): boolean {
  return hash.startsWith(JSON_SHARE_HASH_PREFIX);
}
