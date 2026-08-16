import { convertTemperature, type TemperatureUnit } from "@kitland/core";
import { Thermometer } from "lucide-react";
import { useMemo, useState } from "react";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import {
  FieldLabel,
  FieldRow,
  FormPanel,
  ResultHead,
  ResultPanel,
  ResultRow,
  SampleAction,
  Segmented,
  StatusBar,
  ToolHeader,
  ValueInput,
} from "../components/tool-form";

const SCALES: { unit: string; label: string; symbol: string }[] = [
  { unit: "C", label: "Celsius", symbol: "°C" },
  { unit: "F", label: "Fahrenheit", symbol: "°F" },
  { unit: "K", label: "Kelvin", symbol: "°K" },
  { unit: "R", label: "Rankine", symbol: "°R" },
];

const SCALE_NAMES: Record<string, string> = {
  C: "Celsius",
  F: "Fahrenheit",
  K: "Kelvin",
  R: "Rankine",
};

const SCALE_SYMBOLS: Record<string, string> = {
  C: "°C",
  F: "°F",
  K: "°K",
  R: "°R",
};

function rankineToCelsius(n: number): number {
  return ((n - 491.67) * 5) / 9;
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

function celsiusToRankine(c: number): number {
  return round6((c * 9) / 5 + 491.67);
}

function celsiusToReaumur(c: number): number {
  return round6((c * 4) / 5);
}

type TempScale = TemperatureUnit | "R";

export function TemperatureTool() {
  const [input, setInput] = useState("100");
  const [from, setFrom] = useState<TempScale>("C");
  const { isCopied, copy } = useCopyFeedback();

  const result = useMemo(() => {
    const trimmed = input.trim();
    const coreInput =
      from === "R" && trimmed && Number.isFinite(Number(trimmed))
        ? String(rankineToCelsius(Number(trimmed)))
        : input;
    return convertTemperature(coreInput, from === "R" ? "C" : from);
  }, [input, from]);

  const converted = useMemo(() => {
    if (!result.ok) return null;
    const rows = [
      { label: "FAHRENHEIT", value: `${result.value.fahrenheit} °F` },
      { label: "KELVIN", value: `${result.value.kelvin} K` },
      { label: "RANKINE", value: `${celsiusToRankine(result.value.celsius)} °R` },
      { label: "REAUMUR", value: `${celsiusToReaumur(result.value.celsius)} °Ré` },
    ].filter((row) => row.label !== (SCALE_NAMES[from] ?? "").toUpperCase());
    return rows;
  }, [result, from]);

  const errorMessage = result.ok ? null : result.error.message;
  const summary = converted ? converted.map((row) => row.value).join(" = ") : "";
  const symbol = SCALE_SYMBOLS[from] ?? "";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Thermometer}
        title="Temperature Converter"
        subtitle="Convert temperatures across Celsius (°C), Fahrenheit (°F), Kelvin (°K), and Rankine (°R) locally."
        actions={
          <SampleAction
            onClick={() => {
              setInput("100");
              setFrom("C");
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
          <FieldLabel>Temperature</FieldLabel>
          <FieldRow>
            <ValueInput
              value={input}
              onChange={setInput}
              ariaLabel="Temperature value"
              placeholder="e.g. 100"
              className="text-[22px]"
            />
            <select
              value={from}
              onChange={(event) => setFrom(event.target.value as TempScale)}
              aria-label="Source scale"
              className="h-full cursor-pointer bg-transparent pr-1 font-mono text-[13px] font-semibold text-on-muted outline-none"
            >
              {SCALES.map((scale) => (
                <option key={scale.unit} value={scale.unit}>
                  {scale.symbol}
                </option>
              ))}
            </select>
          </FieldRow>
          <Segmented
            value={from}
            onChange={(value) => setFrom(value as TempScale)}
            options={SCALES.map((scale) => ({ value: scale.unit, label: scale.symbol }))}
            size="sm"
          />
        </FormPanel>

        <ResultPanel>
          {converted ? (
            <>
              <ResultHead
                title={`${input} ${symbol}`}
                subtitle="convert • standards referenced"
                onCopy={() => void copy("result", summary)}
                copied={isCopied("result")}
                filled
              />
              <div className="flex flex-col gap-2">
                {converted.map((row) => (
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
        label="Temperature status"
        chip={{ icon: Thermometer, text: result.ok ? (SCALE_NAMES[from] ?? from) : "Error" }}
        stats={result.ok ? [`${input} ${symbol}`, "4 scales", "SI"] : ["Invalid input"]}
        lang="TEMP"
      />
    </div>
  );
}
