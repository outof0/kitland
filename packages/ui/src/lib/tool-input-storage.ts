/**
 * Manages draft persistence for tool editor inputs.
 *
 * Privacy-first categorization:
 * - Sensitive crypto/security tools use `sessionStorage` (isolated to current tab lifecycle, destroyed on close).
 * - Standard developer utilities use `localStorage` (restored across refreshes and browser reopens).
 * - Clearing input immediately deletes the stored key.
 */

const STORAGE_PREFIX = "kitland:input:";
const MAX_PERSISTED_CHARS = 500_000;

const CRYPTO_SECURITY_SLUGS = new Set([
  "sha-hash",
  "hmac-generator",
  "aes-cipher",
  "bcrypt-hash",
  "rsa-key-pair",
  "jwt-decoder",
  "basic-auth-header",
  "token-generator",
  "password-generator",
]);

export function isCryptoSecurityTool(slug: string): boolean {
  return CRYPTO_SECURITY_SLUGS.has(slug);
}

export function getStorageKindForTool(slug: string): "session" | "local" {
  return isCryptoSecurityTool(slug) ? "session" : "local";
}

function getStorage(kind: "session" | "local"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export function readPersistedToolInput(slug: string): string | null {
  const kind = getStorageKindForTool(slug);
  const storage = getStorage(kind);
  if (!storage) return null;
  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}${slug}`);
    return typeof raw === "string" ? raw : null;
  } catch {
    return null;
  }
}

export function writePersistedToolInput(slug: string, value: string): void {
  const kind = getStorageKindForTool(slug);
  const storage = getStorage(kind);
  if (!storage) return;

  const key = `${STORAGE_PREFIX}${slug}`;
  try {
    if (!value || value.length === 0) {
      storage.removeItem(key);
      return;
    }
    if (value.length > MAX_PERSISTED_CHARS) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, value);
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Graceful fallback for quota exceeded or storage permission denial
    }
  }
}

export function clearPersistedToolInput(slug: string): void {
  const kind = getStorageKindForTool(slug);
  const storage = getStorage(kind);
  if (!storage) return;
  try {
    storage.removeItem(`${STORAGE_PREFIX}${slug}`);
  } catch {
    // Graceful fallback
  }
}
