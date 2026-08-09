import { err, ok, type ToolResult } from "../result";

export const MORSE_CODE_MAX_INPUT_CHARS = 100_000;
export type MorseMode = "encode" | "decode";

const TABLE: Readonly<Record<string, string>> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-",
  '"': ".-..-.",
  $: "...-..-",
  "@": ".--.-.",
};

const REVERSE: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(TABLE).map(([k, v]) => [v, k]),
);

const DOT_REGEX = /[•·∙●․‧]/g;
const DASH_REGEX = /[−–—_―─━ー‐‑]/g;

export function encodeMorse(input: string): ToolResult<string> {
  if (input.length > MORSE_CODE_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Input exceeds ${MORSE_CODE_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  if (!input.trim()) return ok("");

  // Normalize typographic quotes and dashes
  const normalized = input
    .replace(/[“”„«»]/g, '"')
    .replace(/[‘’‚‹›]/g, "'")
    .replace(/[—–−―─━ー‐‑]/g, "-");

  const lines = normalized.split(/\r?\n/);
  const encodedLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      encodedLines.push("");
      continue;
    }

    const words = trimmedLine.toUpperCase().split(/\s+/u);
    const encodedWords: string[] = [];

    for (const word of words) {
      const letters: string[] = [];
      for (const ch of word) {
        const code = TABLE[ch];
        if (!code) {
          return err("UNSUPPORTED_CHARACTER", `No Morse mapping for "${ch}".`);
        }
        letters.push(code);
      }
      encodedWords.push(letters.join(" "));
    }

    encodedLines.push(encodedWords.join(" / "));
  }

  return ok(encodedLines.join("\n"));
}

export function decodeMorse(input: string): ToolResult<string> {
  if (input.length > MORSE_CODE_MAX_INPUT_CHARS) {
    return err(
      "INPUT_TOO_LARGE",
      `Input exceeds ${MORSE_CODE_MAX_INPUT_CHARS.toLocaleString()} characters.`,
    );
  }

  if (!input.trim()) return ok("");

  const lines = input.split(/\r?\n/);
  const decodedLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      decodedLines.push("");
      continue;
    }

    // Split words by slash (/), pipe (|), or 2+ whitespace characters
    const words = trimmedLine.split(/\s*(?:\/|\||\s{2,})\s*/u);
    const decodedWords: string[] = [];

    for (const word of words) {
      if (!word.trim()) continue;
      let out = "";
      const tokens = word.trim().split(/\s+/u);

      for (const rawToken of tokens) {
        const token = rawToken.replace(DOT_REGEX, ".").replace(DASH_REGEX, "-");
        const ch = REVERSE[token];
        if (!ch) {
          return err("INVALID_MORSE", `Unknown Morse sequence "${rawToken}".`);
        }
        out += ch;
      }

      decodedWords.push(out);
    }

    decodedLines.push(decodedWords.join(" "));
  }

  return ok(decodedLines.join("\n"));
}

export function runMorseCode(mode: MorseMode, input: string): ToolResult<string> {
  if (mode === "encode") return encodeMorse(input);
  if (mode === "decode") return decodeMorse(input);
  return err("INVALID_MODE", "Morse mode must be encode or decode.");
}
