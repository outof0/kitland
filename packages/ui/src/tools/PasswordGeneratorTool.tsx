import { GeneratorResult } from "../components/GeneratorResult";
import { generatePassword, type PasswordOptions } from "@kitland/core";
import { KeyRound } from "lucide-react";
import { useCallback, useId, useState } from "react";

const INITIAL_OPTIONS: PasswordOptions = {
  length: 24,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};
const secureBytes = (length: number) => crypto.getRandomValues(new Uint8Array(length));

export function PasswordGeneratorTool() {
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lengthInputId = useId();
  const lengthRangeId = useId();

  const generate = useCallback(() => {
    const result = generatePassword(options, secureBytes);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setPassword(result.value);
    setError(null);
  }, [options]);

  return (
    <GeneratorResult
      icon={KeyRound}
      title="Password Generator"
      subtitle="Generate policy-controlled cryptographically secure passwords with Web Crypto."
      output={password}
      outputLabel="Generated Password"
      outputMeta={
        password
          ? `${password.length} characters · entropy ~${Math.round(password.length * Math.log2(options.symbols ? 94 : options.numbers ? 62 : 52))} bits · local only`
          : "Choose options, then generate"
      }
      error={error}
      languageLabel="PASSWORD"
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
              <label htmlFor={lengthInputId} className="text-[12px] font-semibold text-on-muted">
                Length
              </label>
              <span className="font-mono text-[12px] text-primary font-bold">{options.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id={lengthRangeId}
                type="range"
                min="8"
                max="128"
                aria-label="Password length slider"
                value={options.length}
                onChange={(event) => setOptions({ ...options, length: Number(event.target.value) })}
                className="flex-1 accent-primary cursor-pointer"
              />
              <input
                id={lengthInputId}
                type="number"
                min="8"
                max="128"
                aria-label="Password length"
                value={options.length}
                onChange={(event) => setOptions({ ...options, length: Number(event.target.value) })}
                className="w-16 h-[32px] rounded-[6px] border border-outline bg-surface px-2 text-center font-mono text-[13px] text-on-surface outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-outline">
            <span className="text-[11px] font-semibold text-on-muted uppercase tracking-wider">
              Character Sets
            </span>
            {(
              [
                { key: "lowercase", label: "Lowercase (a-z)" },
                { key: "uppercase", label: "Uppercase (A-Z)" },
                { key: "numbers", label: "Numbers (0-9)" },
                { key: "symbols", label: "Symbols (!@#$...)" },
                { key: "excludeAmbiguous", label: "Exclude ambiguous (0, O, l, 1, I)" },
              ] as const
            ).map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2.5 text-[12px] text-on-surface cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(event) => setOptions({ ...options, [key]: event.target.checked })}
                  className="size-4 rounded border-outline bg-surface text-primary focus:ring-0 accent-primary cursor-pointer"
                />
                <span className={key === "excludeAmbiguous" ? "text-on-muted" : "text-on-surface"}>
                  {label}
                </span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="mt-2 h-[38px] w-full rounded-[8px] bg-primary text-primary-foreground font-medium text-[13px] hover:bg-primary-strong transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <KeyRound className="size-4" />
            Generate Password
          </button>
        </form>
      }
    />
  );
}
