import { err, ok, type ToolResult } from "../result";
/** bcrypt truncates inputs at 72 UTF-8 bytes; reject instead of silently truncating. */
export const BCRYPT_MAX_INPUT_BYTES = 72;
export const BCRYPT_MIN_COST = 4;
export const BCRYPT_MAX_COST = 14;
export function validateBcryptRequest(password: string, cost: number): ToolResult<void> {
  if (password.length === 0) return err("PASSWORD_REQUIRED", "Enter a password to hash.");
  if (new TextEncoder().encode(password).length > BCRYPT_MAX_INPUT_BYTES) {
    return err(
      "PASSWORD_TOO_LONG",
      "bcrypt accepts at most 72 UTF-8 bytes; shorten this password.",
    );
  }
  if (!Number.isInteger(cost) || cost < BCRYPT_MIN_COST || cost > BCRYPT_MAX_COST) {
    return err(
      "INVALID_COST",
      `Cost must be a whole number from ${BCRYPT_MIN_COST} to ${BCRYPT_MAX_COST}.`,
    );
  }
  return ok(undefined);
}
