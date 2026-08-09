import { signHmacSha256, type HmacResult, type ToolResult } from "@kitland/core";
import { useCallback, useRef, useState } from "react";

export function useHmac() {
  const [result, setResult] = useState<ToolResult<HmacResult> | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const request = useRef(0);
  const sign = useCallback(async (secret: string, message: string) => {
    const id = request.current + 1;
    request.current = id;
    setIsSigning(true);
    const next = await signHmacSha256(secret, message, browserSignHmac);
    if (request.current !== id) return;
    setResult(next);
    setIsSigning(false);
  }, []);
  const clear = useCallback(() => {
    request.current += 1;
    setResult(null);
    setIsSigning(false);
  }, []);
  return { result, isSigning, sign, clear };
}

async function browserSignHmac(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto unavailable.");
  const safeKey = new Uint8Array(key.length);
  const safeMessage = new Uint8Array(message.length);
  safeKey.set(key);
  safeMessage.set(message);
  const cryptoKey = await subtle.importKey(
    "raw",
    safeKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await subtle.sign("HMAC", cryptoKey, safeMessage));
}
