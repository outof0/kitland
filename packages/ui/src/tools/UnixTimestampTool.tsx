import { parseUnixTimestamp } from "@kitland/core";
import { Check, Clock, Copy, RefreshCw, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import {
  BigValue,
  FieldLabel,
  FormPanel,
  ResultHead,
  ResultPanel,
  Segmented,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

type Reso = "s" | "ms" | "us" | "ns";
type Dir = "unix" | "date";

const RESO_LABEL: Record<Reso, string> = {
  s: "seconds",
  ms: "ms",
  us: "µs",
  ns: "ns",
};
const RESO_PLACEHOLDER: Record<Reso, string> = {
  s: "e.g. 1786695783",
  ms: "e.g. 1786695783000",
  us: "e.g. 1786695783000000",
  ns: "e.g. 1786695783000000000",
};

function valueForResolution(
  value: Pick<ParsedTimestamp, "seconds" | "milliseconds" | "microseconds" | "nanoseconds">,
  resolution: Reso,
) {
  if (resolution === "ms") return value.milliseconds;
  if (resolution === "us") return value.microseconds;
  if (resolution === "ns") return value.nanoseconds;
  return value.seconds;
}

type ParsedTimestamp = {
  readonly seconds: string;
  readonly milliseconds: string;
  readonly microseconds: string;
  readonly nanoseconds: string;
};

export function UnixTimestampTool() {
  const [value, setValue] = useState(String(Math.floor(Date.now() / 1000)));
  const [dir, setDir] = useState<Dir>("unix");
  const [reso, setReso] = useState<Reso>("s");
  const [currentTimeSec, setCurrentTimeSec] = useState(() => Math.floor(Date.now() / 1000));
  const { isCopied, copy } = useCopyFeedback();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const result = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return { ok: false as const, error: { message: "Enter a value." } };
    // Auto-detect: numeric → unix, otherwise try date. Dir is a hint, not a strict gate.
    const isNumeric = /^-?\d+$/.test(trimmed);
    if (
      dir === "date" ||
      (!isNumeric && (trimmed.includes("-") || trimmed.includes("T") || trimmed.includes("/")))
    ) {
      const ms = Date.parse(trimmed);
      if (!Number.isNaN(ms)) {
        return {
          ok: true as const,
          value: {
            seconds: String(Math.floor(ms / 1000)),
            milliseconds: String(ms),
          },
        };
      }
      if (isNumeric) {
        const unixRes = parseUnixTimestamp(trimmed, { unit: reso });
        if (unixRes.ok) return unixRes;
      }
      if (dir === "date")
        return {
          ok: false as const,
          error: { message: "Invalid date. Try YYYY-MM-DD or ISO 8601." },
        };
    }
    const unixRes = parseUnixTimestamp(trimmed, { unit: reso });
    if (unixRes.ok) return unixRes;
    const dateMs = Date.parse(trimmed);
    if (!Number.isNaN(dateMs)) {
      return {
        ok: true as const,
        value: {
          seconds: String(Math.floor(dateMs / 1000)),
          milliseconds: String(dateMs),
        },
      };
    }
    // If numeric parse failed but input looks like a date, suggest switching
    if (/[a-zA-Z]/.test(trimmed) || trimmed.includes("-") || trimmed.includes("/")) {
      return {
        ok: false as const,
        error: { message: "Invalid timestamp. Try switching to Date → Unix." },
      };
    }
    return unixRes;
  }, [dir, reso, value]);

  const parsed = useMemo(() => {
    if (!result.ok) return null;
    const ms = Number(result.value.milliseconds);
    const d = new Date(ms);
    const local = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
    );
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      iso: d.toISOString(),
      utc: d.toUTCString(),
      localDate: d.toLocaleString(undefined, {
        dateStyle: "full",
        timeStyle: "long",
      }),
      human: d.toLocaleString("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      mysql: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
      seconds: result.value.seconds,
      milliseconds: result.value.milliseconds,
      microseconds: (BigInt(result.value.milliseconds) * 1000n).toString(),
      nanoseconds: (BigInt(result.value.milliseconds) * 1_000_000n).toString(),
      relative: getRelativeTimeString(d),
      week: isoWeek(d),
      dayOfYear: Math.floor(
        (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 1)) /
          86_400_000 +
          1,
      ),
      weekday: d.toLocaleDateString("en", { weekday: "short" }),
      leap: isLeapYear(d.getFullYear()) ? "Yes" : "No",
      tzNote: `GMT${timezoneOffset(local)} (your local timezone)`,
    };
  }, [result]);

  const handleDirChange = useCallback(
    (nextDir: Dir) => {
      if (nextDir === dir) return;
      if (parsed) {
        if (nextDir === "date") {
          setValue(parsed.iso);
        } else {
          setValue(valueForResolution(parsed, reso));
        }
      }
      setDir(nextDir);
    },
    [dir, parsed, reso],
  );

  const handleResoChange = useCallback(
    (nextReso: Reso) => {
      if (nextReso === reso) return;
      if (parsed && dir === "unix") {
        setValue(valueForResolution(parsed, nextReso));
      }
      setReso(nextReso);
    },
    [dir, parsed, reso],
  );

  const handleUseNow = useCallback(() => {
    const now = Math.floor(Date.now() / 1000);
    setCurrentTimeSec(now);
    if (dir === "date") {
      setValue(new Date(now * 1000).toISOString());
    } else {
      setValue(
        reso === "ms"
          ? String(now * 1000)
          : reso === "us"
            ? String(now * 1_000_000)
            : reso === "ns"
              ? String(BigInt(now) * 1_000_000_000n)
              : String(now),
      );
    }
  }, [dir, reso]);

  const errorMessage = result.ok ? null : result.error.message;

  const nowUtc = useMemo(
    () => new Date(currentTimeSec * 1000).toUTCString().replace("GMT", "UTC"),
    [currentTimeSec],
  );

  const formats = parsed
    ? [
        { label: "RFC 2822", value: parsed.utc },
        { label: "RFC 3339", value: parsed.iso },
        { label: "MySQL", value: parsed.mysql },
        { label: "RSS", value: parsed.utc },
        { label: "W3C DTF", value: parsed.iso },
        { label: "HUMAN", value: parsed.human },
      ]
    : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Clock}
        title="Unix Timestamp Converter"
        subtitle="Convert Unix timestamps (seconds, milliseconds, microseconds, or nanoseconds) to human-readable dates locally."
        actions={
          <button
            type="button"
            onClick={handleUseNow}
            className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[8px] border border-outline bg-surface-low px-[12px] text-[13px] font-semibold text-on-surface transition-colors hover:bg-surface"
          >
            <Clock className="size-[15px] text-on-muted" />
            Use Now
          </button>
        }
      />

      {!result.ok && (
        <div
          role="alert"
          className="bg-danger-soft border border-danger/40 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={310}>
          <FieldLabel>Current · Live</FieldLabel>
          <div className="flex flex-col gap-2 rounded-[12px] bg-surface-low p-[14px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[26px] font-bold text-on-surface">
                {currentTimeSec.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => setCurrentTimeSec(Math.floor(Date.now() / 1000))}
                aria-label="Sync current time"
                title="Sync current time"
                className="flex size-[26px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-primary transition-colors hover:bg-surface-high"
              >
                <RefreshCw className="size-[14px]" />
              </button>
            </div>
            <span className="font-mono text-[12px] text-on-muted">{nowUtc}</span>
          </div>

          <FieldLabel>Input</FieldLabel>
          <Segmented
            size="md"
            boxed
            value={dir}
            onChange={(v) => handleDirChange(v as Dir)}
            options={[
              { value: "unix", label: "Unix → Date" },
              { value: "date", label: "Date → Unix" },
            ]}
          />
          <div className="flex flex-col gap-[6px] rounded-[9px] bg-surface-low p-3">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label={dir === "date" ? "ISO date string" : "Timestamp value"}
              placeholder={dir === "date" ? "e.g. 2026-08-21T00:00:00Z" : RESO_PLACEHOLDER[reso]}
              spellCheck={false}
              className="w-full min-w-0 bg-transparent font-mono text-[16px] font-semibold text-on-surface outline-none placeholder:text-on-muted/60"
            />
            <span className="text-[11px] text-on-muted">
              {dir === "date" ? "ISO date string" : RESO_LABEL[reso]}
            </span>
          </div>
          {dir === "unix" && (
            <Segmented
              size="sm"
              boxed
              value={reso}
              onChange={(v) => handleResoChange(v as Reso)}
              options={[
                { value: "s", label: "seconds" },
                { value: "ms", label: "ms" },
                { value: "us", label: "µs" },
              ]}
            />
          )}
        </FormPanel>

        <ResultPanel>
          {parsed ? (
            <>
              <ResultHead
                title="Converted Date"
                subtitle={`timestamp ${Number(parsed.seconds).toLocaleString()} • ${parsed.relative}`}
                onCopy={() => void copy("all", formats!.map((f) => f.value).join("\n"))}
                copied={isCopied("all")}
                filled
                copyLabel="Copy all"
              />
              <BigValue value={parsed.utc} sub={parsed.tzNote} />

              <FieldLabel>Formats · Copy any</FieldLabel>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {formats!.map((f) => (
                  <div
                    key={f.label}
                    className="flex h-[40px] items-center gap-2 rounded-[9px] bg-bg-elevated px-3"
                  >
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[1px] text-on-faint">
                      {f.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-on-surface">
                      {f.value}
                    </span>
                    <button
                      type="button"
                      onClick={() => void copy(f.label, f.value)}
                      aria-label={isCopied(f.label) ? `Copied ${f.label}` : `Copy ${f.label}`}
                      title={isCopied(f.label) ? `Copied ${f.label}` : `Copy ${f.label}`}
                      className={`size-[26px] cursor-pointer rounded-[6px] flex items-center justify-center transition-colors shrink-0 ${
                        isCopied(f.label)
                          ? "bg-success-soft text-success border border-success/40"
                          : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                      }`}
                    >
                      {isCopied(f.label) ? (
                        <Check className="size-3.5 text-success" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <FieldLabel>Date Info</FieldLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { k: "Week", v: parsed.week },
                  { k: "Day of Year", v: String(parsed.dayOfYear) },
                  { k: "Weekday", v: parsed.weekday },
                  { k: "Leap Year", v: parsed.leap },
                ].map((item) => (
                  <div
                    key={item.k}
                    className="flex flex-col gap-1 rounded-[10px] bg-bg-elevated p-2.5"
                  >
                    <span className="text-[16px] font-semibold text-on-surface">{item.v}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[1px] text-on-faint">
                      {item.k}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2.5 rounded-[10px] border border-outline bg-surface-high p-3">
                <TriangleAlert className="size-[14px] shrink-0 text-warning" />
                <span className="text-[12px] leading-relaxed text-on-surface">
                  32-bit timestamps overflow on January 19, 2038 (the Y2038 problem). Integer input
                  is normalized with BigInt before conversion to millisecond precision.
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-on-muted">
              {errorMessage ?? "Enter a valid numeric Unix timestamp."}
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="Unix timestamp status"
        chip={{ icon: Clock, text: result.ok ? "Parsed" : "Invalid" }}
        stats={
          result.ok
            ? [`${Number(result.value.seconds).toLocaleString()} s`, RESO_LABEL[reso], "UTC"]
            : ["Invalid input"]
        }
        lang="TS"
      />
    </div>
  );
}

function timezoneOffset(d: Date): string {
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const abs = Math.abs(offset);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return String(Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)).padStart(
    2,
    "0",
  );
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getRelativeTimeString(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHours = Math.round(diffMin / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, "month");
  return rtf.format(Math.round(diffDays / 365), "year");
}
