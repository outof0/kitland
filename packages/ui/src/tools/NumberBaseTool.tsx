import { convertNumberBase } from "@kitland/core";
import { Binary } from "lucide-react";
import { useMemo, useState } from "react";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import {
  FieldLabel,
  FormPanel,
  NoteText,
  ResultHead,
  ResultPanel,
  ResultRow,
  SampleAction,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

const SAMPLE = "3735928559";

type Grouping = "none" | "space" | "comma" | "octet";

const GROUPING_OPTIONS: { value: Grouping; label: string }[] = [
  { value: "none", label: "None" },
  { value: "space", label: "Spaces" },
  { value: "comma", label: "Commas" },
  { value: "octet", label: "8-bit octet" },
];

function groupDigits(digits: string, grouping: Grouping, base: number): string {
  if (grouping === "none") return digits;
  const [intPart, fracPart] = digits.split(".");
  if (!intPart) return digits;
  const neg = intPart.startsWith("-");
  const abs = neg ? intPart.slice(1) : intPart;
  const sep = grouping === "octet" && base === 2 ? " " : grouping === "comma" ? "," : " ";
  const chunk = grouping === "octet" && base === 2 ? 8 : 3;
  const grouped = abs.replace(new RegExp(`\\B(?=(\\d{${chunk}})+(?!\\d))`, "g"), sep);
  const prefix = neg ? "-" : "";
  return fracPart ? `${prefix}${grouped}.${fracPart}` : `${prefix}${grouped}`;
}

export function NumberBaseTool() {
  const [input, setInput] = useState(SAMPLE);
  const [grouping, setGrouping] = useState<Grouping>("none");
  const { isCopied, copy } = useCopyFeedback();

  const result = useMemo(() => convertNumberBase(input, 10, 10), [input]);

  const rows = useMemo(() => {
    const bases = [
      { label: "Hex", base: 16 as const },
      { label: "Binary", base: 2 as const },
      { label: "Octal", base: 8 as const },
      { label: "Decimal", base: 10 as const },
      { label: "ASCII", base: 10 as const },
    ];
    const converted = bases.map(({ label, base }) => {
      const r = convertNumberBase(input, 10, base);
      return { label, value: r.ok ? r.value.value : null };
    });
    const asciiRow = converted.find((row) => row.label === "ASCII");
    if (asciiRow && asciiRow.value !== null) {
      const n = Number(asciiRow.value);
      asciiRow.value =
        n >= 32 && n <= 126 ? `"${String.fromCharCode(n)}"` : `non-printable (${asciiRow.value})`;
    }
    for (const row of converted) {
      if (row.label === "Hex" && row.value !== null) row.value = `0x${row.value.toUpperCase()}`;
      if (row.label === "Binary" && row.value !== null)
        row.value = `0b${groupDigits(row.value, grouping, 2)}`;
      if (row.label === "Octal" && row.value !== null) row.value = `0o${row.value}`;
      if (row.label === "Decimal" && row.value !== null)
        row.value = groupDigits(row.value, grouping, 10);
    }
    return converted;
  }, [input, grouping]);

  const errorMessage = result.ok ? null : result.error.message;
  const summary = rows
    .filter((row) => row.value !== null)
    .map((row) => row.value)
    .join(" | ");

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Binary}
        title="Number Base"
        subtitle="Convert between number bases"
        actions={
          <SampleAction
            onClick={() => {
              setInput(SAMPLE);
              setGrouping("none");
            }}
          />
        }
      />

      {!result.ok && (
        <div
          className="bg-danger-soft border border-danger/40 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={320}>
          <FieldLabel>Number</FieldLabel>
          <div className="flex h-[40px] items-center gap-2 rounded-[9px] bg-surface px-3">
            <span className="shrink-0 text-[13px] text-on-muted">Decimal</span>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-label="Decimal number"
              placeholder="e.g. 3735928559"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-right font-mono text-[15px] font-semibold text-on-surface outline-none placeholder:text-on-faint"
            />
          </div>
          <label className="flex h-[40px] items-center gap-2 rounded-[9px] bg-surface px-3">
            <span className="shrink-0 text-[13px] text-on-muted">Group</span>
            <select
              value={grouping}
              onChange={(event) => setGrouping(event.target.value as Grouping)}
              aria-label="Digit grouping"
              className="min-w-0 flex-1 cursor-pointer bg-transparent text-right font-mono text-[15px] font-semibold text-on-surface outline-none"
            >
              {GROUPING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <NoteText>Supports 2..36, negative and fractional input.</NoteText>
        </FormPanel>

        <ResultPanel>
          {rows.every((row) => row.value !== null) ? (
            <>
              <ResultHead
                title={`${input} in all bases`}
                subtitle="signed 32-bit • big-endian"
                onCopy={() => void copy("all", summary)}
                copied={isCopied("all")}
                filled
              />
              <div className="flex flex-col gap-2">
                {rows.map((row) => (
                  <ResultRow key={row.label} label={row.label} value={row.value ?? ""} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-danger">
              {errorMessage ?? "Enter a valid decimal number."}
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="Number base status"
        chip={{ icon: Binary, text: result.ok ? "Decimal" : "Error" }}
        stats={result.ok ? [`${input}`, "4 bases", "auto"] : ["Invalid input"]}
        lang="NUM"
      />
    </div>
  );
}
