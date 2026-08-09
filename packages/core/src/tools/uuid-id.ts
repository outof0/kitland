import { err, ok, type ToolResult } from "../result";

/** Number of bytes in the UUID binary representation. */
export const UUID_V4_BYTE_LENGTH = 16;

/** A source of cryptographically secure random bytes supplied by the host. */
export type UuidRandomBytes = (length: number) => Uint8Array;

export const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Generate a canonical, lower-case RFC 4122 UUID version 4.
 *
 * The core deliberately does not reach for a global `crypto` object. Every
 * host supplies its own secure random-byte source, which keeps this function
 * portable (web, extension, VS Code) and deterministically testable.
 */
export function generateUuidV4(randomBytes: UuidRandomBytes): ToolResult<string> {
  let source: Uint8Array;

  try {
    source = randomBytes(UUID_V4_BYTE_LENGTH);
  } catch {
    return err(
      "ENTROPY_UNAVAILABLE",
      "Secure random number generation is unavailable. Try a modern, secure browser context.",
    );
  }

  if (!(source instanceof Uint8Array) || source.length !== UUID_V4_BYTE_LENGTH) {
    return err(
      "INVALID_ENTROPY",
      `The random-byte source must return exactly ${UUID_V4_BYTE_LENGTH} bytes.`,
    );
  }

  // Never mutate a host-owned buffer. This matters for pooled buffers and
  // makes deterministic providers safe to reuse in tests.
  const bytes = source.slice();
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  return ok(formatUuidV4(bytes));
}

/** Format a UUID v4 byte sequence after its version and variant bits are set. */
export function formatUuidV4(bytes: Uint8Array): string {
  return [
    hex(bytes, 0, 4),
    hex(bytes, 4, 6),
    hex(bytes, 6, 8),
    hex(bytes, 8, 10),
    hex(bytes, 10, UUID_V4_BYTE_LENGTH),
  ].join("-");
}

function hex(bytes: Uint8Array, start: number, end: number): string {
  let output = "";
  for (let index = start; index < end; index++) {
    output += (bytes[index] ?? 0).toString(16).padStart(2, "0");
  }
  return output;
}
