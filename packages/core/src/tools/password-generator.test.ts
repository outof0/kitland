import { describe, expect, it } from "vitest";
import { generatePassword } from "./password-generator";

const entropy = (length: number) => Uint8Array.from({ length }, (_, index) => index + 7);

describe("password generator", () => {
  it("uses each enabled group and the requested length", () => {
    const result = generatePassword(
      {
        length: 16,
        lowercase: true,
        uppercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: false,
      },
      entropy,
    );
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toHaveLength(16);
    expect(result.value).toMatch(/[a-z]/);
    expect(result.value).toMatch(/[A-Z]/);
    expect(result.value).toMatch(/\d/);
    expect(result.value).toMatch(/[!@#$%^&*_\-+=?]/);
  });

  it("enforces explicit policy bounds", () => {
    expect(
      generatePassword(
        {
          length: 7,
          lowercase: true,
          uppercase: false,
          numbers: false,
          symbols: false,
          excludeAmbiguous: false,
        },
        entropy,
      ),
    ).toMatchObject({ ok: false, error: { code: "INVALID_LENGTH" } });
    expect(
      generatePassword(
        {
          length: 12,
          lowercase: false,
          uppercase: false,
          numbers: false,
          symbols: false,
          excludeAmbiguous: false,
        },
        entropy,
      ),
    ).toMatchObject({ ok: false, error: { code: "EMPTY_CHARACTER_SET" } });
  });
});
