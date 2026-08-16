import { formatDurationSeconds } from "@kitland/core";
import { Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import {
  BigValue,
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
  UnitSelect,
  ValueInput,
} from "../components/tool-form";

type DurationUnit = "seconds" | "minutes" | "hours" | "days";
type FormatMode = "human" | "iso" | "clock";

const UNIT_SECONDS: Record<DurationUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
};

function toSeconds(value: string, unit: DurationUnit): string {
  const trimmed = value.replace(/,/g, "").trim();
  if (!trimmed || !Number.isFinite(Number(trimmed))) return value;
  return String(Number(trimmed) * UNIT_SECONDS[unit]);
}

function formatIso(seconds: number): string {
  const sign = seconds < 0 ? "-" : "";
  let rem = Math.abs(Math.trunc(seconds));
  const days = Math.floor(rem / 86400);
  rem %= 86400;
  const hours = Math.floor(rem / 3600);
  rem %= 3600;
  const minutes = Math.floor(rem / 60);
  const secs = rem % 60;
  let out = "P";
  if (days) out += `${days}D`;
  if (hours || days) out += `${hours}H`;
  out += `${minutes}M${secs}S`;
  return sign + out;
}

function formatClock(seconds: number): string {
  const sign = seconds < 0 ? "-" : "";
  let rem = Math.abs(Math.trunc(seconds));
  const hours = Math.floor(rem / 3600);
  rem %= 3600;
  const minutes = Math.floor(rem / 60);
  const secs = rem % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    secs,
  ).padStart(2, "0")}`;
}

export function DurationFormatterTool() {
  const [input, setInput] = useState("3661");
  const [unit, setUnit] = useState<DurationUnit>("seconds");
  const [mode, setMode] = useState<FormatMode>("human");
  const { isCopied, copy } = useCopyFeedback();

  const result = useMemo(() => formatDurationSeconds(toSeconds(input, unit)), [input, unit]);

  const display = useMemo(() => {
    if (!result.ok) return null;
    if (mode === "iso") return formatIso(result.value.seconds);
    if (mode === "clock") return formatClock(result.value.seconds);
    return result.value.formatted;
  }, [result, mode]);

  const rows = useMemo(() => {
    if (!result.ok) return null;
    const total = Math.abs(Math.trunc(result.value.seconds));
    return [
      { label: "Weeks", value: `${Math.floor(total / 604800)} wk` },
      { label: "Days", value: `${Math.floor(total / 86400)} d` },
      { label: "Hours", value: `${Math.floor(total / 3600)} h` },
      { label: "Minutes", value: `${Math.floor(total / 60)} min` },
      { label: "Seconds", value: `${total} s` },
      { label: "Milliseconds", value: `${(total * 1000).toLocaleString()} ms` },
    ];
  }, [result]);

  const modeLabel =
    mode === "human"
      ? "human-readable duration"
      : mode === "iso"
        ? "ISO 8601 duration"
        : "HH:MM:SS clock";
  const chipLabel = mode === "human" ? "Readable" : mode === "iso" ? "ISO 8601" : "HH:MM:SS";
  const errorMessage = result.ok ? null : result.error.message;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Timer}
        title="Duration Formatter"
        subtitle="Format raw second counts into readable days, hours, minutes, and seconds locally."
        actions={
          <SampleAction
            label="1 Day"
            onClick={() => {
              setInput("86400");
              setUnit("seconds");
              setMode("human");
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
        <FormPanel width={340}>
          <FieldLabel>Duration</FieldLabel>
          <FieldRow>
            <ValueInput
              value={input}
              onChange={setInput}
              ariaLabel="Duration value"
              placeholder="e.g. 3,725"
            />
            <UnitSelect
              value={unit}
              onChange={(value) => setUnit(value as DurationUnit)}
              options={Object.keys(UNIT_SECONDS)}
              ariaLabel="Duration unit"
            />
          </FieldRow>
          <FieldLabel>Format</FieldLabel>
          <Segmented
            value={mode}
            onChange={(value) => setMode(value as FormatMode)}
            options={[
              { value: "human", label: "Human" },
              { value: "iso", label: "ISO 8601" },
              { value: "clock", label: "HH:MM:SS" },
            ]}
          />
        </FormPanel>

        <ResultPanel>
          {result.ok && display && rows ? (
            <>
              <ResultHead
                title={`${input} ${unit}`}
                subtitle={modeLabel}
                onCopy={() => void copy("duration", display)}
                copied={isCopied("duration")}
                filled
              />
              <BigValue value={display} />
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
        label="Duration status"
        chip={{ icon: Timer, text: result.ok ? chipLabel : "Error" }}
        stats={
          result.ok
            ? [
                `${Math.abs(Math.trunc(result.value.seconds))} s`,
                display ?? "",
                `≈ ${(Math.abs(result.value.seconds) / 86400).toFixed(2)}d`,
              ]
            : ["Invalid duration"]
        }
        lang="DUR"
      />
    </div>
  );
}
