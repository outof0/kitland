import { GeneratorResult } from "../components/GeneratorResult";
import { generateNanoid, NANOID_DEFAULT_ALPHABET } from "@kitland/core";
import { Fingerprint, RefreshCw, RotateCcw } from "lucide-react";
import { useCallback, useId, useState } from "react";

const secureBytes = (length: number) => crypto.getRandomValues(new Uint8Array(length));

export function NanoidGeneratorTool() {
  const lengthId = useId();
  const alphabetId = useId();
  const [length, setLength] = useState(21);
  const [alphabet, setAlphabet] = useState(NANOID_DEFAULT_ALPHABET);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(() => {
    const result = generateNanoid({ length, alphabet }, secureBytes);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setValue(result.value);
    setError(null);
  }, [length, alphabet]);

  return (
    <GeneratorResult
      icon={Fingerprint}
      title="NanoID Generator"
      subtitle="Generate compact, URL-safe, collision-resistant unique identifiers locally."
      output={value}
      outputLabel="Generated NanoID"
      outputMeta={
        value
          ? `${value.length} characters · alphabet size ${alphabet.length} · local only`
          : "Choose options, then generate"
      }
      error={error}
      languageLabel="NANOID"
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
              <label htmlFor={lengthId} className="text-[12px] font-semibold text-on-muted">
                Length
              </label>
              <span className="font-mono text-[12px] text-primary font-bold">{length}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="128"
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
                className="flex-1 accent-primary cursor-pointer"
                aria-label="Length range"
              />
              <input
                id={lengthId}
                type="number"
                min="1"
                max="256"
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
                className="w-16 h-[32px] rounded-[6px] border border-outline bg-surface-low px-2 text-center font-mono text-[13px] text-on-surface outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={alphabetId} className="text-[12px] font-semibold text-on-muted">
                Custom Alphabet
              </label>
              <button
                type="button"
                onClick={() => setAlphabet(NANOID_DEFAULT_ALPHABET)}
                className="text-[11px] text-primary hover:text-primary-soft flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="size-3" />
                Reset
              </button>
            </div>
            <input
              id={alphabetId}
              type="text"
              value={alphabet}
              onChange={(event) => setAlphabet(event.target.value)}
              className="h-[36px] w-full rounded-[8px] border border-outline bg-surface-low px-3 font-mono text-[12px] text-on-surface outline-none transition focus:border-primary"
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            className="mt-2 h-[38px] w-full rounded-[8px] bg-primary text-primary-foreground font-medium text-[13px] hover:bg-primary-strong transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw className="size-4" />
            Generate NanoID
          </button>
        </form>
      }
    />
  );
}
