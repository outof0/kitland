import { GeneratorResult } from "../components/GeneratorResult";
import { generateUlid } from "@kitland/core";
import { Clock, RefreshCw } from "lucide-react";
import { useCallback, useId, useState } from "react";

const randomBytes = (length: number) => crypto.getRandomValues(new Uint8Array(length));

export function UlidGeneratorTool() {
  const [timestamp, setTimestamp] = useState(() => Date.now());
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const timestampId = useId();

  const generate = useCallback(() => {
    const result = generateUlid(timestamp, randomBytes);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setValue(result.value);
    setError(null);
  }, [timestamp]);

  return (
    <GeneratorResult
      icon={Clock}
      title="ULID Generator"
      subtitle="Generate sortable, 128-bit lexicographically sortable identifiers locally."
      output={value}
      outputLabel="Generated ULID"
      outputMeta={
        value
          ? `26 characters (Crockford Base32) · timestamp ${timestamp} (${new Date(timestamp).toISOString()})`
          : "Choose timestamp, then generate"
      }
      error={error}
      languageLabel="ULID"
      controls={
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={timestampId} className="text-[12px] font-semibold text-on-muted">
                Timestamp (ms)
              </label>
              <button
                type="button"
                onClick={() => setTimestamp(Date.now())}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Clock className="size-3" />
                Use Now
              </button>
            </div>
            <input
              id={timestampId}
              type="number"
              value={timestamp}
              onChange={(event) => setTimestamp(Number(event.target.value))}
              className="h-[36px] w-full rounded-[8px] border border-outline bg-surface px-3 font-mono text-[13px] text-on-surface outline-none transition focus:border-primary"
            />
            <span className="text-[11px] text-on-muted font-mono">
              {new Date(timestamp).toUTCString()}
            </span>
          </div>

          <button
            type="submit"
            className="mt-2 h-[38px] w-full rounded-[8px] bg-primary text-primary-foreground font-medium text-[13px] hover:bg-primary-strong transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className="size-4" />
            Generate ULID
          </button>
        </form>
      }
    />
  );
}
