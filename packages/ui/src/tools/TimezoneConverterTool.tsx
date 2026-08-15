import { convertTimezone, SUPPORTED_TIMEZONES, type SupportedTimezone } from "@kitland/core";
import { Globe2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  FieldLabel,
  FieldRow,
  FormPanel,
  ResultPanel,
  RunButton,
  SampleAction,
  StatusBar,
  ToolHeader,
  UnitSelect,
} from "../components/tool-form";

const ZONES = Object.keys(SUPPORTED_TIMEZONES) as SupportedTimezone[];

const DESTINATIONS: { city: string; zone: SupportedTimezone }[] = [
  { city: "New York", zone: "America/New_York" },
  { city: "London", zone: "Europe/London" },
  { city: "Tokyo", zone: "Asia/Tokyo" },
  { city: "Sydney", zone: "Australia/Sydney" },
];

const ABBR: Record<string, string> = {
  "Asia/Ho_Chi_Minh": "HCM",
  "Asia/Tokyo": "TYO",
  "America/New_York": "NY",
  "Europe/London": "LON",
  "Australia/Sydney": "SYD",
};

function formatOffset(min: number): string {
  const sign = min >= 0 ? "+" : "-";
  const abs = Math.abs(min);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

function offsetCompact(min: number): string {
  const sign = min >= 0 ? "+" : "-";
  return `${sign}${String(Math.floor(Math.abs(min) / 60)).padStart(2, "0")}`;
}

function sourceAbbr(zone: SupportedTimezone): string {
  const known = ABBR[zone];
  if (known) return known;
  const city = zone.split("/").pop() ?? zone;
  return city.slice(0, 3).toUpperCase();
}

function nowLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function dayShift(sourceDate: string, targetDate: string): number {
  const s = sourceDate.slice(0, 10);
  const t = targetDate.slice(0, 10);
  return Math.round((Date.parse(t) - Date.parse(s)) / 86400000);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function TimezoneConverterTool() {
  const [input, setInput] = useState(() => nowLocal());
  const [source, setSource] = useState<SupportedTimezone>("Asia/Tokyo");

  const results = useMemo(() => {
    return DESTINATIONS.map(({ city, zone }) => {
      const r = convertTimezone(input, source, zone);
      return { city, zone, result: r };
    });
  }, [input, source]);

  const ok = results.every(({ result }) => result.ok);
  const failed = results.find((r) => !r.result.ok);
  const errorMessage =
    ok || !failed
      ? null
      : (failed.result as Extract<typeof failed.result, { ok: false }>).error.message;

  const sourceOffset = SUPPORTED_TIMEZONES[source] ?? 0;

  const shifts = results
    .map(({ city, result }) => ({
      city,
      shift: result.ok ? dayShift(input, result.value.targetIso) : 0,
    }))
    .filter(({ shift }) => shift !== 0);
  const shiftSummary =
    shifts.length === 0 ? "same day" : `same day (except ${shifts.map((s) => s.city).join(", ")})`;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Globe2}
        title="Timezone Converter"
        subtitle="Convert wall-clock times between standard IANA timezones locally."
        actions={<SampleAction label="Use Now" onClick={() => setInput(nowLocal())} />}
      />

      {!ok && (
        <div
          className="bg-danger-soft border border-danger/40 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={340}>
          <FieldLabel>Time + Source Zone</FieldLabel>
          <FieldRow>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-label="Local datetime"
              placeholder="2026-08-14T15:30:00"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent font-mono text-[17px] font-semibold text-on-surface outline-none placeholder:text-on-faint"
            />
            <UnitSelect
              value={source}
              onChange={(value) => setSource(value as SupportedTimezone)}
              options={ZONES.map((z) => `${z} (${formatOffset(SUPPORTED_TIMEZONES[z] ?? 0)})`)}
              ariaLabel="Source timezone"
            />
          </FieldRow>
          <FieldLabel>Destination Zones</FieldLabel>
          {DESTINATIONS.map(({ city, zone }) => (
            <div
              key={zone}
              className="flex h-[30px] items-center gap-2 rounded-[8px] bg-surface px-[10px]"
            >
              <span className="shrink-0 text-[13px] text-on-muted">{city}</span>
              <span className="min-w-0 flex-1 truncate text-right font-mono text-[11px] text-on-faint">
                {zone}
              </span>
            </div>
          ))}
          <div className="flex-1" />
          <RunButton onClick={() => setInput(input.trim() || nowLocal())} disabled={!ok}>
            Convert
          </RunButton>
        </FormPanel>

        <ResultPanel>
          {ok ? (
            <>
              <div className="flex flex-col gap-[3px]">
                <span className="truncate text-[16px] font-semibold text-on-surface">
                  {formatTime(input)} {sourceAbbr(source)} → world
                </span>
                <span className="truncate text-[12px] text-on-muted">
                  every city • 12-hour clock
                </span>
              </div>
              {results.map(({ city, zone, result }) => {
                const shift = result.ok ? dayShift(input, result.value.targetIso) : 0;
                const diffMin = (SUPPORTED_TIMEZONES[zone] ?? 0) - sourceOffset;
                const rel = `${diffMin >= 0 ? "+" : "−"}${Math.round(Math.abs(diffMin) / 60)}h`;
                return (
                  <div
                    key={zone}
                    className="flex h-[40px] items-center gap-2 rounded-[9px] bg-bg-elevated p-3"
                  >
                    <span className="shrink-0 text-[14px] font-semibold text-on-surface">
                      {city}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right font-mono text-[15px] font-semibold text-on-surface">
                      {result.ok
                        ? `${formatTime(result.value.targetIso)}${shift < 0 ? " (prev)" : shift > 0 ? " (next)" : ""}`
                        : ""}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-on-faint">{rel}</span>
                  </div>
                );
              })}
              <div className="flex h-[32px] items-center gap-2 rounded-[8px] bg-bg-elevated px-3">
                <span className="font-mono text-[11px] uppercase text-on-faint">Day Shift</span>
                <span className="min-w-0 flex-1 truncate text-right font-mono text-[13px] text-on-surface">
                  {shiftSummary}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-danger">
              {errorMessage ?? "Provide a valid ISO datetime."}
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="Timezone status"
        chip={{ icon: Globe2, text: ok ? `UTC${offsetCompact(sourceOffset)}` : "Error" }}
        stats={
          ok
            ? [`${formatTime(input)} UTC`, offsetCompact(sourceOffset), "IANA"]
            : ["Invalid format"]
        }
        lang="TZ"
      />
    </div>
  );
}
