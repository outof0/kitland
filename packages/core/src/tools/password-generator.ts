import { err, ok, type ToolResult } from "../result";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordOptions = {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
};
export type PasswordRandomBytes = (length: number) => Uint8Array;

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*_-+=?";
const AMBIGUOUS = new Set("0O1lI|");

export function generatePassword(
  options: PasswordOptions,
  randomBytes: PasswordRandomBytes,
): ToolResult<string> {
  if (
    !Number.isInteger(options.length) ||
    options.length < PASSWORD_MIN_LENGTH ||
    options.length > PASSWORD_MAX_LENGTH
  )
    return err("INVALID_LENGTH", "Choose a password length between 8 and 128.");
  const groups = [
    options.lowercase && LOWERCASE,
    options.uppercase && UPPERCASE,
    options.numbers && NUMBERS,
    options.symbols && SYMBOLS,
  ]
    .filter((group): group is string => Boolean(group))
    .map((group) =>
      options.excludeAmbiguous
        ? [...group].filter((character) => !AMBIGUOUS.has(character)).join("")
        : group,
    );
  if (groups.length === 0)
    return err("EMPTY_CHARACTER_SET", "Enable at least one character group.");
  if (options.length < groups.length)
    return err("INVALID_LENGTH", "The length must fit every enabled character group.");

  const alphabet = groups.join("");
  const characters = groups.map((group) => pick(group, randomBytes));
  while (characters.length < options.length) characters.push(pick(alphabet, randomBytes));
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const target = randomIndex(index + 1, randomBytes);
    [characters[index], characters[target]] = [characters[target] ?? "", characters[index] ?? ""];
  }
  return ok(characters.join(""));
}

function pick(alphabet: string, randomBytes: PasswordRandomBytes): string {
  return alphabet[randomIndex(alphabet.length, randomBytes)] ?? "";
}

function randomIndex(size: number, randomBytes: PasswordRandomBytes): number {
  const limit = 256 - (256 % size);
  for (;;) {
    const value = randomBytes(1)[0];
    if (value === undefined) throw new Error("Secure entropy provider returned no bytes.");
    if (value < limit) return value % size;
  }
}
