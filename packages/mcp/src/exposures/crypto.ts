import {
  decryptAesGcm,
  encryptAesGcm,
  generatePassword,
  generateToken,
  hashSha256,
  inspectJwt,
  ok,
  pem,
  signHmacSha256,
  validateBcryptRequest,
  validateRsaOptions,
  type JwtInspection,
  type PasswordOptions,
  type ShaHashEncoding,
  type TokenFormat,
  type ToolResult,
} from "@kitland/core";
import {
  buildAdvertisedOutputSchema,
  DEFAULT_MCP_LIMITS,
  DEFAULT_MCP_SAFETY,
  NONDETERMINISTIC_MCP_SAFETY,
  type McpExposure,
} from "../contracts.ts";
import { createMcpError, type McpErrorPayload } from "../errors.ts";

function mapError(code: string, _message: string): McpErrorPayload {
  if (code === "INPUT_TOO_LARGE") {
    return createMcpError("INPUT_TOO_LARGE", "Input data exceeds the maximum allowed size.");
  }
  return createMcpError(
    "INVALID_INPUT",
    "The crypto operation could not be completed. Check the input format.",
  );
}

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

// ---------------------------------------------------------------------------
// SHA Hash
// ---------------------------------------------------------------------------

type ShaHashInput = {
  readonly input: string;
  readonly encoding?: "hex" | "base64" | "base64url";
};

type ShaHashOutput = {
  readonly digest: string;
  readonly algorithm: string;
  readonly encoding: string;
};

const SHA_HASH_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["input"],
  properties: {
    input: { type: "string", description: "UTF-8 text to hash." },
    encoding: {
      type: "string",
      enum: ["hex", "base64", "base64url"],
      description: "Output digest encoding (default 'hex').",
    },
  },
} as const;

const SHA_HASH_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["digest", "algorithm", "encoding"],
  properties: {
    digest: { type: "string", description: "Computed digest hash." },
    algorithm: { type: "string", description: "Hash algorithm used." },
    encoding: { type: "string", enum: ["hex", "base64", "base64url"] },
  },
} as const;

export const kitlandShaHashExposure: McpExposure<ShaHashInput, ShaHashOutput> = {
  mcpName: "kitland_sha_hash",
  operationId: "sha_hash",
  contractVersion: 1,
  registryToolId: "sha-hash",
  title: "Hash (SHA-256)",
  description: "Compute cryptographic SHA-256 digests locally from UTF-8 text.",
  inputSchema: SHA_HASH_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(SHA_HASH_SUCCESS_SCHEMA),
  successSchema: SHA_HASH_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: async (args: ShaHashInput): Promise<ToolResult<ShaHashOutput>> => {
    const encoding: ShaHashEncoding = args.encoding ?? "hex";
    const res = await hashSha256(
      args.input,
      async (_alg, data) => new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", data)),
      { encoding },
    );
    if (!res.ok) return res;
    return ok({
      digest: res.value.digest,
      algorithm: res.value.algorithm,
      encoding: res.value.encoding,
    });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// HMAC Generator
// ---------------------------------------------------------------------------

type HmacInput = {
  readonly message: string;
  readonly secret: string;
};

type HmacOutput = {
  readonly digest: string;
  readonly algorithm: string;
};

const HMAC_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["message", "secret"],
  properties: {
    message: { type: "string", description: "Message content to sign." },
    secret: { type: "string", description: "Secret key for HMAC signature." },
  },
} as const;

const HMAC_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["digest", "algorithm"],
  properties: {
    digest: { type: "string", description: "Hexadecimal HMAC-SHA-256 signature." },
    algorithm: { type: "string" },
  },
} as const;

export const kitlandHmacGenerateExposure: McpExposure<HmacInput, HmacOutput> = {
  mcpName: "kitland_hmac_generate",
  operationId: "hmac_generate",
  contractVersion: 1,
  registryToolId: "hmac-generator",
  title: "HMAC Generator",
  description: "Generate HMAC-SHA-256 signatures from a message and secret key.",
  inputSchema: HMAC_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(HMAC_SUCCESS_SCHEMA),
  successSchema: HMAC_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: async (args: HmacInput): Promise<ToolResult<HmacOutput>> => {
    const res = await signHmacSha256(args.secret, args.message, async (key, msg) => {
      const cryptoKey = await globalThis.crypto.subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const signature = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, msg);
      return new Uint8Array(signature);
    });
    if (!res.ok) return res;
    return ok({ digest: res.value.digest, algorithm: res.value.algorithm });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// AES Cipher (AES-256-GCM)
// ---------------------------------------------------------------------------

const hostAes = {
  async encrypt(key: Uint8Array, nonce: Uint8Array, text: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await globalThis.crypto.subtle.importKey("raw", key, "AES-GCM", false, [
      "encrypt",
    ]);
    const encrypted = await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      cryptoKey,
      text,
    );
    return new Uint8Array(encrypted);
  },
  async decrypt(key: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await globalThis.crypto.subtle.importKey("raw", key, "AES-GCM", false, [
      "decrypt",
    ]);
    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: nonce },
      cryptoKey,
      ciphertext,
    );
    return new Uint8Array(decrypted);
  },
};

type AesEncryptInput = {
  readonly plaintext: string;
  readonly keyHex: string;
  readonly nonceHex?: string;
};

type AesEncryptOutput = {
  readonly packet: string;
};

const AES_ENCRYPT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["plaintext", "keyHex"],
  properties: {
    plaintext: { type: "string", description: "UTF-8 plaintext to encrypt." },
    keyHex: { type: "string", description: "64-character hexadecimal key (32 bytes / 256 bits)." },
    nonceHex: {
      type: "string",
      description: "Optional 24-character hex nonce (12 bytes). Auto-generated if omitted.",
    },
  },
} as const;

const AES_ENCRYPT_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["packet"],
  properties: {
    packet: { type: "string", description: "v1 Base64 ciphertext packet." },
  },
} as const;

export const kitlandAesEncryptExposure: McpExposure<AesEncryptInput, AesEncryptOutput> = {
  mcpName: "kitland_aes_encrypt",
  operationId: "aes_encrypt",
  contractVersion: 1,
  registryToolId: "aes-cipher",
  title: "AES Encrypt",
  description: "Encrypt plaintext using AES-256-GCM into a self-contained Base64 packet.",
  inputSchema: AES_ENCRYPT_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(AES_ENCRYPT_SUCCESS_SCHEMA),
  successSchema: AES_ENCRYPT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: NONDETERMINISTIC_MCP_SAFETY,
  invoke: async (args: AesEncryptInput): Promise<ToolResult<AesEncryptOutput>> => {
    let nonceHex = args.nonceHex;
    if (!nonceHex) {
      const bytes = getRandomBytes(12);
      nonceHex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    }
    const res = await encryptAesGcm(args.keyHex, nonceHex, args.plaintext, hostAes);
    if (!res.ok) return res;
    return ok({ packet: res.value });
  },
  mapCoreError: mapError,
};

type AesDecryptInput = {
  readonly packet: string;
  readonly keyHex: string;
};

type AesDecryptOutput = {
  readonly plaintext: string;
};

const AES_DECRYPT_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["packet", "keyHex"],
  properties: {
    packet: { type: "string", description: "v1 Base64 ciphertext packet to decrypt." },
    keyHex: { type: "string", description: "64-character hexadecimal key (32 bytes / 256 bits)." },
  },
} as const;

const AES_DECRYPT_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["plaintext"],
  properties: {
    plaintext: { type: "string", description: "Decrypted UTF-8 plaintext." },
  },
} as const;

export const kitlandAesDecryptExposure: McpExposure<AesDecryptInput, AesDecryptOutput> = {
  mcpName: "kitland_aes_decrypt",
  operationId: "aes_decrypt",
  contractVersion: 1,
  registryToolId: "aes-cipher",
  title: "AES Decrypt",
  description: "Decrypt a v1 Base64 packet using AES-256-GCM with the corresponding 256-bit key.",
  inputSchema: AES_DECRYPT_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(AES_DECRYPT_SUCCESS_SCHEMA),
  successSchema: AES_DECRYPT_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: async (args: AesDecryptInput): Promise<ToolResult<AesDecryptOutput>> => {
    const res = await decryptAesGcm(args.keyHex, args.packet, hostAes);
    if (!res.ok) return res;
    return ok({ plaintext: res.value });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Bcrypt Hash & Verify
// ---------------------------------------------------------------------------

type BcryptHashInput = {
  readonly password: string;
  readonly cost?: number;
};

type BcryptHashOutput = {
  readonly hash: string;
  readonly cost: number;
};

const BCRYPT_HASH_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["password"],
  properties: {
    password: { type: "string", description: "Password to hash (up to 72 UTF-8 bytes)." },
    cost: {
      type: "integer",
      minimum: 4,
      maximum: 14,
      description: "Work factor / cost (default 10).",
    },
  },
} as const;

const BCRYPT_HASH_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["hash", "cost"],
  properties: {
    hash: { type: "string", description: "Generated bcrypt hash string." },
    cost: { type: "integer" },
  },
} as const;

export const kitlandBcryptHashExposure: McpExposure<BcryptHashInput, BcryptHashOutput> = {
  mcpName: "kitland_bcrypt_hash",
  operationId: "bcrypt_hash",
  contractVersion: 1,
  registryToolId: "bcrypt-hash",
  title: "Bcrypt Hash",
  description: "Create a salted bcrypt password hash with configurable cost factor.",
  inputSchema: BCRYPT_HASH_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(BCRYPT_HASH_SUCCESS_SCHEMA),
  successSchema: BCRYPT_HASH_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: NONDETERMINISTIC_MCP_SAFETY,
  invoke: async (args: BcryptHashInput): Promise<ToolResult<BcryptHashOutput>> => {
    const cost = args.cost ?? 10;
    const valid = validateBcryptRequest(args.password, cost);
    if (!valid.ok) return valid;
    try {
      // @ts-expect-error bcryptjs is an optional peer dependency for bcrypt hashing
      const bcrypt = await import("bcryptjs");
      const hash = await bcrypt.hash(args.password, cost);
      return ok({ hash, cost });
    } catch {
      return {
        ok: false,
        error: { code: "UNSUPPORTED", message: "Bcrypt is unavailable in this environment." },
      };
    }
  },
  mapCoreError: mapError,
};

type BcryptVerifyInput = {
  readonly password: string;
  readonly hash: string;
};

type BcryptVerifyOutput = {
  readonly match: boolean;
};

const BCRYPT_VERIFY_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["password", "hash"],
  properties: {
    password: { type: "string", description: "Password plaintext to verify." },
    hash: { type: "string", description: "Bcrypt hash string to compare against." },
  },
} as const;

const BCRYPT_VERIFY_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["match"],
  properties: {
    match: { type: "boolean", description: "True if password matches the hash." },
  },
} as const;

export const kitlandBcryptVerifyExposure: McpExposure<BcryptVerifyInput, BcryptVerifyOutput> = {
  mcpName: "kitland_bcrypt_verify",
  operationId: "bcrypt_verify",
  contractVersion: 1,
  registryToolId: "bcrypt-hash",
  title: "Bcrypt Verify",
  description: "Verify a password against a bcrypt hash string.",
  inputSchema: BCRYPT_VERIFY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(BCRYPT_VERIFY_SUCCESS_SCHEMA),
  successSchema: BCRYPT_VERIFY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: async (args: BcryptVerifyInput): Promise<ToolResult<BcryptVerifyOutput>> => {
    if (!args.hash.trim()) {
      return {
        ok: false,
        error: { code: "HASH_REQUIRED", message: "Enter a bcrypt hash to verify against." },
      };
    }
    try {
      // @ts-expect-error bcryptjs is an optional peer dependency for bcrypt verification
      const bcrypt = await import("bcryptjs");
      const match = await bcrypt.compare(args.password, args.hash);
      return ok({ match });
    } catch {
      return {
        ok: false,
        error: { code: "UNSUPPORTED", message: "Bcrypt is unavailable in this environment." },
      };
    }
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// JWT Decoder
// ---------------------------------------------------------------------------

type JwtDecodeInput = {
  readonly token: string;
};

type FormattedJwtInspection = {
  readonly header: Record<string, unknown>;
  readonly payload: Record<string, unknown>;
  readonly signature: string;
  readonly expiresAt: string | null;
  readonly issuedAt: string | null;
};

const JWT_DECODE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["token"],
  properties: {
    token: { type: "string", description: "JSON Web Token (JWT) string." },
  },
} as const;

const JWT_DECODE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["header", "payload", "signature", "expiresAt", "issuedAt"],
  properties: {
    header: { type: "object", description: "Decoded JWT header." },
    payload: { type: "object", description: "Decoded JWT claims payload." },
    signature: { type: "string", description: "Raw signature segment." },
    expiresAt: {
      type: ["string", "null"],
      description: "ISO timestamp of expiration (exp claim).",
    },
    issuedAt: { type: ["string", "null"], description: "ISO timestamp of issuance (iat claim)." },
  },
} as const;

export const kitlandJwtDecodeExposure: McpExposure<JwtDecodeInput, FormattedJwtInspection> = {
  mcpName: "kitland_jwt_decode",
  operationId: "jwt_decode",
  contractVersion: 1,
  registryToolId: "jwt-decoder",
  title: "JWT Decoder",
  description: "Decode and inspect JSON Web Token header and payload claims.",
  inputSchema: JWT_DECODE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(JWT_DECODE_SUCCESS_SCHEMA),
  successSchema: JWT_DECODE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: DEFAULT_MCP_SAFETY,
  invoke: (args: JwtDecodeInput): ToolResult<FormattedJwtInspection> => {
    const res: ToolResult<JwtInspection> = inspectJwt(args.token);
    if (!res.ok) return res;
    return ok({
      header: res.value.header,
      payload: res.value.payload,
      signature: res.value.signature,
      expiresAt: res.value.expiresAt?.toISOString() ?? null,
      issuedAt: res.value.issuedAt?.toISOString() ?? null,
    });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Token Generator
// ---------------------------------------------------------------------------

type TokenGenerateInput = {
  readonly length?: number;
  readonly format?: "hex" | "base64url";
};

type TokenGenerateOutput = {
  readonly token: string;
  readonly length: number;
  readonly format: string;
};

const TOKEN_GENERATE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    length: {
      type: "integer",
      minimum: 1,
      maximum: 4096,
      description: "Token length (default 32).",
    },
    format: {
      type: "string",
      enum: ["hex", "base64url"],
      description: "Token format (default 'hex').",
    },
  },
} as const;

const TOKEN_GENERATE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["token", "length", "format"],
  properties: {
    token: { type: "string", description: "Generated random token." },
    length: { type: "integer" },
    format: { type: "string" },
  },
} as const;

export const kitlandTokenGenerateExposure: McpExposure<TokenGenerateInput, TokenGenerateOutput> = {
  mcpName: "kitland_token_generate",
  operationId: "token_generate",
  contractVersion: 1,
  registryToolId: "token-generator",
  title: "Token Generator",
  description: "Generate cryptographically secure random secret tokens.",
  inputSchema: TOKEN_GENERATE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(TOKEN_GENERATE_SUCCESS_SCHEMA),
  successSchema: TOKEN_GENERATE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: NONDETERMINISTIC_MCP_SAFETY,
  invoke: (args: TokenGenerateInput): ToolResult<TokenGenerateOutput> => {
    const length = args.length ?? 32;
    const format: TokenFormat = args.format ?? "hex";
    const res = generateToken(length, format, getRandomBytes);
    if (!res.ok) return res;
    return ok({ token: res.value, length, format });
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// RSA Key Pair Generator
// ---------------------------------------------------------------------------

type RsaKeyInput = {
  readonly modulusLength?: 2048 | 4096;
};

type RsaKeyOutput = {
  readonly publicKey: string;
  readonly privateKey: string;
  readonly modulusLength: number;
};

const RSA_KEY_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    modulusLength: {
      type: "integer",
      enum: [2048, 4096],
      description: "RSA key modulus length in bits (2048 or 4096, default 2048).",
    },
  },
} as const;

const RSA_KEY_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["publicKey", "privateKey", "modulusLength"],
  properties: {
    publicKey: { type: "string", description: "PEM-encoded public key." },
    privateKey: { type: "string", description: "PEM-encoded PKCS#8 private key." },
    modulusLength: { type: "integer" },
  },
} as const;

export const kitlandRsaKeyPairExposure: McpExposure<RsaKeyInput, RsaKeyOutput> = {
  mcpName: "kitland_rsa_key_pair_generate",
  operationId: "rsa_key_pair_generate",
  contractVersion: 1,
  registryToolId: "rsa-key-pair",
  title: "RSA Key Pair Generator",
  description: "Generate an RSA key pair in standard PEM format locally with Web Crypto.",
  inputSchema: RSA_KEY_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(RSA_KEY_SUCCESS_SCHEMA),
  successSchema: RSA_KEY_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: NONDETERMINISTIC_MCP_SAFETY,
  invoke: async (args: RsaKeyInput): Promise<ToolResult<RsaKeyOutput>> => {
    const modulusLength = args.modulusLength ?? 2048;
    const valid = validateRsaOptions(modulusLength);
    if (!valid.ok) return valid;
    try {
      const pair = await globalThis.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"],
      );
      const publicKeyBuf = await globalThis.crypto.subtle.exportKey("spki", pair.publicKey);
      const privateKeyBuf = await globalThis.crypto.subtle.exportKey("pkcs8", pair.privateKey);
      return ok({
        publicKey: pem("PUBLIC KEY", publicKeyBuf),
        privateKey: pem("PRIVATE KEY", privateKeyBuf),
        modulusLength,
      });
    } catch {
      return {
        ok: false,
        error: { code: "GENERATE_FAILED", message: "RSA key generation failed." },
      };
    }
  },
  mapCoreError: mapError,
};

// ---------------------------------------------------------------------------
// Password Generator
// ---------------------------------------------------------------------------

type PasswordGenerateInput = {
  readonly length?: number;
  readonly lowercase?: boolean;
  readonly uppercase?: boolean;
  readonly numbers?: boolean;
  readonly symbols?: boolean;
  readonly excludeAmbiguous?: boolean;
};

type PasswordGenerateOutput = {
  readonly password: string;
  readonly length: number;
};

const PASSWORD_GENERATE_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    length: {
      type: "integer",
      minimum: 8,
      maximum: 128,
      description: "Password length (default 16).",
    },
    lowercase: { type: "boolean", description: "Include lowercase letters (default true)." },
    uppercase: { type: "boolean", description: "Include uppercase letters (default true)." },
    numbers: { type: "boolean", description: "Include numbers (default true)." },
    symbols: { type: "boolean", description: "Include special symbols (default true)." },
    excludeAmbiguous: {
      type: "boolean",
      description: "Exclude ambiguous characters (0, O, 1, l, I) (default true).",
    },
  },
} as const;

const PASSWORD_GENERATE_SUCCESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["password", "length"],
  properties: {
    password: { type: "string", description: "Generated secure password." },
    length: { type: "integer" },
  },
} as const;

export const kitlandPasswordGenerateExposure: McpExposure<
  PasswordGenerateInput,
  PasswordGenerateOutput
> = {
  mcpName: "kitland_password_generate",
  operationId: "password_generate",
  contractVersion: 1,
  registryToolId: "password-generator",
  title: "Password Generator",
  description: "Generate policy-controlled secure passwords locally with cryptographic entropy.",
  inputSchema: PASSWORD_GENERATE_INPUT_SCHEMA,
  outputSchema: buildAdvertisedOutputSchema(PASSWORD_GENERATE_SUCCESS_SCHEMA),
  successSchema: PASSWORD_GENERATE_SUCCESS_SCHEMA,
  limits: DEFAULT_MCP_LIMITS,
  safety: NONDETERMINISTIC_MCP_SAFETY,
  invoke: (args: PasswordGenerateInput): ToolResult<PasswordGenerateOutput> => {
    const options: PasswordOptions = {
      length: args.length ?? 16,
      lowercase: args.lowercase ?? true,
      uppercase: args.uppercase ?? true,
      numbers: args.numbers ?? true,
      symbols: args.symbols ?? true,
      excludeAmbiguous: args.excludeAmbiguous ?? true,
    };
    const res = generatePassword(options, getRandomBytes);
    if (!res.ok) return res;
    return ok({ password: res.value, length: options.length });
  },
  mapCoreError: mapError,
};

export const CRYPTO_EXPOSURES = [
  kitlandShaHashExposure,
  kitlandHmacGenerateExposure,
  kitlandAesEncryptExposure,
  kitlandAesDecryptExposure,
  kitlandBcryptHashExposure,
  kitlandBcryptVerifyExposure,
  kitlandJwtDecodeExposure,
  kitlandTokenGenerateExposure,
  kitlandRsaKeyPairExposure,
  kitlandPasswordGenerateExposure,
] as const;
