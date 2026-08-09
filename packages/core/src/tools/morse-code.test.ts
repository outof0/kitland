import { describe, expect, it } from "vitest";
import { decodeMorse, encodeMorse, MORSE_CODE_MAX_INPUT_CHARS, runMorseCode } from "./morse-code";

describe("morse-code", () => {
  it("round-trips SOS and words", () => {
    const encoded = encodeMorse("SOS HELP");
    expect(encoded).toEqual({ ok: true, value: "... --- ... / .... . .-.. .--." });
    if (!encoded.ok) return;
    expect(decodeMorse(encoded.value)).toEqual({ ok: true, value: "SOS HELP" });
  });

  it("handles alternative word separators in decode: 3 spaces, 2 spaces, pipe, slash", () => {
    expect(decodeMorse("... --- ...   .... . .-.. .--.")).toEqual({
      ok: true,
      value: "SOS HELP",
    });
    expect(decodeMorse("... --- ...  .... . .-.. .--.")).toEqual({
      ok: true,
      value: "SOS HELP",
    });
    expect(decodeMorse("... --- ... | .... . .-.. .--.")).toEqual({
      ok: true,
      value: "SOS HELP",
    });
    expect(decodeMorse("... --- .../.... . .-.. .--.")).toEqual({
      ok: true,
      value: "SOS HELP",
    });
  });

  it("normalizes unicode dots and dashes in decode", () => {
    expect(decodeMorse("••• −−− •••")).toEqual({ ok: true, value: "SOS" });
    expect(decodeMorse("··· ——— ···")).toEqual({ ok: true, value: "SOS" });
    expect(decodeMorse("... ___ ...")).toEqual({ ok: true, value: "SOS" });
  });

  it("normalizes typographic quotes and dashes in encode", () => {
    expect(encodeMorse("“HELLO” — ‘WORLD’")).toEqual({
      ok: true,
      value: ".-..-. .... . .-.. .-.. --- .-..-. / -....- / .----. .-- --- .-. .-.. -.. .----.",
    });
  });

  it("preserves line breaks across multiline text in encode and decode", () => {
    const multiline = "HELLO\nWORLD";
    const encoded = encodeMorse(multiline);
    expect(encoded).toEqual({
      ok: true,
      value: ".... . .-.. .-.. ---\n.-- --- .-. .-.. -..",
    });
    if (!encoded.ok) return;
    expect(decodeMorse(encoded.value)).toEqual({
      ok: true,
      value: "HELLO\nWORLD",
    });
  });

  it("handles numbers and standard punctuation", () => {
    const text = "CODE 123, STOP!";
    const encoded = encodeMorse(text);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    expect(decodeMorse(encoded.value)).toEqual({
      ok: true,
      value: "CODE 123, STOP!",
    });
  });

  it("returns empty string on whitespace or empty input", () => {
    expect(encodeMorse("")).toEqual({ ok: true, value: "" });
    expect(encodeMorse("   ")).toEqual({ ok: true, value: "" });
    expect(decodeMorse("")).toEqual({ ok: true, value: "" });
    expect(decodeMorse("   ")).toEqual({ ok: true, value: "" });
  });

  it("rejects unknown characters and oversized input", () => {
    expect(encodeMorse("café").ok).toBe(false);
    expect(encodeMorse("x".repeat(MORSE_CODE_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(decodeMorse("x".repeat(MORSE_CODE_MAX_INPUT_CHARS + 1)).ok).toBe(false);
    expect(runMorseCode("decode", "......").ok).toBe(false);
    expect(runMorseCode("decode", "HELLO").ok).toBe(false);
    expect(runMorseCode("invalid" as any, "SOS").ok).toBe(false);
  });
});
