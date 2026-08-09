import { describe, expect, it } from "vitest";
import {
  UUID_V4_BYTE_LENGTH,
  UUID_V4_PATTERN,
  formatUuidV4,
  generateUuidV4,
  type UuidRandomBytes,
} from "./uuid-id";

describe("generateUuidV4", () => {
  it("formats an injected byte sequence with RFC 4122 version and variant bits", () => {
    const randomBytes: UuidRandomBytes = () =>
      Uint8Array.from([
        0xf4, 0x7a, 0xc1, 0x0b, 0x58, 0xcc, 0x03, 0x72, 0x25, 0x67, 0x0e, 0x02, 0xb2, 0xc8, 0xc4,
        0x79,
      ]);

    expect(generateUuidV4(randomBytes)).toEqual({
      ok: true,
      value: "f47ac10b-58cc-4372-a567-0e02b2c8c479",
    });
  });

  it("uses exactly 16 bytes and does not mutate a provider-owned buffer", () => {
    const supplied = new Uint8Array(UUID_V4_BYTE_LENGTH);
    let requestedLength = 0;

    const result = generateUuidV4((length) => {
      requestedLength = length;
      return supplied;
    });

    expect(requestedLength).toBe(UUID_V4_BYTE_LENGTH);
    expect(supplied).toEqual(new Uint8Array(UUID_V4_BYTE_LENGTH));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatch(UUID_V4_PATTERN);
  });

  it("does not pass malformed entropy through as an identifier", () => {
    const result = generateUuidV4(() => new Uint8Array(UUID_V4_BYTE_LENGTH - 1));

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_ENTROPY",
        message: "The random-byte source must return exactly 16 bytes.",
      },
    });
  });

  it("rejects a non-Uint8Array source at the host boundary", () => {
    const result = generateUuidV4(
      () => new ArrayBuffer(UUID_V4_BYTE_LENGTH) as unknown as Uint8Array,
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_ENTROPY",
        message: "The random-byte source must return exactly 16 bytes.",
      },
    });
  });

  it("maps a random-source exception to an actionable, host-neutral error", () => {
    const result = generateUuidV4(() => {
      throw new Error("blocked");
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "ENTROPY_UNAVAILABLE",
        message:
          "Secure random number generation is unavailable. Try a modern, secure browser context.",
      },
    });
  });
});

describe("formatUuidV4", () => {
  it("renders lower-case hexadecimal in the canonical 8-4-4-4-12 grouping", () => {
    expect(
      formatUuidV4(Uint8Array.from({ length: UUID_V4_BYTE_LENGTH }, (_, index) => index)),
    ).toBe("00010203-0405-0607-0809-0a0b0c0d0e0f");
  });
});
