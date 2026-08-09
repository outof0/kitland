import { err, ok, type ToolResult } from "../result";

export const AES_GCM_KEY_BYTES = 32;
export const AES_GCM_NONCE_BYTES = 12;
export const AES_CIPHER_MAX_INPUT_CHARS = 2_000_000;
const PACKET_PREFIX = "v1:";

export type AesGcmHost = {
  encrypt(key: Uint8Array, nonce: Uint8Array, text: Uint8Array): Promise<Uint8Array>;
  decrypt(key: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array): Promise<Uint8Array>;
};

export async function encryptAesGcm(
  keyHex: string,
  nonceHex: string,
  text: string,
  host: AesGcmHost,
): Promise<ToolResult<string>> {
  const inputs = parseInputs(keyHex, nonceHex, text);
  if (!inputs.ok) return inputs;
  try {
    const sealed = await host.encrypt(
      inputs.value.key,
      inputs.value.nonce,
      new TextEncoder().encode(text),
    );
    return ok(PACKET_PREFIX + toBase64(concat(inputs.value.nonce, sealed)));
  } catch {
    return err("ENCRYPT_FAILED", "AES-256-GCM encryption failed in this environment.");
  }
}

export async function decryptAesGcm(
  keyHex: string,
  packet: string,
  host: AesGcmHost,
): Promise<ToolResult<string>> {
  const key = parseHex(keyHex, AES_GCM_KEY_BYTES, "Key");
  if (!key.ok) return key;
  if (!packet.startsWith(PACKET_PREFIX))
    return err("INVALID_PACKET", "Ciphertext must use the v1 Base64 packet format.");
  const bytes = fromBase64(packet.slice(PACKET_PREFIX.length));
  if (!bytes || bytes.length <= AES_GCM_NONCE_BYTES)
    return err("INVALID_PACKET", "Ciphertext packet is invalid.");
  try {
    return ok(
      new TextDecoder("utf-8", { fatal: true }).decode(
        await host.decrypt(
          key.value,
          bytes.slice(0, AES_GCM_NONCE_BYTES),
          bytes.slice(AES_GCM_NONCE_BYTES),
        ),
      ),
    );
  } catch {
    return err("DECRYPT_FAILED", "Could not decrypt this packet with the supplied key.");
  }
}

function parseInputs(
  keyHex: string,
  nonceHex: string,
  text: string,
): ToolResult<{ key: Uint8Array; nonce: Uint8Array }> {
  if (text.length > AES_CIPHER_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "Message exceeds the allowed size.");
  const key = parseHex(keyHex, AES_GCM_KEY_BYTES, "Key");
  if (!key.ok) return key;
  const nonce = parseHex(nonceHex, AES_GCM_NONCE_BYTES, "Nonce");
  if (!nonce.ok) return nonce;
  return ok({ key: key.value, nonce: nonce.value });
}
function parseHex(value: string, expected: number, label: string): ToolResult<Uint8Array> {
  if (!/^[0-9a-fA-F]+$/.test(value) || value.length !== expected * 2)
    return err("INVALID_HEX", `${label} must be exactly ${expected} bytes of hexadecimal.`);
  const bytes = new Uint8Array(expected);
  for (let i = 0; i < expected; i++) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return ok(bytes);
}
function concat(a: Uint8Array, b: Uint8Array) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
}
function toBase64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromBase64(value: string) {
  try {
    const s = atob(value);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}
