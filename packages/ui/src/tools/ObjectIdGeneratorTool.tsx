import { GeneratorResult } from "../components/GeneratorResult";
import { generateObjectId } from "@kitland/core";
import { Fingerprint, RefreshCw } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const bytes = (length: number) => crypto.getRandomValues(new Uint8Array(length));

export function ObjectIdGeneratorTool() {
  const counter = useRef(crypto.getRandomValues(new Uint32Array(1))[0]! & 0xffffff);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(() => {
    const timestampSec = Math.floor(Date.now() / 1000);
    const result = generateObjectId(timestampSec, counter.current, bytes);
    counter.current = (counter.current + 1) & 0xffffff;
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setValue(result.value.value);
    setError(null);
  }, []);

  return (
    <GeneratorResult
      icon={Fingerprint}
      title="ObjectID Generator"
      subtitle="Generate 24-character hex MongoDB-compatible ObjectIDs locally."
      output={value}
      outputLabel="Generated ObjectID"
      outputMeta={
        value
          ? `24 hex chars · 12 bytes (4-byte timestamp + 5-byte random + 3-byte counter)`
          : "Click Generate to create an ObjectID"
      }
      error={error}
      languageLabel="OBJECTID"
      controls={
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
        >
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-semibold text-on-muted uppercase tracking-wider">
              Structure (12 Bytes)
            </span>
            <div className="flex flex-col gap-2 bg-surface-low border border-outline rounded-[8px] p-3 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-on-muted">Timestamp (4B)</span>
                <span className="font-mono font-semibold text-on-surface">Current epoch</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-muted">Random value (5B)</span>
                <span className="font-mono font-semibold text-on-surface">Web Crypto</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-muted">Counter (3B)</span>
                <span className="font-mono font-semibold text-primary">Session sequential</span>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-on-muted m-0">
              Generated entirely in your browser. Compatible with MongoDB BSON ObjectID
              specifications.
            </p>
          </div>

          <button
            type="submit"
            className="mt-2 h-[38px] w-full rounded-[8px] bg-primary text-primary-foreground font-medium text-[13px] hover:bg-primary-strong transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className="size-4" />
            Generate ObjectID
          </button>
        </form>
      }
    />
  );
}
