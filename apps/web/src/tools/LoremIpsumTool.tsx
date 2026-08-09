import { Button } from "@/components/ui/button";
import { useLoremIpsum } from "@/hooks/useLoremIpsum";
import { GeneratorResult } from "@/tools/generator/GeneratorResult";
import { FileText } from "lucide-react";
import { useState } from "react";

export function LoremIpsumTool() {
  const [amount, setAmount] = useState(3);
  const [unit, setUnit] = useState<"paragraphs" | "words" | "bytes" | "list-items">("paragraphs");
  const [startWithClassic, setStartWithClassic] = useState(true);
  const { output, error, generate } = useLoremIpsum();

  return (
    <GeneratorResult
      icon={FileText}
      title="Lorem Ipsum"
      subtitle="Generate bounded placeholder text locally."
      output={output ?? ""}
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
          className="generator-form"
          onSubmit={(event) => {
            event.preventDefault();
            generate({ amount, unit, startWithClassic });
          }}
        >
          <label className="generator-field">
            Amount
            <input
              className="generator-input generator-input--mono"
              type="number"
              min="1"
              max="10000"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>
          <label className="generator-field">
            Generate by
            <select
              className="generator-input"
              value={unit}
              onChange={(event) => setUnit(event.target.value as typeof unit)}
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="words">Words</option>
              <option value="bytes">Bytes</option>
              <option value="list-items">List items</option>
            </select>
          </label>
          <label className="generator-check">
            <input
              type="checkbox"
              checked={startWithClassic}
              onChange={(event) => setStartWithClassic(event.target.checked)}
            />
            <span>Start with “Lorem ipsum dolor sit amet…”</span>
          </label>
          <Button type="submit" className="w-full">
            Generate Lorem Ipsum
          </Button>
        </form>
      }
    />
  );
}
