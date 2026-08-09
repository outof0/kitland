import { parseUserAgent, type UserAgentInspection } from "@kitland/core";
import { Laptop, MonitorDot, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  FieldLabel,
  FormPanel,
  NoteText,
  ResultPanel,
  RunButton,
  SampleAction,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

const SAMPLE =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const emptyInspection: UserAgentInspection = {
  browser: { name: "—", version: null },
  engine: { name: "—", version: null },
  os: { name: "—", version: null },
  device: { type: "unknown", vendor: null, model: null },
};

function formatComponent({ name, version }: { name: string; version: string | null }) {
  return version ? `${name} ${version}` : name;
}

function formatDevice({ device }: UserAgentInspection) {
  const details = [device.vendor, device.model].filter((item): item is string => Boolean(item));
  return details.length
    ? `${capitalize(device.type)} · ${details.join(" · ")}`
    : capitalize(device.type);
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function badgeLabel(inspection: UserAgentInspection): string {
  if (inspection.browser.name !== "—") return "Browser";
  if (inspection.engine.name !== "—") return "Engine";
  if (inspection.os.name !== "—") return "OS";
  return "Device";
}

export function UserAgentParserTool() {
  const [input, setInput] = useState(SAMPLE);

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: true, value: emptyInspection } as const;
    return parseUserAgent(input);
  }, [input]);

  const inspection = parsed.ok ? parsed.value : emptyInspection;
  const browserLabel = formatComponent(inspection.browser);

  const rows = [
    { label: "Browser", val: formatComponent(inspection.browser), key: "browser" },
    { label: "Engine", val: formatComponent(inspection.engine), key: "engine" },
    { label: "Operating System", val: formatComponent(inspection.os), key: "os" },
    { label: "Device", val: formatDevice(inspection), key: "device" },
  ];

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={MonitorDot}
        title="User Agent Parser"
        subtitle="Parse user-agent strings into browser, engine, OS, and device details locally."
        actions={
          <SampleAction
            label="My User-Agent"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.userAgent) {
                setInput(navigator.userAgent);
              }
            }}
          />
        }
      />

      {!parsed.ok && (
        <div
          role="alert"
          className="bg-danger-soft border border-danger/50 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
        >
          {parsed.error.message}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={380}>
          <FieldLabel>User-Agent String</FieldLabel>
          <div className="flex flex-col gap-1.5 rounded-[10px] bg-surface p-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-label="User-Agent string"
              placeholder="Paste a raw user-agent string…"
              rows={3}
              spellCheck={false}
              className="w-full resize-none bg-transparent font-mono text-[11px] leading-[16px] text-on-muted outline-none placeholder:text-on-faint"
            />
          </div>
          <div className="flex-1" />
          <RunButton onClick={() => setInput(input.trim() || SAMPLE)}>Parse</RunButton>
          <NoteText>Detects browser, OS, and device components locally.</NoteText>
        </FormPanel>

        <ResultPanel>
          {parsed.ok ? (
            <>
              <div className="flex flex-col gap-[3px]">
                <span className="truncate text-[16px] font-semibold text-on-surface">
                  Identified Client
                </span>
                <span className="truncate text-[12px] text-on-muted">
                  {inspection.device.type} • {inspection.os.name} • {rows.length} components
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface">
                  {badgeLabel(inspection)}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {rows.map((row) => (
                  <div
                    key={row.key}
                    className="flex h-[34px] items-center justify-between gap-2 rounded-[9px] bg-bg-elevated px-3"
                  >
                    <span className="shrink-0 text-[13px] text-on-muted">{row.label}</span>
                    <span className="min-w-0 flex-1 truncate text-right text-[12px] text-on-surface">
                      {row.val}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-on-faint">
              <Search className="size-8 opacity-50" />
              <span className="text-[13px]">Unable to parse the user-agent string.</span>
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="User agent status"
        chip={{ icon: Laptop, text: parsed.ok ? "UA" : "Invalid" }}
        stats={parsed.ok ? ["1 line", "parsed", browserLabel] : ["unable to parse"]}
        lang="UA"
      />
    </div>
  );
}
