import { err, ok, type ToolResult } from "../result";

export const LOREM_MAX_AMOUNT = 10_000;
export const LOREM_MAX_OUTPUT_BYTES = 100_000;

export type LoremUnit = "paragraphs" | "words" | "bytes" | "list-items";
export type LoremIpsumOptions = {
  amount: number;
  unit: LoremUnit;
  startWithClassic?: boolean;
};

const WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
] as const;
const WORDS_PER_PARAGRAPH = 40;

/** Generate bounded, deterministic placeholder text without network or entropy. */
export function generateLoremIpsum(options: LoremIpsumOptions): ToolResult<string> {
  const { amount, unit, startWithClassic = true } = options;
  if (!Number.isInteger(amount) || amount < 1 || amount > LOREM_MAX_AMOUNT) {
    return err(
      "INVALID_AMOUNT",
      `Amount must be a whole number from 1 to ${LOREM_MAX_AMOUNT.toLocaleString()}.`,
    );
  }
  if (unit !== "paragraphs" && unit !== "words" && unit !== "bytes" && unit !== "list-items") {
    return err("INVALID_UNIT", "Choose paragraphs, words, bytes, or list items.");
  }

  const output =
    unit === "paragraphs"
      ? generateParagraphs(amount, startWithClassic)
      : unit === "words"
        ? sentenceFromWords(amount, 0, startWithClassic)
        : unit === "list-items"
          ? generateListItems(amount, startWithClassic)
          : generateBytes(amount, startWithClassic);
  const byteLength = new TextEncoder().encode(output).length;
  if (byteLength > LOREM_MAX_OUTPUT_BYTES) {
    return err(
      "OUTPUT_TOO_LARGE",
      `Generated text exceeds the ${LOREM_MAX_OUTPUT_BYTES.toLocaleString()} byte output limit.`,
    );
  }
  return ok(output);
}

function generateParagraphs(amount: number, startWithClassic: boolean): string {
  return Array.from({ length: amount }, (_, index) =>
    sentenceFromWords(
      WORDS_PER_PARAGRAPH,
      index * WORDS_PER_PARAGRAPH,
      startWithClassic && index === 0,
    ),
  ).join("\n\n");
}

function generateListItems(amount: number, startWithClassic: boolean): string {
  return Array.from({ length: amount }, (_, index) => {
    const sentence = sentenceFromWords(12, index * 12, startWithClassic && index === 0);
    return `- ${sentence}`;
  }).join("\n");
}

function generateBytes(amount: number, startWithClassic: boolean): string {
  if (amount > LOREM_MAX_OUTPUT_BYTES) {
    // The explicit byte mode should distinguish an unfulfillable byte target
    // from a syntactically invalid amount.
    return "";
  }
  let text = "";
  let wordOffset = 0;
  while (text.length < amount) {
    const next = sentenceFromWords(WORDS.length, wordOffset, startWithClassic && wordOffset === 0);
    text += (text ? " " : "") + next;
    wordOffset += WORDS.length;
  }
  return text.slice(0, amount);
}

function sentenceFromWords(amount: number, offset: number, startWithClassic: boolean): string {
  const words: string[] = Array.from(
    { length: amount },
    (_, index) => WORDS[(offset + index) % WORDS.length] ?? "",
  );
  if (startWithClassic && offset === 0 && amount >= 5) {
    words.splice(0, 5, "Lorem", "ipsum", "dolor", "sit", "amet,");
  } else if (words[0]) {
    words[0] = upperFirst(words[0]);
  }
  return `${words.join(" ")}.`;
}

function upperFirst(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
