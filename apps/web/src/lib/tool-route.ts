/**
 * Decode one `/explore/:slug` route segment without allowing malformed percent
 * escapes to crash the client application.
 */
export function decodeToolSlug(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}
