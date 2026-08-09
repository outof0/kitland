import {
  hashSha256,
  type ShaHashEncoding,
  type ShaHashResult,
  type ToolResult,
} from "@kitland/core";
import { useCallback, useRef, useState } from "react";

export type ShaHashState = {
  result: ToolResult<ShaHashResult> | null;
  sourceLength: number | null;
  isHashing: boolean;
  hash: (input: string, encoding: ShaHashEncoding) => Promise<void>;
  clear: () => void;
};

/** Browser host adapter for the portable SHA-256 core contract. */
export function useShaHash(): ShaHashState {
  const [result, setResult] = useState<ToolResult<ShaHashResult> | null>(null);
  const [sourceLength, setSourceLength] = useState<number | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const requestId = useRef(0);

  const hash = useCallback(async (input: string, encoding: ShaHashEncoding) => {
    const id = requestId.current + 1;
    requestId.current = id;
    setIsHashing(true);
    const nextResult = await hashSha256(input, browserShaDigest, { encoding });
    if (id !== requestId.current) return;
    setResult(nextResult);
    setSourceLength(nextResult.ok ? input.length : null);
    setIsHashing(false);
  }, []);

  const clear = useCallback(() => {
    requestId.current += 1;
    setResult(null);
    setSourceLength(null);
    setIsHashing(false);
  }, []);

  return { result, sourceLength, isHashing, hash, clear };
}

async function browserShaDigest(algorithm: "SHA-256", input: Uint8Array): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto is unavailable.");
  // Do not hand `subtle` a view backed by SharedArrayBuffer. A fresh
  // ArrayBuffer-backed copy satisfies the browser API and avoids aliasing host data.
  const safeInput = new Uint8Array(input.length);
  safeInput.set(input);
  return new Uint8Array(await subtle.digest(algorithm, safeInput));
}
