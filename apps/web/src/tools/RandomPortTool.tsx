import { Button } from "@/components/ui/button";
import { useRandomPort } from "@/hooks/useRandomPort";
import { GeneratorResult } from "@/tools/generator/GeneratorResult";
import { Network } from "lucide-react";
import { useState } from "react";

export function RandomPortTool() {
  const [range, setRange] = useState<"dynamic" | "ephemeral">("dynamic");
  const [protocol, setProtocol] = useState<"tcp" | "udp">("tcp");
  const [count, setCount] = useState(1);
  const { output, error, generate } = useRandomPort();
  const result = output.join("\n");
  const rangeText = range === "dynamic" ? "1024–65535" : "49152–65535";

  return (
    <GeneratorResult
      icon={Network}
      title="Random Port"
      subtitle="Pick random TCP or UDP port numbers locally."
      output={result}
      outputLabel="Random Port"
      outputMeta={
        output.length
          ? `${rangeText} · ${protocol.toUpperCase()} · not availability-checked`
          : "A generated port may already be in use"
      }
      error={error}
      languageLabel="PORT"
      controls={
        <form
          className="generator-form"
          onSubmit={(event) => {
            event.preventDefault();
            generate({ range, protocol, count });
          }}
        >
          <label className="generator-field">
            Range
            <select
              className="generator-input"
              value={range}
              onChange={(event) => setRange(event.target.value as typeof range)}
            >
              <option value="dynamic">Dynamic (1024–65535)</option>
              <option value="ephemeral">Ephemeral (49152–65535)</option>
            </select>
          </label>
          <label className="generator-field">
            Protocol
            <select
              className="generator-input"
              value={protocol}
              onChange={(event) => setProtocol(event.target.value as typeof protocol)}
            >
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
            </select>
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
          <Button type="submit" className="w-full">
            Pick Port
          </Button>
          <p className="generator-help">
            This does not test whether a port is free on your machine.
          </p>
        </form>
      }
    />
  );
}
