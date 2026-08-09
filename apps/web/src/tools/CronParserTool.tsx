import { Button } from "@/components/ui/button";
import { getNextCronRuns, parseCronExpression } from "@kitland/core";
import { CalendarClock, FileInput, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

const SAMPLE = "*/15 9-17 * * MON-FRI";

export function CronParserTool() {
  const [expression, setExpression] = useState(SAMPLE);
  const parsed = useMemo(() => parseCronExpression(expression), [expression]);
  const nextRuns = useMemo(
    () => (parsed.ok ? getNextCronRuns(parsed.value, new Date(), 5) : parsed),
    [parsed],
  );

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <CalendarClock />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">Cron Parser</h2>
          <p className="tool-header__subtitle">
            Explain a five-field Unix cron expression and preview upcoming local-time runs.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => setExpression(SAMPLE)}
          >
            <FileInput />
            Sample
          </Button>
          <Button variant="ghost" size="sm" className="tool-btn" onClick={() => setExpression("")}>
            <RotateCcw />
            Clear
          </Button>
        </div>
      </div>
      <output className={parsed.ok ? "tool-feedback" : "tool-feedback tool-feedback--error"}>
        {parsed.ok
          ? "Preview uses your device’s local timezone. It does not create a schedule."
          : parsed.error.message}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(22rem,1.2fr)]">
        <section className="grid content-start gap-4 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <label htmlFor="cron-expression" className="grid gap-2 text-sm font-medium">
            Cron expression
            <input
              id="cron-expression"
              value={expression}
              onChange={(event) => setExpression(event.target.value)}
              placeholder="*/15 9-17 * * MON-FRI"
              className="font-mono text-sm"
              spellCheck={false}
            />
          </label>
          <p className="m-0 text-xs leading-5 text-[var(--on-muted)]">
            minute · hour · day of month · month · day of week
          </p>
          <div className="grid grid-cols-5 gap-1 text-center text-[0.7rem] text-[var(--on-muted)]">
            {["min", "hour", "day", "month", "week"].map((field) => (
              <span key={field} className="rounded bg-[var(--surface)] px-1 py-1.5">
                {field}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["0 * * * *", "0 9 * * MON-FRI", "0 0 1 * *"].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="xs"
                onClick={() => setExpression(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>
        </section>
        <section className="grid content-start gap-4 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-[18px]">
          <div>
            <p className="m-0 text-xs font-medium tracking-wide text-[var(--on-muted)] uppercase">
              Explanation
            </p>
            <p className="mt-2 mb-0 text-sm leading-6">
              {parsed.ok ? parsed.value.description : "Fix the expression to see its explanation."}
            </p>
          </div>
          <div>
            <p className="m-0 text-xs font-medium tracking-wide text-[var(--on-muted)] uppercase">
              Next runs
            </p>
            <ol className="mt-2 grid gap-2 pl-5 text-sm">
              {nextRuns.ok
                ? nextRuns.value.map((date) => (
                    <li key={date.toISOString()} className="font-mono text-xs">
                      {date.toLocaleString()}
                    </li>
                  ))
                : [
                    <li key="empty" className="text-[var(--on-muted)]">
                      No preview available.
                    </li>,
                  ]}
            </ol>
          </div>
        </section>
      </section>
    </>
  );
}
