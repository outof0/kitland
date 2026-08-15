import { err, ok, type ToolResult } from "../result";
export const RSA_MIN_MODULUS = 2048;
export const RSA_MAX_MODULUS = 4096;
export function validateRsaOptions(modulusLength: number): ToolResult<void> {
  return Number.isInteger(modulusLength) &&
    modulusLength >= RSA_MIN_MODULUS &&
    modulusLength <= RSA_MAX_MODULUS
    ? ok(undefined)
    : err(
        "INVALID_MODULUS",
        `RSA modulus must be between ${RSA_MIN_MODULUS} and ${RSA_MAX_MODULUS} bits.`,
      );
}
export function pem(label: string, bytes: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return `-----BEGIN ${label}-----\n${base64.match(/.{1,64}/g)?.join("\n") ?? ""}\n-----END ${label}-----`;
}
