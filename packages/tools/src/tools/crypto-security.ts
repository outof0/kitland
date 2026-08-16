import { defineTool } from "../define-tool";
import type { ToolDefinition } from "../types";

const multiHostTransformPlatforms = Object.freeze({
  web: {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write"] as const,
  },
  "browser-extension": {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write"] as const,
  },
  "vscode-extension": {
    status: "available" as const,
    capabilities: ["transform-text", "clipboard-write", "active-editor"] as const,
  },
});

export const shaHashTool = defineTool({
  id: "sha-hash",
  slug: "sha-hash",
  name: "Hash (SHA)",
  shortName: "SHA Hash",
  family: "hash-crypto",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Compute SHA-256 digests locally for supplied UTF-8 text.",
  keywords: ["sha", "hash", "sha256", "digest"],
  designFrame: "Hash (SHA) (U1lUQ0)",
  platforms: multiHostTransformPlatforms,
} as const);

export const hmacGeneratorTool = defineTool({
  id: "hmac-generator",
  slug: "hmac-generator",
  name: "HMAC Generator",
  shortName: "HMAC",
  family: "hash-crypto",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Create HMAC-SHA-256 signatures locally from a secret and message.",
  keywords: ["hmac", "sha256", "signature", "keyed hash"],
  designFrame: "HMAC Generator (p0yzv)",
  platforms: multiHostTransformPlatforms,
} as const);

export const aesCipherTool = defineTool({
  id: "aes-cipher",
  slug: "aes-cipher",
  name: "AES Cipher",
  shortName: "AES Cipher",
  family: "hash-crypto",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Encrypt and decrypt UTF-8 text locally with authenticated AES-256-GCM.",
  keywords: ["aes", "encrypt", "decrypt", "gcm"],
  designFrame: "AES Cipher (zes65)",
  platforms: multiHostTransformPlatforms,
} as const);

export const bcryptHashTool = defineTool({
  id: "bcrypt-hash",
  slug: "bcrypt-hash",
  name: "Bcrypt Hash",
  shortName: "Bcrypt",
  family: "hash-crypto",
  pattern: "transform",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Create and verify bcrypt password hashes with custom cost factors locally.",
  keywords: ["bcrypt", "password", "hash"],
  designFrame: "Bcrypt Hash (nWBbg)",
  platforms: multiHostTransformPlatforms,
} as const);

export const jwtDecoderTool = defineTool({
  id: "jwt-decoder",
  slug: "jwt-decoder",
  name: "JWT Decoder",
  shortName: "JWT Decoder",
  family: "hash-crypto",
  pattern: "inspect",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Inspect the JWT header and claims locally without signature verification.",
  keywords: ["jwt", "token", "decode", "claims"],
  designFrame: "JWT Decoder (R5HFcw)",
  platforms: multiHostTransformPlatforms,
} as const);

export const tokenGeneratorTool = defineTool({
  id: "token-generator",
  slug: "token-generator",
  name: "Token Generator",
  shortName: "Token Generator",
  family: "hash-crypto",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate secure random tokens locally with Web Crypto.",
  keywords: ["token", "secret", "random", "generate"],
  designFrame: "Token Generator (KHKID)",
  platforms: multiHostTransformPlatforms,
} as const);

export const rsaKeyPairTool = defineTool({
  id: "rsa-key-pair",
  slug: "rsa-key-pair",
  name: "RSA Key Pair",
  shortName: "RSA Key Pair",
  family: "hash-crypto",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate RSA-OAEP public and private PEM key pairs locally with Web Crypto.",
  keywords: ["rsa", "key", "pem", "generate"],
  designFrame: "RSA Key Pair (Oi5nT)",
  platforms: multiHostTransformPlatforms,
} as const);

export const passwordGeneratorTool = defineTool({
  id: "password-generator",
  slug: "password-generator",
  name: "Password Generator",
  shortName: "Password Generator",
  family: "generators",
  pattern: "generate",
  status: "available",
  releaseStage: "release-ready",
  releasePlatforms: ["web", "browser-extension", "vscode-extension"],
  description: "Generate policy-controlled passwords locally with Web Crypto.",
  keywords: ["password", "random", "generate", "secret"],
  designFrame: "Password Generator (DLGia)",
  platforms: multiHostTransformPlatforms,
} as const);

export const cryptoSecurityTools = [
  shaHashTool,
  hmacGeneratorTool,
  aesCipherTool,
  bcryptHashTool,
  jwtDecoderTool,
  tokenGeneratorTool,
  rsaKeyPairTool,
  passwordGeneratorTool,
] as const satisfies readonly ToolDefinition[];
