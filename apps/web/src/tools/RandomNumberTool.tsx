import { Button } from "@/components/ui/button";
import { useRandomNumber } from "@/hooks/useRandomNumber";
import { GeneratorResult } from "@/tools/generator/GeneratorResult";
import { Dices } from "lucide-react";
import { useState } from "react";

export function RandomNumberTool() {
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(100);
  const [decimals, setDecimals] = useState(0);
  const [count, setCount] = useState(1);
  const { output, error, generate } = useRandomNumber();
  const result = output.map((value) => value.toFixed(decimals)).join("\n");

  return (
    <GeneratorResult
      icon={Dices}
      title="Random Number"
      subtitle="Generate uniformly sampled numbers with secure browser entropy."
      output={result}
      outputLabel="Random Number"
      outputMeta={
        output.length
          ? `${from}–${to} · ${decimals} decimals · uniform`
          : "Values are generated only when you request them"
      }
      error={error}
      languageLabel="RND"
      controls={
        <form
          className="generator-form generator-form--two-column"
          onSubmit={(event) => {
            event.preventDefault();
            generate({ from, to, decimals, count });
          }}
        >
          <label className="generator-field">
            From
            <input
              className="generator-input generator-input--mono"
              type="number"
              value={from}
              onChange={(event) => setFrom(Number(event.target.value))}
            />
          </label>
          <label className="generator-field">
            To
            <input
              className="generator-input generator-input--mono"
              type="number"
              value={to}
              onChange={(event) => setTo(Number(event.target.value))}
            />
          </label>
          <label className="generator-field">
            Decimals
            <input
              className="generator-input generator-input--mono"
              type="number"
              min="0"
              max="6"
              value={decimals}
              onChange={(event) => setDecimals(Number(event.target.value))}
            />
          </label>
          <label className="generator-field">
            Count
            <input
              className="generator-input generator-input--mono"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </label>
          <Button type="submit" className="generator-submit">
            Roll Number
          </Button>
          <p className="generator-help generator-help--wide">
            Uniform over the selected decimal grid. Results are never persisted.
          </p>
        </form>
      }
    />
  );
}
