import { calculateAge } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { Cake } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FieldLabel,
  FieldRow,
  FormPanel,
  ResultPanel,
  ResultRow,
  RunButton,
  SampleAction,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

const ZODIAC: [number, number, string, string][] = [
  [1, 20, "Capricorn", "♑"],
  [2, 19, "Aquarius", "♒"],
  [3, 21, "Pisces", "♓"],
  [4, 20, "Aries", "♈"],
  [5, 21, "Taurus", "♉"],
  [6, 21, "Gemini", "♊"],
  [7, 23, "Cancer", "♋"],
  [8, 23, "Leo", "♌"],
  [9, 23, "Virgo", "♍"],
  [10, 23, "Libra", "♎"],
  [11, 22, "Scorpio", "♏"],
  [12, 22, "Sagittarius", "♐"],
];

function zodiac(month: number, day: number): { sign: string; symbol: string } {
  for (const [m, d, sign, symbol] of ZODIAC) {
    if ((month === m && day >= d) || month === m + 1) {
      if (month === m + 1 && day < d) continue;
      if (month === m && day < d) continue;
      return { sign, symbol };
    }
  }
  return { sign: "Capricorn", symbol: "♑" };
}

function nextBirthday(birth: string, reference: string): { date: string; inDays: number } {
  const b = new Date(`${birth}T00:00:00Z`);
  const ref = new Date(`${reference}T00:00:00Z`);
  let next = new Date(Date.UTC(ref.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
  if (next <= ref)
    next = new Date(Date.UTC(ref.getUTCFullYear() + 1, b.getUTCMonth(), b.getUTCDate()));
  const p = (n: number) => String(n).padStart(2, "0");
  const date = `${next.getUTCFullYear()}-${p(next.getUTCMonth() + 1)}-${p(next.getUTCDate())}`;
  return { date, inDays: Math.round((next.getTime() - ref.getTime()) / 86400000) };
}

function leapDaysBetween(birth: string, reference: string): number {
  const start = Number(birth.slice(0, 4));
  const end = Number(reference.slice(0, 4));
  let count = 0;
  for (let y = start; y <= end; y++) {
    const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    if (leap) {
      const feb29 = `${y}-02-29`;
      if (feb29 >= birth && feb29 <= reference) count++;
    }
  }
  return count;
}

function formatShort(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMonthDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
}

export type AgeCalculatorToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export function AgeCalculatorTool({
  initialInput,
  capabilities: _capabilities = LOCAL_ONLY_CAPABILITIES,
}: AgeCalculatorToolProps = {}) {
  void _capabilities;
  const [birth, setBirth] = useState(initialInput ? initialInput.slice(0, 10) : "2000-01-01");
  const [reference, setReference] = useState(() => new Date().toISOString().slice(0, 10));

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setBirth(initialInput.slice(0, 10));
    }
  }, [initialInput]);

  const result = useMemo(() => calculateAge(birth, reference), [birth, reference]);

  const details = useMemo(() => {
    if (!result.ok) return null;
    const b = new Date(`${birth}T00:00:00Z`);
    const nb = nextBirthday(birth, reference);
    return {
      totalDays: result.value.totalDays,
      bornOn: b.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
      nextBirthday: nb,
      zodiac: zodiac(b.getUTCMonth() + 1, b.getUTCDate()),
      leapDays: leapDaysBetween(birth, reference),
    };
  }, [result, birth, reference]);

  const errorMessage = result.ok ? null : result.error.message;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Cake}
        title="Age Calculator"
        subtitle="Compute exact chronological age, months, and total calendar days locally."
        actions={
          <SampleAction
            label="Reset"
            onClick={() => {
              setBirth("2000-01-01");
              setReference(new Date().toISOString().slice(0, 10));
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
        <FormPanel width={340}>
          <FieldLabel>Date of Birth</FieldLabel>
          <FieldRow>
            <input
              type="date"
              value={birth}
              onChange={(event) => setBirth(event.target.value)}
              aria-label="Date of birth"
              className="min-w-0 flex-1 bg-transparent font-mono text-[15px] font-semibold text-on-surface outline-none"
            />
          </FieldRow>
          <FieldLabel>Today</FieldLabel>
          <FieldRow>
            <input
              type="date"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              aria-label="Reference date"
              className="min-w-0 flex-1 bg-transparent font-mono text-[15px] font-semibold text-on-surface outline-none"
            />
          </FieldRow>
          <div className="flex-1" />
          <RunButton onClick={() => setReference(new Date().toISOString().slice(0, 10))}>
            Calculate Age
          </RunButton>
        </FormPanel>

        <ResultPanel>
          {result.ok && details ? (
            <>
              <div className="flex flex-col gap-[3px]">
                <span className="truncate text-[16px] font-semibold text-on-surface">
                  Age on {formatShort(reference)}
                </span>
                <span className="truncate text-[12px] text-on-muted">
                  based on the date of birth
                </span>
              </div>
              <div className="flex flex-col gap-4 rounded-[12px] bg-bg-elevated p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[44px] font-bold leading-none text-on-surface">
                    {result.value.years}
                  </span>
                  <span className="text-[12px] text-on-muted">years old</span>
                </div>
                <span className="text-[14px] text-on-muted">
                  {result.value.years} y • {result.value.months} m • {result.value.days} d
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <ResultRow
                  label="Days Alive"
                  value={`${details.totalDays.toLocaleString()} days`}
                />
                <ResultRow
                  label="Next Birthday"
                  value={`in ${details.nextBirthday.inDays} days (${formatMonthDay(details.nextBirthday.date)})`}
                />
                <ResultRow label="Born On" value={details.bornOn} />
                <ResultRow
                  label="Zodiac"
                  value={`${details.zodiac.sign} ${details.zodiac.symbol}`}
                />
                <ResultRow label="Leap Days" value={`${details.leapDays} observed`} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-danger">
              {errorMessage ?? "Enter valid dates."}
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="Age calculator status"
        chip={{ icon: Cake, text: result.ok ? `${result.value.years} y` : "Invalid Date" }}
        stats={
          result.ok
            ? [
                `${result.value.years} y ${result.value.months} m`,
                `${Math.floor(result.value.totalDays / 7)} w`,
                "UTC",
              ]
            : ["Check date format"]
        }
        lang="AGE"
      />
    </div>
  );
}
