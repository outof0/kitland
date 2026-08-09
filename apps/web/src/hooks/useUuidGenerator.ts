import { generateUuidV4 } from "@kitland/core";
import { useCallback, useState } from "react";

const HISTORY_LIMIT = 5;

export type UuidGeneratorState = {
  current: string | null;
  history: readonly string[];
  error: string | null;
  generate: () => void;
  clearHistory: () => void;
};

/**
 * Browser adapter for the pure UUID v4 generator.
 *
 * UUIDs are created only from Web Crypto and only after a user action. That
 * avoids hydration-time randomness and never falls back to Math.random().
 */
export function useUuidGenerator(): UuidGeneratorState {
  const [current, setCurrent] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(() => {
    const result = generateUuidV4(webCryptoRandomBytes);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    setCurrent(result.value);
    setHistory((existing) =>
      [result.value, ...existing.filter((value) => value !== result.value)].slice(0, HISTORY_LIMIT),
    );
    setError(null);
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { current, history, error, generate, clearHistory };
}

function webCryptoRandomBytes(length: number): Uint8Array {
  const webCrypto = globalThis.crypto;
  if (!webCrypto || typeof webCrypto.getRandomValues !== "function") {
    throw new Error("Web Crypto is not available.");
  }

  const bytes = new Uint8Array(length);
  webCrypto.getRandomValues(bytes);
  return bytes;
}
