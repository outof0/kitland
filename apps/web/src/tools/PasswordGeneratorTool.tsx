import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { generatePassword, type PasswordOptions } from "@kitland/core";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import { useState } from "react";

const INITIAL_OPTIONS: PasswordOptions = {
  length: 20,
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
  const [copied, setCopied] = useState(false);

  function generate() {
    const result = generatePassword(options, secureBytes);
    if (!result.ok) return setError(result.error.message);
    setPassword(result.value);
    setError(null);
    setCopied(false);
  }
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <KeyRound />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">Password Generator</h2>
          <p className="tool-header__subtitle">
            Generate policy-controlled passwords with Web Crypto, entirely locally.
          </p>
        </div>
      </div>
      <output className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}>
        {error ?? "No password is saved or sent anywhere."}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(22rem,1.2fr)]">
        <section className="grid content-start gap-4 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]">
          <label htmlFor="password-length" className="grid gap-2 text-sm font-medium">
            Length{" "}
            <input
              id="password-length"
              type="number"
              min="8"
              max="128"
              value={options.length}
              onChange={(event) => setOptions({ ...options, length: Number(event.target.value) })}
              className="h-9 rounded-lg border border-input bg-transparent px-2.5 font-mono text-sm"
            />
          </label>
          <div className="grid gap-2 text-sm">
            {(["lowercase", "uppercase", "numbers", "symbols", "excludeAmbiguous"] as const).map(
              (key) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={(event) => setOptions({ ...options, [key]: event.target.checked })}
                  />{" "}
                  {key === "excludeAmbiguous" ? "Exclude ambiguous characters" : "Include " + key}
                </label>
              ),
            )}
          </div>
          <Button onClick={generate}>
            <RefreshCw /> Generate password
          </Button>
        </section>
        <section className="grid content-start gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-[18px]">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-sm font-semibold">Generated password</h3>
            <Button
              size="sm"
              disabled={!password}
              onClick={() => void copyText(password).then((result) => setCopied(result.ok))}
            >
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <output className="min-h-20 break-all rounded-xl bg-[var(--bg-elevated)] p-4 font-mono text-sm">
            {password || "Choose options, then generate a password."}
          </output>
        </section>
      </section>
    </>
  );
}
