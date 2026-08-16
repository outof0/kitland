import { err, ok, type ToolResult } from "../result";
export type UnixTimestamp = { seconds: string; milliseconds: string; iso: string };
export type UnixTimestampUnit = "s" | "ms" | "us" | "ns";

export type ParseUnixTimestampOptions = {
  readonly unit?: UnixTimestampUnit;
};

function detectTimestampUnit(value: bigint): UnixTimestampUnit {
  const abs = value < 0n ? -value : value;
  if (abs < 100_000_000_000n) return "s";
  if (abs < 100_000_000_000_000n) return "ms";
  if (abs < 100_000_000_000_000_000n) return "us";
  return "ns";
}

function millisecondsFor(value: bigint, unit: UnixTimestampUnit): bigint {
  switch (unit) {
    case "s":
      return value * 1000n;
    case "ms":
      return value;
    case "us":
      return value / 1000n;
    case "ns":
      return value / 1_000_000n;
  }
}

function floorDivide(value: bigint, divisor: bigint): bigint {
  if (value >= 0n) return value / divisor;
  return -((-value + divisor - 1n) / divisor);
}

export function parseUnixTimestamp(
  value: string,
  options: ParseUnixTimestampOptions = {},
): ToolResult<UnixTimestamp> {
  const trimmed = value.trim();
  if (!/^-?\d{1,19}$/.test(trimmed))
    return err(
      "INVALID_TIMESTAMP",
      "Enter a Unix timestamp in seconds, milliseconds, microseconds, or nanoseconds.",
    );
  const raw = BigInt(trimmed);
  const ms = millisecondsFor(raw, options.unit ?? detectTimestampUnit(raw));
  const milliseconds = Number(ms);
  if (!Number.isSafeInteger(milliseconds))
    return err("INVALID_TIMESTAMP", "Timestamp is outside the supported numeric range.");

  const d = new Date(milliseconds);
  if (Number.isNaN(d.getTime()))
    return err("INVALID_TIMESTAMP", "Timestamp is outside the supported date range.");
  return ok({
    seconds: floorDivide(ms, 1000n).toString(),
    milliseconds: ms.toString(),
    iso: d.toISOString(),
  });
}
