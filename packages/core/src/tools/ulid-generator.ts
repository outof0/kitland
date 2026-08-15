import { err, ok, type ToolResult } from "../result";

export const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const ULID_LENGTH = 26;
export const ULID_MAX_TIMESTAMP = 281474976710655;
export type UlidRandomBytes = (length: number) => Uint8Array;

/** Generate a canonical uppercase ULID from a Unix millisecond timestamp. */
export function generateUlid(timestamp: number, randomBytes: UlidRandomBytes): ToolResult<string> {
  if (!Number.isInteger(timestamp) || timestamp < 0 || timestamp > ULID_MAX_TIMESTAMP)
    return err(
      "INVALID_TIMESTAMP",
      "Use a Unix millisecond timestamp from 0 through 281474976710655.",
    );
  let entropy: Uint8Array;
  try {
    entropy = randomBytes(10);
  } catch {
    return err(
      "ENTROPY_UNAVAILABLE",
      "Secure random generation is unavailable in this environment.",
    );
  }
  if (!(entropy instanceof Uint8Array) || entropy.length !== 10)
    return err("INVALID_ENTROPY", "The secure entropy source must provide exactly 10 bytes.");
  return ok(encodeBase32(BigInt(timestamp), 10) + encodeBase32(bytesToBigInt(entropy), 16));
}

function encodeBase32(value: bigint, length: number): string {
  let current = value;
  let output = "";
  for (let index = 0; index < length; index += 1) {
    output = ULID_ALPHABET[Number(current & 31n)] + output;
    current >>= 5n;
  }
  return output;
}
function bytesToBigInt(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
}
