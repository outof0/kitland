import type { Base64Mode } from "@kitland/core";

export const BASE64_SHARE_HASH_PREFIX = "#base64?";
export const BASE64_SHARE_URL_MAX_LENGTH = 8_000;

export type Base64Format = "standard" | "url-safe";

export type SharedBase64State = {
  mode: Base64Mode;
  format: Base64Format;
  input: string;
};

/**
 * Create a canonical, fragment-only share URL.
 *
 * The caller's current query string is intentionally discarded: query values
 * often carry analytics, SSO, or temporary access data and must never be
 * copied into a user-facing share link.
 */
export function createBase64ShareUrl(
  { mode, format, input }: SharedBase64State,
  currentHref: string,
): string {
  const current = new URL(currentHref);
  const url = new URL(current.pathname, current.origin);
  const params = new URLSearchParams({ mode, format, input });
  url.hash = `${BASE64_SHARE_HASH_PREFIX.slice(1)}${params.toString()}`;
  return url.toString();
}

export function readBase64ShareState(href: string): SharedBase64State | null {
  const url = new URL(href);
  if (!url.hash.startsWith(BASE64_SHARE_HASH_PREFIX) || href.length > BASE64_SHARE_URL_MAX_LENGTH) {
    return null;
  }

  const params = new URLSearchParams(url.hash.slice(BASE64_SHARE_HASH_PREFIX.length));
  const mode = params.get("mode");
  const format = params.get("format");
  const input = params.get("input");

  if (
    (mode !== "encode" && mode !== "decode") ||
    (format !== "standard" && format !== "url-safe") ||
    input === null
  ) {
    return null;
  }

  return { mode, format, input };
}

export function isBase64ShareHash(hash: string): boolean {
  return hash.startsWith(BASE64_SHARE_HASH_PREFIX);
}
