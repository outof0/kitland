import { generateRandomNumbers } from "@kitland/core";
import { Dices } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { GeneratorResult } from "../components/GeneratorResult";
import { secureRandomUint32 } from "../lib/secure-random";

export function RandomNumberTool() {
  const fromId = useId();
  const toId = useId();
  const decimalsId = useId();
  const countId = useId();

  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(100);
  const [decimals, setDecimals] = useState(0);
  const [count, setCount] = useState(1);
  const [values, setValues] = useState<readonly number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generatedOptions, setGeneratedOptions] = useState<{
    from: number;
    to: number;
    decimals: number;
  } | null>(null);

  const generate = useCallback(() => {
    const result = generateRandomNumbers({ from, to, decimals, count }, secureRandomUint32);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setValues(result.value.values);
    setGeneratedOptions({
      from,
      to,
      decimals: result.value.decimals,
    });
    setError(null);
  }, [count, decimals, from, to]);

  const result = values
    .map((value) => value.toFixed(generatedOptions?.decimals ?? decimals))
    .join("\n");
  const effectiveDecimals = generatedOptions?.decimals ?? decimals;

  return (
    <GeneratorResult
      icon={Dices}
      title="Random Number"
      subtitle="Generate uniformly sampled numbers with secure browser entropy."
      output={result}
      outputLabel="Random Number"
      outputMeta={
        values.length && generatedOptions
          ? `${generatedOptions.from}–${generatedOptions.to} · ${effectiveDecimals} decimals · uniform`
          : `${from}–${to} · ${decimals} decimals · uniform`
      }
      error={error}
      languageLabel="RND"
      controls={
        <form
          className="grid grid-cols-2 gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={fromId} className="text-[12px] font-semibold text-on-muted">
              From
            </label>
            <input
              id={fromId}
              className="h-[36px] w-full rounded-[8px] border border-outline bg-surface px-3 font-mono text-[13px] text-on-surface outline-none transition focus:border-primary"
              type="number"
              value={from}
              onChange={(event) => setFrom(Number(event.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={toId} className="text-[12px] font-semibold text-on-muted">
              To
            </label>
            <input
              id={toId}
              className="h-[36px] w-full rounded-[8px] border border-outline bg-surface px-3 font-mono text-[13px] text-on-surface outline-none transition focus:border-primary"
              type="number"
              value={to}
              onChange={(event) => setTo(Number(event.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={decimalsId} className="text-[12px] font-semibold text-on-muted">
              Decimals
            </label>
            <input
              id={decimalsId}
              className="h-[36px] w-full rounded-[8px] border border-outline bg-surface px-3 font-mono text-[13px] text-on-surface outline-none transition focus:border-primary"
              type="number"
              min="0"
              max="6"
              value={decimals}
              onChange={(event) => setDecimals(Number(event.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={countId} className="text-[12px] font-semibold text-on-muted">
              Count
            </label>
            <input
              id={countId}
              className="h-[36px] w-full rounded-[8px] border border-outline bg-surface px-3 font-mono text-[13px] text-on-surface outline-none transition focus:border-primary"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </div>
          <button
            type="submit"
            className="col-span-2 mt-2 h-[38px] w-full rounded-[8px] bg-primary text-primary-foreground font-medium text-[13px] hover:bg-primary-strong transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Dices className="size-4" />
            Roll Number
          </button>
        </form>
      }
    />
  );
}
