import { err, ok, type ToolResult } from "../result";

export const TEMPERATURE_MAX_INPUT_CHARS = 64;
export type TemperatureUnit = "C" | "F" | "K";
export type TemperatureResult = { celsius: number; fahrenheit: number; kelvin: number };

const ABSOLUTE_ZERO_C = -273.15;

export function convertTemperature(
  input: string,
  from: TemperatureUnit,
): ToolResult<TemperatureResult> {
  if (input.length > TEMPERATURE_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "Temperature text exceeds the size limit.");
  const trimmed = input.trim();
  if (!trimmed) return err("EMPTY_INPUT", "Enter a temperature value.");
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed))
    return err("INVALID_NUMBER", "Enter a numeric temperature.");
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return err("INVALID_NUMBER", "Enter a finite temperature.");
  let celsius: number;
  if (from === "C") celsius = n;
  else if (from === "F") celsius = ((n - 32) * 5) / 9;
  else if (from === "K") celsius = n - 273.15;
  else return err("INVALID_UNIT", "Choose C, F, or K.");
  if (celsius < ABSOLUTE_ZERO_C - 1e-9)
    return err("BELOW_ABSOLUTE_ZERO", "Temperature is below absolute zero.");
  const fahrenheit = (celsius * 9) / 5 + 32;
  const kelvin = celsius + 273.15;
  return ok({
    celsius: round(celsius),
    fahrenheit: round(fahrenheit),
    kelvin: round(kelvin),
  });
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
