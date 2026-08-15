import { parseUrl } from "@kitland/core";
import { Link2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  FieldLabel,
  FormPanel,
  ResultHead,
  ResultPanel,
  ResultRow,
  RunButton,
  SampleAction,
  StatusBar,
  ToolHeader,
  ValueInput,
} from "../components/tool-form";

const SAMPLE = "https://kitland.test/explore?tool=base64&local=true&theme=dark#about";

export function UrlParserTool() {
  const [input, setInput] = useState(SAMPLE);

  const result = useMemo(() => parseUrl(input), [input]);
  const value = result.ok ? result.value : null;

  const defaultPort = (protocol: string) =>
    protocol === "https:" ? "443 (default)" : protocol === "http:" ? "80 (default)" : null;
  const scheme = value ? value.protocol.replace(":", "") : null;
  const port = value ? value.port || defaultPort(value.protocol) || "—" : null;
  const parts = value
    ? [scheme, value.hostname, port, value.pathname || "/", value.hash].filter(
        (p) => p && p !== "—",
      ).length
    : 0;

  const rows = value
    ? [
        { label: "Scheme", val: scheme ?? "" },
        { label: "Host", val: value.hostname },
        { label: "Path", val: value.pathname || "/" },
        { label: "Port", val: port ?? "" },
        { label: "Fragment", val: value.hash || "—" },
      ]
    : [];

  const errorMessage = result.ok ? null : result.error.message;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Link2}
        title="URL Parser"
        subtitle="Parse URLs into scheme, host, path, query, and fragment parts locally."
        actions={<SampleAction onClick={() => setInput(SAMPLE)} />}
      />

      {!result.ok && (
        <div
          role="alert"
          className="bg-danger-soft border border-danger/50 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={360}>
          <FieldLabel>URL</FieldLabel>
          <div className="flex flex-col gap-1.5 rounded-[10px] bg-surface p-3">
            <ValueInput
              value={input}
              onChange={setInput}
              ariaLabel="URL"
              placeholder="Paste a full URL including scheme…"
            />
            <span className="text-[11px] text-on-muted">Paste a full URL incl. scheme</span>
          </div>
          <div className="flex-1" />
          <RunButton onClick={() => setInput(input.trim() || SAMPLE)}>Parse URL</RunButton>
        </FormPanel>

        <ResultPanel>
          {value ? (
            <>
              <ResultHead title="Parsed URL" subtitle={`${parts} components • valid`} />
              <div className="flex flex-col gap-2">
                {rows.map((row) => (
                  <ResultRow key={row.label} label={row.label} value={row.val} />
                ))}
              </div>
              <FieldLabel>Query Params</FieldLabel>
              {value.params.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {value.params.map((param, index) => (
                    <div key={index} className="flex h-[30px] items-center gap-2 px-[10px]">
                      <span className="shrink-0 font-mono text-[12px] font-semibold text-on-surface">
                        {param.name}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-right font-mono text-[12px] text-on-muted">
                        {param.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[30px] items-center px-[10px] text-[12px] text-on-muted">
                  No query parameters in this URL.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-on-faint">
              <Search className="size-8 opacity-50" />
              <span className="text-[13px]">{errorMessage ?? "Invalid URL"}</span>
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="URL parser status"
        chip={{ icon: Link2, text: result.ok ? "Parsed" : "Invalid" }}
        stats={value ? [`${parts} parts`, "valid URL"] : ["invalid URL"]}
        lang="URL"
      />
    </div>
  );
}
