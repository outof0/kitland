import { generateLoremIpsum, type LoremUnit } from "@kitland/core";
import { FileText, RefreshCw } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { GeneratorResult } from "../components/GeneratorResult";

export function LoremIpsumTool() {
  const amountId = useId();
  const unitId = useId();
  const classicId = useId();
  const [amount, setAmount] = useState(3);
  const [unit, setUnit] = useState<LoremUnit>("paragraphs");
  const [startWithClassic, setStartWithClassic] = useState(true);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(() => {
    const result = generateLoremIpsum({ amount, unit, startWithClassic });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setOutput(result.value);
    setError(null);
  }, [amount, startWithClassic, unit]);

  return (
    <GeneratorResult
      icon={FileText}
      title="Lorem Ipsum"
      subtitle="Generate bounded placeholder text locally."
      output={output}
      outputLabel="Generated Lorem Ipsum"
      outputMeta={
        output
          ? `${output.split(/\s+/u).filter(Boolean).length.toLocaleString()} words · local only`
          : "Choose options, then generate"
      }
      error={error}
      languageLabel="LOREM"
      controls={
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor={amountId} className="text-[12px] font-semibold text-on-muted">
              Amount
            </label>
            <input
              id={amountId}
              className="h-[36px] w-full rounded-[8px] border border-outline bg-surface px-3 font-mono text-[13px] text-on-surface outline-none transition focus:border-primary"
              type="number"
              min="1"
              max="10000"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={unitId} className="text-[12px] font-semibold text-on-muted">
              Generate by
            </label>
            <select
              id={unitId}
              className="h-[36px] w-full rounded-[8px] border border-outline bg-surface px-3 text-[13px] text-on-surface outline-none transition focus:border-primary"
              value={unit}
              onChange={(event) => setUnit(event.target.value as LoremUnit)}
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="words">Words</option>
              <option value="bytes">Bytes</option>
              <option value="list-items">List items</option>
            </select>
          </div>

          <label
            htmlFor={classicId}
            className="flex items-center gap-2.5 text-[12px] text-on-muted cursor-pointer"
          >
            <input
              id={classicId}
              className="size-4 rounded border-outline bg-surface text-primary focus:ring-0 accent-primary cursor-pointer"
              type="checkbox"
              checked={startWithClassic}
              onChange={(event) => setStartWithClassic(event.target.checked)}
            />
            <span>Start with “Lorem ipsum dolor sit amet…”</span>
          </label>

          <button
            type="submit"
            className="mt-2 h-[38px] w-full rounded-[8px] bg-primary text-primary-foreground font-medium text-[13px] hover:bg-primary-strong transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className="size-4" />
            Generate Lorem Ipsum
          </button>
        </form>
      }
    />
  );
}
