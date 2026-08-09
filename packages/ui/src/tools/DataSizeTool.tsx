import { convertDataSize, type DataSizeUnit } from "@kitland/core";
import { HardDrive } from "lucide-react";
import { useMemo, useState } from "react";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import {
  FieldLabel,
  FieldRow,
  FormPanel,
  ResultHead,
  ResultPanel,
  ResultRow,
  RunButton,
  SampleAction,
  Segmented,
  StatusBar,
  ToolHeader,
  ValueInput,
} from "../components/tool-form";

type BaseSystem = "binary" | "decimal";

const BINARY_UNITS: DataSizeUnit[] = ["B", "KiB", "MiB", "GiB", "TiB"];
const DECIMAL_UNITS: DataSizeUnit[] = ["B", "KB", "MB", "GB", "TB"];

const FACTORS: Record<string, number> = {
  B: 1,
  KB: 1e3,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
};

function formatValue(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function DataSizeTool() {
  const [input, setInput] = useState("1024");
  const [system, setSystem] = useState<BaseSystem>("binary");
  const [unit, setUnit] = useState<DataSizeUnit>("GiB");
  const { isCopied, copy } = useCopyFeedback();

  const units = system === "binary" ? BINARY_UNITS : DECIMAL_UNITS;

  const result = useMemo(() => convertDataSize(input, unit), [input, unit]);

  const rows = useMemo(() => {
    if (!result.ok) return null;
    const bytes = result.value.bytes;
    const out = [
      { label: "BITS", value: formatValue(Math.round(bytes * 8)) },
      { label: "BYTES", value: formatValue(bytes) },
    ];
    for (const u of units.slice(1)) {
      out.push({ label: u, value: formatValue(bytes / (FACTORS[u] ?? 1)) });
    }
    return out;
  }, [result, units]);

  const summary = result.ok ? result.value.binary : "";
  const errorMessage = result.ok ? null : result.error.message;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={HardDrive}
        title="Data Size Converter"
        subtitle="Convert data quantities across decimal (SI, 1000) and binary (IEC, 1024) byte units locally."
        actions={
          <SampleAction
            onClick={() => {
              setInput("1024");
              setSystem("binary");
              setUnit("GiB");
            }}
          />
        }
      />

      {!result.ok && (
        <div
          className="bg-danger-soft border border-danger/40 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
          role="alert"
        >
          {result.error.message}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={320}>
          <FieldLabel>Size</FieldLabel>
          <FieldRow>
            <ValueInput
              value={input}
              onChange={setInput}
              ariaLabel="Data size value"
              placeholder="e.g. 1024"
              className="text-[22px]"
            />
          </FieldRow>
          <label className="flex h-[40px] items-center gap-2 rounded-[9px] bg-surface px-3">
            <select
              value={unit}
              onChange={(event) => setUnit(event.target.value as DataSizeUnit)}
              aria-label="Unit"
              className="min-w-0 flex-1 cursor-pointer bg-transparent text-left font-mono text-[12px] font-semibold text-on-muted outline-none"
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <FieldLabel>Base</FieldLabel>
          <Segmented
            value={system}
            onChange={(value) => {
              setSystem(value as BaseSystem);
              setUnit(value === "binary" ? "GiB" : "GB");
            }}
            options={[
              { value: "binary", label: "Binary (1024)" },
              { value: "decimal", label: "Decimal (1000)" },
            ]}
            size="sm"
          />
          <div className="flex-1" />
          <RunButton onClick={() => setInput(input.trim() || "1024")}>Convert</RunButton>
        </FormPanel>

        <ResultPanel>
          {result.ok && rows ? (
            <>
              <ResultHead
                title={`${input} ${unit}`}
                subtitle={`${system} units • ${system === "binary" ? "IEC 80000-13" : "SI 1000"}`}
                onCopy={() => void copy("bytes", summary)}
                copied={isCopied("bytes")}
                filled
              />
              <div className="flex flex-col gap-2">
                {rows.map((row) => (
                  <ResultRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-danger">
              {errorMessage}
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="Data size status"
        chip={{
          icon: HardDrive,
          text: result.ok ? (system === "binary" ? "Binary" : "Decimal") : "Error",
        }}
        stats={
          result.ok
            ? [`${result.value.bytes.toLocaleString()}`, unit, system]
            : ["Invalid data size"]
        }
        lang="B"
      />
    </div>
  );
}
