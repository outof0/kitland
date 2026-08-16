import type { AesGcmHost } from "./tools/aes-cipher";

/**
 * Host-supplied primitives for multi-surface adapters.
 * Core tools stay free of global crypto; adapters inject Web Crypto / bcrypt / RSA.
 */
export type HostRuntime = {
  readonly now: () => number;
  readonly randomBytes: (length: number) => Uint8Array;
  readonly randomUint32: () => number;
  readonly sha256: (algorithm: "SHA-256", data: Uint8Array) => Promise<Uint8Array>;
  readonly hmacSha256: (key: Uint8Array, message: Uint8Array) => Promise<Uint8Array>;
  readonly aes: AesGcmHost;
  readonly bcryptHash?: (password: string, cost: number) => Promise<string>;
  readonly bcryptCompare?: (password: string, hash: string) => Promise<boolean>;
  readonly generateRsaPem?: (
    modulusLength: number,
  ) => Promise<{ publicKey: string; privateKey: string }>;
};

type AlgorithmIdentifier = string | { name: string; [key: string]: unknown };
type BufferSource = ArrayBuffer | ArrayBufferView;
type CryptoLike = {
  getRandomValues: (array: Uint8Array) => Uint8Array;
  subtle: {
    digest: (algorithm: AlgorithmIdentifier, data: BufferSource) => Promise<ArrayBuffer>;
    importKey: (...args: unknown[]) => Promise<unknown>;
    sign: (...args: unknown[]) => Promise<ArrayBuffer>;
    encrypt: (...args: unknown[]) => Promise<ArrayBuffer>;
    decrypt: (...args: unknown[]) => Promise<ArrayBuffer>;
  };
};

/**
 * Build a HostRuntime from an explicit Web Crypto instance.
 * Adapters must pass `globalThis.crypto` (or a test double); core no longer reads globals.
 */
export function createWebCryptoHostRuntime(
  cryptoApi: unknown,
  extras: Partial<Pick<HostRuntime, "bcryptHash" | "bcryptCompare" | "generateRsaPem">> & {
    now?: () => number;
  } = {},
): HostRuntime {
  const maybeCrypto = cryptoApi as CryptoLike | undefined;
  if (!maybeCrypto?.getRandomValues || !maybeCrypto.subtle) {
    throw new Error("Web Crypto is required for host tool runtime.");
  }
  const cryptoLike = maybeCrypto;
  const { now = () => Date.now(), ...rest } = extras as { now?: () => number } & typeof extras;

  return {
    now,
    randomBytes(length) {
      const bytes = new Uint8Array(length);
      cryptoLike.getRandomValues(bytes);
      return bytes;
    },
    randomUint32() {
      const bytes = new Uint8Array(4);
      cryptoLike.getRandomValues(bytes);
      return ((bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!) >>> 0;
    },
    async sha256(_algorithm, data) {
      return new Uint8Array(await cryptoLike.subtle.digest("SHA-256", asBufferSource(data)));
    },
    async hmacSha256(key, message) {
      const cryptoKey = await cryptoLike.subtle.importKey(
        "raw",
        asBufferSource(key),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      return new Uint8Array(
        await cryptoLike.subtle.sign("HMAC", cryptoKey, asBufferSource(message)),
      );
    },
    aes: {
      async encrypt(key, nonce, text) {
        const cryptoKey = await cryptoLike.subtle.importKey(
          "raw",
          asBufferSource(key),
          "AES-GCM",
          false,
          ["encrypt"],
        );
        return new Uint8Array(
          await cryptoLike.subtle.encrypt(
            { name: "AES-GCM", iv: asBufferSource(nonce) },
            cryptoKey,
            asBufferSource(text),
          ),
        );
      },
      async decrypt(key, nonce, ciphertext) {
        const cryptoKey = await cryptoLike.subtle.importKey(
          "raw",
          asBufferSource(key),
          "AES-GCM",
          false,
          ["decrypt"],
        );
        return new Uint8Array(
          await cryptoLike.subtle.decrypt(
            { name: "AES-GCM", iv: asBufferSource(nonce) },
            cryptoKey,
            asBufferSource(ciphertext),
          ),
        );
      },
    },
    ...rest,
  };
}

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
