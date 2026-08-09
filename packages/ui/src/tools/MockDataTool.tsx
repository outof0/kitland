import { GeneratorResult } from "../components/GeneratorResult";
import { generateMockData, type MockDataOptions } from "@kitland/core";
import { Database } from "lucide-react";
import { useCallback, useId, useState } from "react";

const bytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));

const initial: MockDataOptions = {
  count: 5,
  includeId: true,
  includeName: true,
  includeEmail: true,
  includeRole: true,
};

export function MockDataTool() {
  const rowCountId = useId();
  const [options, setOptions] = useState(initial);
  const [rows, setRows] = useState<readonly Record<string, string>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(() => {
    const r = generateMockData(options, bytes);
    if (!r.ok) {
      setError(r.error.message);
      return;
    }
    setRows(r.value);
    setError(null);
  }, [options]);

  const output = rows.length ? JSON.stringify(rows, null, 2) : "";

  return (
    <GeneratorResult
      icon={Database}
      title="Mock Data"
      subtitle="Generate bounded JSON fixture records locally; no data is fetched or stored."
      output={output}
      outputLabel="Generated JSON Fixtures"
      outputMeta={
        rows.length
          ? `${rows.length} records generated · JSON format`
          : "Configure schema fields and click Generate"
      }
      error={error}
      languageLabel="JSON"
      controls={
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor={rowCountId} className="text-[12px] font-semibold text-on-muted">
              Row Count
            </label>
            <input
              id={rowCountId}
              type="number"
              min="1"
              max="1000"
              value={options.count}
              onChange={(e) => setOptions({ ...options, count: Number(e.target.value) })}
              className="h-[36px] w-full rounded-[8px] border border-outline bg-surface px-3 font-mono text-[13px] text-on-surface outline-none transition focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-outline">
            <span className="text-[11px] font-semibold text-on-muted uppercase tracking-wider">
              Fields
            </span>
            {(
              [
                { key: "includeId", label: "Include ID (UUID)" },
                { key: "includeName", label: "Include Name" },
                { key: "includeEmail", label: "Include Email" },
                { key: "includeRole", label: "Include Role" },
              ] as const
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2.5 text-[12px] text-on-surface cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                  className="size-4 rounded border-outline bg-surface text-primary focus:ring-0 accent-primary cursor-pointer"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="mt-2 h-[38px] w-full rounded-[8px] bg-primary text-primary-foreground font-medium text-[13px] hover:bg-primary-strong transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Database className="size-4" />
            Generate Fixtures
          </button>
        </form>
      }
    />
  );
}
