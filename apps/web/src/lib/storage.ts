/**
 * Versioned workspace preference storage. Tool payloads are intentionally not
 * part of this contract.
 */

export const STORAGE_KEYS = {
  theme: "kitland.theme",
  favorites: "kitland.favorites",
} as const;

export type WorkspaceTheme = "light" | "dark";
export type WorkspaceStorageValueMap = {
  readonly [STORAGE_KEYS.theme]: WorkspaceTheme;
  readonly [STORAGE_KEYS.favorites]: string[];
};
export type WorkspaceStorageKey = keyof WorkspaceStorageValueMap;

export const STORAGE_FORMAT_VERSION = 1;
export const MAX_STORED_FAVORITES = 256;

type StorageContract<T> = {
  readonly decode: (value: unknown) => T | undefined;
};

type StorageEnvelope = {
  readonly version: number;
  readonly value: unknown;
};

export type StorageReadSource = "empty" | "current" | "legacy" | "invalid" | "future";

export type StorageReadSnapshot<T> = {
  readonly value: T;
  /** False only when preserving an envelope written by a newer application. */
  readonly allowAutomaticWrite: boolean;
  readonly source: StorageReadSource;
};

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const STORAGE_CONTRACTS: {
  readonly [K in WorkspaceStorageKey]: StorageContract<WorkspaceStorageValueMap[K]>;
} = {
  [STORAGE_KEYS.theme]: {
    decode: (value) => (value === "light" || value === "dark" ? value : undefined),
  },
  [STORAGE_KEYS.favorites]: {
    decode: decodeFavorites,
  },
};

/** Read and validate a preference, falling back safely for unavailable storage. */
export function readStorage<K extends WorkspaceStorageKey>(
  key: K,
  fallback: WorkspaceStorageValueMap[K],
): WorkspaceStorageValueMap[K] {
  return readStorageSnapshot(key, fallback).value;
}

/**
 * Read with migration metadata for persistence hooks.
 *
 * Raw values from the pre-versioned format are accepted and written back as a
 * v1 envelope by the hook. A future envelope is left untouched until the user
 * explicitly changes that preference, preventing downgrade data loss.
 */
export function readStorageSnapshot<K extends WorkspaceStorageKey>(
  key: K,
  fallback: WorkspaceStorageValueMap[K],
): StorageReadSnapshot<WorkspaceStorageValueMap[K]> {
  if (typeof window === "undefined") {
    return snapshot(fallback, true, "empty");
  }

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return snapshot(fallback, true, "empty");
  }
  if (raw === null) return snapshot(fallback, true, "empty");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return snapshot(fallback, true, "invalid");
  }

  const contract = STORAGE_CONTRACTS[key];
  if (isStorageEnvelope(parsed)) {
    if (parsed.version > STORAGE_FORMAT_VERSION) {
      return snapshot(fallback, false, "future");
    }

    const decoded = contract.decode(parsed.value);
    if (decoded === undefined) return snapshot(fallback, true, "invalid");
    return snapshot(
      decoded,
      true,
      parsed.version === STORAGE_FORMAT_VERSION ? "current" : "legacy",
    );
  }

  const legacy = contract.decode(parsed);
  return legacy === undefined
    ? snapshot(fallback, true, "invalid")
    : snapshot(legacy, true, "legacy");
}

/** Validate and write one canonical versioned preference envelope. */
export function writeStorage<K extends WorkspaceStorageKey>(
  key: K,
  value: WorkspaceStorageValueMap[K],
): boolean {
  if (typeof window === "undefined") return false;

  const decoded = STORAGE_CONTRACTS[key].decode(value);
  if (decoded === undefined) return false;

  const envelope: StorageEnvelope = {
    version: STORAGE_FORMAT_VERSION,
    value: decoded,
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: WorkspaceStorageKey): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* Storage can be unavailable in private or restricted browser contexts. */
  }
}

function decodeFavorites(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length > MAX_STORED_FAVORITES) return undefined;

  const favorites: string[] = [];
  const seen = new Set<string>();
  for (const slug of value) {
    if (typeof slug !== "string" || !KEBAB_CASE.test(slug)) return undefined;
    if (!seen.has(slug)) {
      seen.add(slug);
      favorites.push(slug);
    }
  }
  return favorites;
}

function isStorageEnvelope(value: unknown): value is StorageEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    "value" in value &&
    typeof value.version === "number" &&
    Number.isSafeInteger(value.version) &&
    value.version >= 0
  );
}

function snapshot<T>(
  value: T,
  allowAutomaticWrite: boolean,
  source: StorageReadSource,
): StorageReadSnapshot<T> {
  return { value, allowAutomaticWrite, source };
}
