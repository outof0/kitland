import { generateRandomPorts } from "@kitland/core";
import { Check, Copy, Network } from "lucide-react";
import { useCallback, useState } from "react";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import {
  FieldLabel,
  FormPanel,
  NoteText,
  ResultPanel,
  RunButton,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";
import { secureRandomUint32 } from "../lib/secure-random";

const RANGE_OPTIONS = [
  { value: "dynamic", label: "1024–65535" },
  { value: "ephemeral", label: "49152–65535" },
] as const;

export function RandomPortTool() {
  const [range, setRange] = useState<"dynamic" | "ephemeral">("dynamic");
  const [protocol, setProtocol] = useState<"tcp" | "udp">("tcp");
  const [count, setCount] = useState(1);
  const [ports, setPorts] = useState<readonly number[]>([]);
  const [generatedOptions, setGeneratedOptions] = useState<{
    min: number;
    max: number;
    protocol: "tcp" | "udp";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isCopied, copy } = useCopyFeedback();

  const generate = useCallback(() => {
    const result = generateRandomPorts({ range, protocol, count }, secureRandomUint32);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setPorts(result.value.ports);
    setGeneratedOptions({
      min: result.value.min,
      max: result.value.max,
      protocol: result.value.protocol,
    });
    setError(null);
  }, [count, protocol, range]);

  const current = ports[0];
  const minPort = range === "dynamic" ? 1024 : 49152;
  const maxPort = 65535;
  const activeMin = generatedOptions?.min ?? minPort;
  const activeMax = generatedOptions?.max ?? maxPort;
  const activeProtocol = (generatedOptions?.protocol ?? protocol).toUpperCase();
  const meta = `dynamic range • ${activeProtocol} • free`;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Network}
        title="Random Port"
        subtitle="Pick random unreserved TCP or UDP port numbers locally."
      />

      {error && (
        <div
          role="alert"
          className="bg-danger-soft border border-danger/50 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
        >
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={300}>
          <FieldLabel>Range + Protocol</FieldLabel>
          <label className="flex h-[32px] items-center justify-between gap-2 rounded-[9px] bg-surface px-3">
            <span className="shrink-0 text-[13px] text-on-muted">Range</span>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as typeof range)}
              aria-label="Port range"
              className="shrink-0 cursor-pointer bg-transparent text-right font-mono text-[12px] font-semibold text-on-surface outline-none"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-[32px] items-center justify-between gap-2 rounded-[9px] bg-surface px-3">
            <span className="shrink-0 text-[13px] text-on-muted">Protocol</span>
            <select
              value={protocol}
              onChange={(event) => setProtocol(event.target.value as typeof protocol)}
              aria-label="Protocol"
              className="shrink-0 cursor-pointer bg-transparent text-right font-mono text-[12px] font-semibold text-on-surface outline-none"
            >
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
            </select>
          </label>
          <label className="flex h-[32px] items-center justify-between gap-2 rounded-[9px] bg-surface px-3">
            <span className="shrink-0 text-[13px] text-on-muted">Count</span>
            <select
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              aria-label="Port count"
              className="shrink-0 cursor-pointer bg-transparent text-right font-mono text-[12px] font-semibold text-on-surface outline-none"
            >
              {[1, 2, 3, 5, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex-1" />
          <RunButton onClick={generate}>Pick Port</RunButton>
          <NoteText>Avoids IANA registered 0–1023.</NoteText>
        </FormPanel>

        <ResultPanel>
          {current !== undefined ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-[3px]">
                  <span className="truncate text-[16px] font-semibold text-on-surface">
                    Random Port
                  </span>
                  <span className="truncate text-[12px] text-on-muted">Next available port</span>
                </div>
                <button
                  type="button"
                  onClick={() => void copy("port", String(current))}
                  aria-label={isCopied("port") ? "Copied port" : "Copy port"}
                  title={isCopied("port") ? "Copied port" : "Copy port"}
                  className={`size-[32px] shrink-0 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer ${
                    isCopied("port")
                      ? "bg-success-soft text-success border border-success/40"
                      : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                  }`}
                >
                  {isCopied("port") ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
              <div className="flex flex-col gap-2 rounded-[12px] bg-bg-elevated p-[18px]">
                <span className="break-all font-mono text-[24px] font-bold leading-tight text-on-surface">
                  {current.toLocaleString()}
                </span>
                <span className="text-[12px] text-on-faint">{meta}</span>
              </div>
              {ports.length > 1 && (
                <>
                  <FieldLabel>More Generated</FieldLabel>
                  <div className="flex flex-col gap-1.5">
                    {ports.slice(1).map((port) => (
                      <div
                        key={port}
                        className="flex h-[34px] items-center justify-between gap-2 rounded-[9px] bg-bg-elevated px-3"
                      >
                        <span className="font-mono text-[13px] font-semibold text-on-surface">
                          {port.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copy(`port-${port}`, String(port))}
                          aria-label={
                            isCopied(`port-${port}`) ? `Copied port ${port}` : `Copy port ${port}`
                          }
                          title={
                            isCopied(`port-${port}`) ? `Copied port ${port}` : `Copy port ${port}`
                          }
                          className={`size-[26px] cursor-pointer rounded-[6px] flex items-center justify-center transition-colors shrink-0 ${
                            isCopied(`port-${port}`)
                              ? "bg-success-soft text-success border border-success/40"
                              : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                          }`}
                        >
                          {isCopied(`port-${port}`) ? (
                            <Check className="size-3.5 text-success" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-on-faint">
              <Network className="size-8 opacity-50" />
              <span className="text-[13px]">Pick a random port to get started.</span>
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="Random port status"
        chip={{ icon: Network, text: activeProtocol }}
        stats={
          current !== undefined
            ? [
                `${activeMin}-${activeMax}`,
                `${ports.length} ${ports.length === 1 ? "port" : "ports"}`,
                "ephemeral",
              ]
            : [`${minPort}-${maxPort}`, "ready", "ephemeral"]
        }
        lang="PORT"
      />
    </div>
  );
}
