import { err, ok, type ToolResult } from "../result";
export const OBJECT_ID_LENGTH = 24;
export const OBJECT_ID_MAX_COUNTER = 0xffffff;
export type ObjectIdRandomBytes = (length: number) => Uint8Array;
export type ObjectIdParts = { value: string; timestamp: Date; counter: number };
/** Generate a MongoDB-compatible ObjectID with a 4-byte timestamp, 5 random bytes and 3-byte counter. */
export function generateObjectId(
  timestampSeconds: number,
  counter: number,
  randomBytes: ObjectIdRandomBytes,
): ToolResult<ObjectIdParts> {
  if (!Number.isInteger(timestampSeconds) || timestampSeconds < 0 || timestampSeconds > 0xffffffff)
    return err("INVALID_TIMESTAMP", "Use a Unix timestamp from 0 through 4294967295 seconds.");
  if (!Number.isInteger(counter) || counter < 0 || counter > OBJECT_ID_MAX_COUNTER)
    return err("INVALID_COUNTER", "The ObjectID counter must be between 0 and 16777215.");
  let entropy: Uint8Array;
  try {
    entropy = randomBytes(5);
  } catch {
    return err("ENTROPY_UNAVAILABLE", "Secure random generation is unavailable.");
  }
  if (!(entropy instanceof Uint8Array) || entropy.length !== 5)
    return err("INVALID_ENTROPY", "The entropy source must provide exactly 5 bytes.");
  const bytes = new Uint8Array(12);
  bytes[0] = timestampSeconds >>> 24;
  bytes[1] = timestampSeconds >>> 16;
  bytes[2] = timestampSeconds >>> 8;
  bytes[3] = timestampSeconds;
  bytes.set(entropy, 4);
  bytes[9] = counter >>> 16;
  bytes[10] = counter >>> 8;
  bytes[11] = counter;
  return ok({
    value: [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join(""),
    timestamp: new Date(timestampSeconds * 1000),
    counter,
  });
}
