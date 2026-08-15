/** Return one cryptographically secure unsigned 32-bit value via Web Crypto. */
export function secureRandomUint32(): number {
  const webCrypto = globalThis.crypto;
  if (!webCrypto || typeof webCrypto.getRandomValues !== "function") {
    throw new Error("Web Crypto is not available.");
  }
  return webCrypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}
