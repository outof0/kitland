import { err, ok, type ToolResult } from "../result";

export const DATA_SIZE_MAX_INPUT_CHARS = 64;
export type DataSizeUnit = "B" | "KB" | "MB" | "GB" | "TB" | "KiB" | "MiB" | "GiB" | "TiB";
export type DataSizeResult = { bytes: number; si: string; binary: string };

const SI: Record<string, number> = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 };
const BIN: Record<string, number> = {
  B: 1,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
};

export function convertDataSize(input: string, unit: DataSizeUnit): ToolResult<DataSizeResult> {
  if (input.length > DATA_SIZE_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "Size text exceeds the limit.");
  const trimmed = input.trim();
  if (!trimmed) return err("EMPTY_INPUT", "Enter a size value.");
  if (!/^[+]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed))
    return err("INVALID_NUMBER", "Enter a non-negative number.");
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0)
    return err("INVALID_NUMBER", "Enter a non-negative finite size.");
  const factor = SI[unit] ?? BIN[unit];
  if (!factor) return err("INVALID_UNIT", "Choose a supported size unit.");
  const bytes = n * factor;
  if (bytes > Number.MAX_SAFE_INTEGER)
    return err("OUTPUT_TOO_LARGE", "Converted byte value exceeds a safe integer.");
  return ok({
    bytes,
    si: format(bytes, SI, ["TB", "GB", "MB", "KB", "B"]),
    binary: format(bytes, BIN, ["TiB", "GiB", "MiB", "KiB", "B"]),
  });
}

function format(bytes: number, table: Record<string, number>, order: string[]): string {
  for (const u of order) {
    const f = table[u];
    if (f === undefined) continue;
    if (bytes >= f || u === "B") {
      const v = bytes / f;
      return `${Number(v.toPrecision(6))} ${u}`;
    }
  }
  return `${bytes} B`;
}
