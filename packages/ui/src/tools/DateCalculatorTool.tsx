import { addDaysToIsoDate, diffIsoDates } from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
} from "../components/tool-form";

type Direction = "add" | "subtract";
type AmountUnit = "days" | "weeks" | "months" | "years";

function getTodayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function shiftMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate()));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${target.getUTCFullYear()}-${p(target.getUTCMonth() + 1)}-${p(target.getUTCDate())}`;
}

function isoWeek(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `W${String(week).padStart(2, "0")} ${d.getUTCFullYear()}`;
}

function formatShort(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatBig(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type DateCalculatorToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

export function DateCalculatorTool({
  initialInput,
  capabilities: _capabilities = LOCAL_ONLY_CAPABILITIES,
}: DateCalculatorToolProps = {}) {
  void _capabilities;
  const [base, setBase] = useState(() =>
    initialInput ? initialInput.slice(0, 10) : getTodayIso(),
  );
  const [direction, setDirection] = useState<Direction>("add");
  const [amount, setAmount] = useState("7");
  const [unit, setUnit] = useState<AmountUnit>("days");
  const { isCopied, copy } = useCopyFeedback();

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setBase(initialInput.slice(0, 10));
    }
  }, [initialInput]);

  const sign = direction === "add" ? 1 : -1;

  const result = useMemo(() => {
    const trimmed = amount.trim();
    if (!trimmed) return { ok: false as const, error: { message: "Enter an amount." } };
    const n = Number(trimmed);
    if (!Number.isFinite(n))
      return { ok: false as const, error: { message: "Enter a numeric amount." } };
    const total = n * sign;
    if (unit === "days") return addDaysToIsoDate(base, String(total));
    if (unit === "weeks") return addDaysToIsoDate(base, String(total * 7));
    if (unit === "months") {
      const target = shiftMonths(base, total);
      return target
        ? { ok: true as const, value: { date: target } }
        : { ok: false as const, error: { message: "Invalid date." } };
    }
    const years = shiftMonths(base, total * 12);
    return years
      ? { ok: true as const, value: { date: years } }
      : { ok: false as const, error: { message: "Invalid date." } };
  }, [base, direction, amount, unit]);

  const date = result.ok ? result.value.date : null;

  const details = useMemo(() => {
    if (!date) return null;
    const diff = diffIsoDates(date, getTodayIso());
    const d = new Date(`${date}T00:00:00Z`);
    const day = d.getUTCDay();
    const dayOfYear = Math.floor(
      (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) -
        Date.UTC(d.getUTCFullYear(), 0, 1)) /
        86_400_000 +
        1,
    );
    return {
      dayDiff: diff.ok ? diff.value.days : 0,
      weekday: d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
      weekdayShort: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
      isoWeek: isoWeek(date),
      weekend: day === 0 || day === 6,
      dayOfYear,
      quarter: Math.floor(d.getUTCMonth() / 3) + 1,
    };
  }, [date]);

  const errorMessage = result.ok ? null : result.error.message;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={CalendarDays}
        title="Date Calculator"
        subtitle="Calculate exact day differences and offsets between ISO dates locally."
        actions={<SampleAction label="Set Today" onClick={() => setBase(getTodayIso())} />}
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
          <FieldLabel>Starting Date</FieldLabel>
          <FieldRow>
            <input
              type="date"
              value={base}
              onChange={(event) => setBase(event.target.value)}
              aria-label="Starting date"
              className="min-w-0 flex-1 bg-transparent font-mono text-[15px] font-semibold text-on-surface outline-none"
            />
          </FieldRow>
          <Segmented
            value={direction}
            onChange={(value) => setDirection(value as Direction)}
            options={[
              { value: "add", label: "+ Add" },
              { value: "subtract", label: "− Subtract" },
            ]}
          />
          <FieldRow>
            <span className="shrink-0 font-mono text-[11px] uppercase text-on-faint">Amount</span>
            <input
              type="text"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-label="Amount"
              placeholder="7"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent font-mono text-[15px] font-semibold text-on-surface outline-none placeholder:text-on-faint"
            />
            <UnitSelect
              value={unit}
              onChange={(value) => setUnit(value as AmountUnit)}
              options={["days", "weeks", "months", "years"]}
              ariaLabel="Amount unit"
            />
          </FieldRow>
        </FormPanel>

        <ResultPanel>
          {result.ok && date && details ? (
            <>
              <ResultHead
                title="Resulting Date"
                subtitle={`${amount} ${unit} ${direction === "add" ? "after" : "before"} ${formatShort(base)}`}
                onCopy={() => void copy("date", date)}
                copied={isCopied("date")}
                filled
              />
              <BigValue
                value={formatBig(date)}
                sub={`${details.weekday} • day ${details.dayOfYear} of year • Q${details.quarter}`}
              />
              <div className="flex flex-col gap-2">
                <ResultRow
                  label="Day Diff"
                  value={`${details.dayDiff >= 0 ? "+" : ""}${details.dayDiff} days`}
                />
                <ResultRow label="Weekday" value={details.weekdayShort} />
                <ResultRow label="ISO Week" value={details.isoWeek} />
                <ResultRow label="Weekend" value={details.weekend ? "true" : "false"} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-danger">
              {errorMessage ?? "Enter a valid date."}
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="Date calculator status"
        chip={{ icon: CalendarDays, text: result.ok ? "UTC" : "Error" }}
        stats={result.ok && date ? [`${amount} ${unit}`, "result", "UTC"] : ["Invalid dates"]}
        lang="DATE"
      />
    </div>
  );
}
