import { err, ok, type ToolResult } from "../result";

export const NUMBER_BASE_MAX_INPUT_CHARS = 4_096;
export type NumberBaseResult = { value: string; fromBase: number; toBase: number };

export function convertNumberBase(
  input: string,
  fromBase: number,
  toBase: number,
): ToolResult<NumberBaseResult> {
  if (input.length > NUMBER_BASE_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "Number text exceeds the size limit.");
  if (!Number.isInteger(fromBase) || fromBase < 2 || fromBase > 36)
    return err("INVALID_BASE", "From base must be an integer from 2 to 36.");
  if (!Number.isInteger(toBase) || toBase < 2 || toBase > 36)
    return err("INVALID_BASE", "To base must be an integer from 2 to 36.");
  const raw = input.trim();
  if (!raw) return err("EMPTY_INPUT", "Enter a number to convert.");
  const negative = raw.startsWith("-");
  const body = raw.replace(/^[+-]/, "").replace(/^0x/i, "").toUpperCase();
  if (!body) return err("INVALID_NUMBER", "Enter a number using the source base alphabet.");
  const parsed = parseWithBase(body, fromBase);
  if (parsed === null) return err("INVALID_DIGIT", "A digit is outside the source base.");
  const value = negative ? -parsed : parsed;
  const abs = value < 0n ? -value : value;
  const digits = toBaseString(abs, toBase);
  return ok({ value: `${value < 0n ? "-" : ""}${digits}`, fromBase, toBase });
}

function parseWithBase(body: string, base: number): bigint | null {
  let n = 0n;
  const b = BigInt(base);
  for (const ch of body) {
    const digit = ch >= "0" && ch <= "9" ? ch.charCodeAt(0) - 48 : ch.charCodeAt(0) - 55;
    if (digit < 0 || digit >= base) return null;
    n = n * b + BigInt(digit);
  }
  return n;
}

function toBaseString(value: bigint, base: number): string {
  if (value === 0n) return "0";
  const b = BigInt(base);
  let n = value;
  let out = "";
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  while (n > 0n) {
    const d = Number(n % b);
    out = alphabet[d] + out;
    n /= b;
  }
  return out;
}
