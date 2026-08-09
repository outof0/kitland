import { err, ok, type ToolResult } from "../result";

/** QR payload bound shared by web UI and core validation. */
export const QR_CODE_MAX_INPUT_CHARS = 2_953;

export type QrCodeValidation = { input: string; length: number };

/** Validate QR payload size and emptiness without generating graphics (host renders). */
export function validateQrPayload(input: string): ToolResult<QrCodeValidation> {
  if (!input.trim()) return err("EMPTY_INPUT", "Enter text or a URL.");
  if (input.length > QR_CODE_MAX_INPUT_CHARS)
    return err(
      "INPUT_TOO_LARGE",
      `QR input exceeds ${QR_CODE_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  return ok({ input, length: input.length });
}
