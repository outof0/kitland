import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { getNextCronRuns, parseCronExpression } from "@kitland/core";
import { CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";
import {
  FieldLabel,
  FormPanel,
  NoteText,
  ResultHead,
  ResultPanel,
  RunButton,
  SampleAction,
  StatusBar,
  ToolHeader,
  ValueInput,
} from "../components/tool-form";

const SAMPLE = "*/15 9-17 * * MON-FRI";

const PRESETS = [
  { label: "Every minute", cron: "* * * * *" },
  { label: "Every weekday 9-5", cron: "0 9-17 * * 1-5" },
  { label: "Daily at noon", cron: "0 12 * * *" },
  { label: "Weekly Mon 9:00", cron: "0 9 * * 1" },
  { label: "Monthly 1st 3:00", cron: "0 3 1 * *" },
];

const FIELD_NAMES = ["Minute", "Hour", "Day", "Month", "Weekday"];

export function CronParserTool() {
  const [expression, setExpression] = useState(SAMPLE);
  const { isCopied, copy } = useCopyFeedback();

  const parsed = useMemo(() => parseCronExpression(expression), [expression]);
  const nextRuns = useMemo(
    () => (parsed.ok ? getNextCronRuns(parsed.value, new Date(), 5) : null),
    [parsed],
  );
  const errorMessage = parsed.ok ? null : parsed.error.message;

  const parts = expression.trim().split(/\s+/);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={CalendarClock}
        title="Cron Expression Parser"
        subtitle="Explain Unix cron expressions in plain English and preview upcoming execution runs."
        actions={<SampleAction onClick={() => setExpression(SAMPLE)} />}
      />

      {!parsed.ok && (
        <div
          role="alert"
          className="bg-danger-soft border border-danger/40 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={280}>
          <FieldLabel>Cron Expression</FieldLabel>
          <div className="flex h-[44px] items-center gap-2 rounded-[8px] bg-surface px-[14px]">
            <ValueInput
              value={expression}
              onChange={setExpression}
              ariaLabel="Cron expression"
              placeholder="* * * * *"
            />
          </div>

          <FieldLabel>Presets</FieldLabel>
          <div className="flex flex-col gap-1.5">
            {PRESETS.map((item) => {
              const active = expression.trim() === item.cron;
              return (
                <button
                  key={item.cron}
                  type="button"
                  onClick={() => setExpression(item.cron)}
                  className={`flex h-[30px] cursor-pointer items-center gap-2 rounded-[8px] px-[10px] transition-colors ${
                    active ? "bg-primary-soft" : "bg-surface-low hover:bg-surface"
                  }`}
                >
                  <span
                    className={`size-[6px] shrink-0 rounded-full ${
                      active ? "bg-primary" : "bg-on-faint"
                    }`}
                  />
                  <span
                    className={`truncate text-[13px] ${
                      active ? "font-semibold text-primary-strong" : "text-on-muted"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <FieldLabel>Time Dimensions</FieldLabel>
          <div className="flex flex-col gap-1.5">
            {FIELD_NAMES.map((name, index) => (
              <div
                key={name}
                className="flex h-[26px] items-center justify-between gap-2 rounded-[8px] bg-surface px-[9px]"
              >
                <span className="shrink-0 text-[11px] text-on-muted">{name}</span>
                <span className="truncate font-mono text-[12px] text-on-surface">
                  {parts[index] || "*"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1" />
          <RunButton onClick={() => setExpression(expression.trim() || SAMPLE)}>
            Build Schedule
          </RunButton>
          <NoteText>
            Adjust fields to preview upcoming runs. 5-field Unix cron: */step, ranges, lists, names,
            L, W and #.
          </NoteText>
        </FormPanel>

        <ResultPanel>
          {parsed.ok ? (
            <>
              <ResultHead
                title="Schedule Preview"
                subtitle="Next runs for the active expression use your local device time"
                onCopy={() => void copy("cron", parsed.value.description)}
                copied={isCopied("cron")}
                copyLabel="Schedule Description"
              />
              <div className="flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5">
                <span className="size-[7px] rounded-full bg-success" />
                <span className="text-[12px] font-semibold text-success">Valid</span>
              </div>
              <div className="flex items-start gap-2.5 rounded-[10px] bg-bg-elevated p-[14px]">
                <span aria-hidden className="text-[15px] leading-none text-primary">
                  •
                </span>
                <span className="text-[13px] leading-relaxed text-on-muted">
                  {parsed.value.description}
                </span>
              </div>

              <FieldLabel>Next 5 Runs</FieldLabel>
              <div className="flex flex-col gap-2">
                {nextRuns && nextRuns.ok && nextRuns.value.length > 0 ? (
                  nextRuns.value.map((date) => (
                    <div
                      key={date.toISOString()}
                      className="flex h-[40px] items-center gap-2.5 rounded-[10px] bg-bg-elevated px-3"
                    >
                      <span className="shrink-0 text-[13px] text-on-muted">
                        {date.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "2-digit",
                        })}
                      </span>
                      <span className="size-[5px] shrink-0 rounded-full bg-primary" />
                      <span className="truncate font-mono text-[14px] font-semibold text-on-surface">
                        {date.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] font-semibold text-success">
                        {relativeTag(date)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex h-[40px] items-center rounded-[10px] bg-bg-elevated px-3 text-[12px] text-on-muted">
                    No upcoming runs found in search window.
                  </div>
                )}
              </div>

              <NoteText>Times shown in your local device timezone.</NoteText>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-danger">
              {errorMessage ?? "Enter a valid 5-field cron expression."}
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="Cron parser status"
        chip={{ icon: CalendarClock, text: parsed.ok ? "Valid Cron" : "Invalid" }}
        stats={parsed.ok ? ["5-field", "UTC-independent", "local tz"] : ["Syntax error"]}
        lang="CRON"
      />
    </div>
  );
}

function relativeTag(date: Date): string {
  const diffMin = Math.round((date.getTime() - Date.now()) / 60_000);
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffMin < 1440) return `in ${Math.round(diffMin / 60)}h`;
  const days = Math.round(diffMin / 1440);
  if (days === 1) return "tomorrow";
  if (days < 7) return `+${days}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
