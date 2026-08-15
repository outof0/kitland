import { err, ok, type ToolResult } from "../result";
export const MOCK_DATA_MAX_ROWS = 1000;
export type MockDataRandomBytes = (length: number) => Uint8Array;
export type MockDataOptions = {
  count: number;
  includeId: boolean;
  includeName: boolean;
  includeEmail: boolean;
  includeRole: boolean;
};
export type MockDataRecord = Record<string, string>;
const FIRST = ["Ada", "Grace", "Linus", "Margaret", "Alan", "Katherine"];
const LAST = ["Lovelace", "Hopper", "Torvalds", "Hamilton", "Turing", "Johnson"];
const ROLES = ["developer", "designer", "operator", "analyst"];
export function generateMockData(
  options: MockDataOptions,
  random: MockDataRandomBytes,
): ToolResult<readonly MockDataRecord[]> {
  if (!Number.isInteger(options.count) || options.count < 1 || options.count > MOCK_DATA_MAX_ROWS)
    return err("INVALID_COUNT", "Choose 1 to 1000 rows.");
  if (!options.includeId && !options.includeName && !options.includeEmail && !options.includeRole)
    return err("EMPTY_SCHEMA", "Enable at least one fixture field.");
  const rows: MockDataRecord[] = [];
  try {
    for (let i = 0; i < options.count; i++) {
      const name = pick(FIRST, random) + " " + pick(LAST, random),
        row: MockDataRecord = {};
      if (options.includeId) row.id = hex(random(8));
      if (options.includeName) row.name = name;
      if (options.includeEmail)
        row.email = name.toLowerCase().replace(" ", ".") + "+" + (i + 1) + "@example.test";
      if (options.includeRole) row.role = pick(ROLES, random);
      rows.push(row);
    }
  } catch {
    return err("ENTROPY_UNAVAILABLE", "Secure random generation is unavailable.");
  }
  return ok(rows);
}
function pick(values: readonly string[], random: MockDataRandomBytes) {
  const b = random(1)[0];
  if (b === undefined) throw new Error();
  return values[b % values.length] ?? "";
}
function hex(bytes: Uint8Array) {
  if (bytes.length !== 8) throw new Error();
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
