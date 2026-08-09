import { err, ok, type ToolResult } from "../result";
import type { SecureRandomUint32 } from "./random-port";

export const RANDOM_NUMBER_MAX_COUNT = 100;
export const RANDOM_NUMBER_MAX_DECIMALS = 6;
export const RANDOM_NUMBER_MAX_STEPS = 1_000_000_000;

export type RandomNumberOptions = {
  from: number;
  to: number;
  decimals?: number;
  count?: number;
};
export type RandomNumberResult = {
  values: number[];
  decimals: number;
};

/** Generate uniformly distributed values on a bounded decimal grid from secure injected entropy. */
export function generateRandomNumbers(
  options: RandomNumberOptions,
  randomUint32: SecureRandomUint32,
): ToolResult<RandomNumberResult> {
  const decimals = options.decimals ?? 0;
  const count = options.count ?? 1;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > RANDOM_NUMBER_MAX_DECIMALS) {
    return err(
      "INVALID_DECIMALS",
      `Decimals must be a whole number from 0 to ${RANDOM_NUMBER_MAX_DECIMALS}.`,
    );
  }
  if (!Number.isInteger(count) || count < 1 || count > RANDOM_NUMBER_MAX_COUNT) {
    return err(
      "INVALID_COUNT",
      `Count must be a whole number from 1 to ${RANDOM_NUMBER_MAX_COUNT}.`,
    );
  }
  if (!Number.isFinite(options.from) || !Number.isFinite(options.to) || options.from > options.to) {
    return err(
      "INVALID_RANGE",
      "From and To must be finite numbers where From is not greater than To.",
    );
  }

  const scale = 10 ** decimals;
  const min = Math.ceil(options.from * scale);
  const max = Math.floor(options.to * scale);
  const steps = max - min + 1;
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    steps < 1 ||
    steps > RANDOM_NUMBER_MAX_STEPS
  ) {
    return err(
      "INVALID_RANGE",
      `The decimal range must contain from 1 to ${RANDOM_NUMBER_MAX_STEPS.toLocaleString()} representable values.`,
    );
  }

  const values: number[] = [];
  for (let index = 0; index < count; index++) {
    const next = randomGridValue(min, steps, scale, randomUint32);
    if (!next.ok) return next;
    values.push(next.value);
  }
  return ok({ values, decimals });
}

function randomGridValue(
  min: number,
  steps: number,
  scale: number,
  randomUint32: SecureRandomUint32,
): ToolResult<number> {
  const limit = 0x1_0000_0000 - (0x1_0000_0000 % steps);
  for (let attempts = 0; attempts < 32; attempts++) {
    let value: number;
    try {
      value = randomUint32();
    } catch {
      return err(
        "ENTROPY_UNAVAILABLE",
        "Secure random number generation is unavailable. Try a modern secure environment.",
      );
    }
    if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
      return err("INVALID_ENTROPY", "The random source must provide an unsigned 32-bit integer.");
    }
    if (value < limit) return ok((min + (value % steps)) / scale);
  }
  return err(
    "ENTROPY_EXHAUSTED",
    "Secure randomness repeatedly fell outside the unbiased sampling range. Try again.",
  );
}
