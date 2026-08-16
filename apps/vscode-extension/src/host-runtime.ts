import { createWebCryptoHostRuntime, pem, type HostRuntime } from "@kitland/core";

export async function getVscodeHostRuntime(): Promise<HostRuntime> {
  let bcryptHash: HostRuntime["bcryptHash"];
  let bcryptCompare: HostRuntime["bcryptCompare"];
  try {
    const bcrypt = await import("bcryptjs");
    bcryptHash = (password: string, cost: number) => bcrypt.hash(password, cost);
    bcryptCompare = (password: string, hash: string) => bcrypt.compare(password, hash);
  } catch {
    // optional
  }

  return createWebCryptoHostRuntime(globalThis.crypto, {
    ...(bcryptHash ? { bcryptHash } : {}),
    ...(bcryptCompare ? { bcryptCompare } : {}),
    async generateRsaPem(modulusLength) {
      const pair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"],
      );
      const publicKey = await crypto.subtle.exportKey("spki", pair.publicKey);
      const privateKey = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
      return {
        publicKey: pem("PUBLIC KEY", publicKey),
        privateKey: pem("PRIVATE KEY", privateKey),
      };
    },
  });
}
