import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseUserAgent, type UserAgentInspection } from "@kitland/core";
import { FileInput, MonitorDot, Sparkles, Trash2 } from "lucide-react";
import { useId, useState } from "react";

const SAMPLE =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export function UserAgentParserTool() {
  const inputId = useId();
  const [input, setInput] = useState(SAMPLE);
  const [inspection, setInspection] = useState<UserAgentInspection>(() => {
    const result = parseUserAgent(SAMPLE);
    return result.ok ? result.value : emptyInspection;
  });
  const [error, setError] = useState<string | null>(null);

  const parse = (value = input) => {
    const result = parseUserAgent(value);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setInspection(result.value);
    setError(null);
  };

  const loadSample = () => {
    setInput(SAMPLE);
    parse(SAMPLE);
  };

  const clear = () => {
    setInput("");
    setInspection(emptyInspection);
    setError(null);
  };

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <MonitorDot />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">User Agent Parser</h2>
          <p className="tool-header__subtitle">Parse user-agent strings locally.</p>
        </div>
        <div className="tool-header__actions">
          <Button variant="ghost" size="sm" className="tool-btn" onClick={loadSample}>
            <FileInput />
            Sample
          </Button>
          <Button variant="ghost" size="sm" className="tool-btn" onClick={clear}>
            <Trash2 />
            Clear
          </Button>
          <Button size="sm" className="tool-btn tool-btn--primary" onClick={() => parse()}>
            <Sparkles />
            Parse
          </Button>
        </div>
      </div>

      <output
        className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        role={error ? "alert" : undefined}
      >
        {error ?? ""}
      </output>

      <section className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <label
            className="font-mono text-[11px] tracking-[.15em] text-[var(--on-faint)]"
            htmlFor={inputId}
          >
            USER-AGENT STRING
          </label>
          <Textarea
            id={inputId}
            aria-describedby={`${inputId}-hint`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Mozilla/5.0 …"
            className="min-h-44 flex-1 resize-none font-mono text-xs leading-5"
            spellCheck={false}
          />
          <Button className="w-full" onClick={() => parse()}>
            <Sparkles />
            Parse user-agent
          </Button>
          <p id={`${inputId}-hint`} className="m-0 text-[11px] text-[var(--on-faint)]">
            Detects browser, OS, device and engine. Parsing stays in this browser.
          </p>
        </section>

        <section
          className="min-h-[22rem] rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-5"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="m-0 text-base font-semibold">Identified Client</h3>
              <p className="mt-1 text-xs text-[var(--on-muted)]">
                {inspection.device.type} · {inspection.os.name} · 4 components
              </p>
            </div>
            <span className="rounded-full border border-[var(--outline)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-[11px] font-semibold tracking-wide text-[var(--on-muted)]">
              {inspection.device.type.toUpperCase()}
            </span>
          </div>
          <dl className="mt-5 grid gap-2">
            <DetailRow label="Browser" value={formatComponent(inspection.browser)} />
            <DetailRow label="Engine" value={formatComponent(inspection.engine)} />
            <DetailRow label="Operating System" value={formatComponent(inspection.os)} />
            <DetailRow label="Device" value={formatDevice(inspection)} />
          </dl>
          <p className="mt-5 text-xs text-[var(--on-faint)]">
            User-agent strings can be reduced or spoofed; treat this as diagnostic information, not
            proof of a client identity.
          </p>
        </section>
      </section>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4 rounded-[9px] border border-[var(--outline)] bg-[var(--bg-elevated)] px-3 py-2">
      <dt className="text-sm text-[var(--on-muted)]">{label}</dt>
      <dd className="m-0 break-all text-right font-mono text-xs text-[var(--on)]">{value}</dd>
    </div>
  );
}

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

const emptyInspection: UserAgentInspection = {
  browser: { name: "—", version: null },
  engine: { name: "—", version: null },
  os: { name: "—", version: null },
  device: { type: "unknown", vendor: null, model: null },
};
