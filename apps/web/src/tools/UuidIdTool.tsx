import { Button } from "@/components/ui/button";
import { useUuidGenerator } from "@/hooks/useUuidGenerator";
import { copyText } from "@/lib/clipboard";
import { CircleCheck, Copy, Fingerprint, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const COPY_CONFIRMATION_MS = 1_500;

/**
 * UUID / ID generator — `generate` conformance implementation.
 *
 * The available slice intentionally supports one explicit contract: UUID v4.
 * Other identifier families should arrive as their own catalog tools instead
 * of being silently represented as a UUID option.
 */
export function UuidIdTool() {
  const headingId = useId();
  const resultDescriptionId = useId();
  const copyResetTimer = useRef<number | undefined>(undefined);
  const { current, history, error: generationError, generate, clearHistory } = useUuidGenerator();
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [copyAnnouncement, setCopyAnnouncement] = useState("");

  useEffect(
    () => () => {
      if (copyResetTimer.current !== undefined) {
        window.clearTimeout(copyResetTimer.current);
      }
    },
    [],
  );

  const onCopy = useCallback(async (value: string) => {
    const result = await copyText(value);
    if (!result.ok) {
      setCopiedValue(null);
      setCopyFeedback(result.message);
      setCopyAnnouncement("");
      return;
    }

    setCopiedValue(value);
    setCopyFeedback(null);
    setCopyAnnouncement("UUID copied to clipboard.");
    if (copyResetTimer.current !== undefined) {
      window.clearTimeout(copyResetTimer.current);
    }
    copyResetTimer.current = window.setTimeout(() => {
      setCopiedValue((active) => (active === value ? null : active));
      setCopyAnnouncement("");
      copyResetTimer.current = undefined;
    }, COPY_CONFIRMATION_MS);
  }, []);

  const onGenerate = useCallback(() => {
    generate();
    setCopiedValue(null);
    setCopyFeedback(null);
    setCopyAnnouncement("");
  }, [generate]);

  const previousValues = current ? history.filter((value) => value !== current) : history;
  const feedback = generationError ?? copyFeedback;

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <Fingerprint />
        </div>
        <div className="tool-header__texts">
          <h2 id={headingId} className="tool-header__title">
            Generate UUIDs &amp; IDs
          </h2>
          <p className="tool-header__subtitle">
            Create RFC 4122 UUID v4 identifiers locally with secure browser randomness.
          </p>
        </div>
      </div>

      <output
        className={feedback ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        role={feedback ? "alert" : undefined}
        aria-live={feedback ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {feedback ?? ""}
      </output>
      <output className="sr-only" aria-live="polite" aria-atomic="true">
        {copyAnnouncement}
      </output>

      <section
        className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[minmax(17rem,18.75rem)_minmax(0,1fr)]"
        aria-labelledby={headingId}
      >
        <form
          className="flex flex-col gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px]"
          onSubmit={(event) => {
            event.preventDefault();
            onGenerate();
          }}
        >
          <p className="m-0 font-mono text-[11px] tracking-[0.15em] text-[var(--on-faint)]">
            VERSION + FORMAT
          </p>
          <dl className="m-0 grid gap-2">
            <DetailRow label="Version" value="v4 (random)" />
            <DetailRow label="Variant" value="RFC 4122" />
            <DetailRow label="Format" value="8-4-4-4-12" />
          </dl>
          <Button
            type="submit"
            className="mt-1 h-[38px] w-full gap-2"
            aria-describedby={resultDescriptionId}
          >
            <RefreshCw aria-hidden="true" />
            Generate UUID
          </Button>
          <p className="m-0 text-[11px] leading-[1.4] text-[var(--on-faint)]">
            v4 uses 122 bits of cryptographically secure randomness. Nothing is sent to a server.
          </p>
        </form>

        <section
          className="flex min-h-[22rem] flex-col gap-[14px] rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-5"
          aria-labelledby={resultDescriptionId}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3
                id={resultDescriptionId}
                className="m-0 text-base font-semibold text-[var(--on-surface)]"
              >
                UUID 4
              </h3>
              <p className="m-0 mt-0.5 text-xs text-[var(--on-muted)]">Next generated identifier</p>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-8 min-w-[78px] gap-1.5"
              onClick={() => current && void onCopy(current)}
              disabled={!current}
              aria-label={
                current && copiedValue === current ? "UUID copied" : "Copy generated UUID"
              }
            >
              {current && copiedValue === current ? (
                <CircleCheck aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              {current && copiedValue === current ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="rounded-xl bg-[var(--bg-elevated)] p-[18px]">
            {current ? (
              <code className="block break-all font-mono text-xl leading-[1.45] font-semibold text-[var(--on-surface)] sm:text-2xl">
                {current}
              </code>
            ) : (
              <p className="m-0 text-sm leading-6 text-[var(--on-muted)]">
                Generate a UUID to see it here.
              </p>
            )}
            <p className="m-0 mt-2 flex items-center gap-1.5 font-mono text-xs text-[var(--on-faint)]">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              RFC 4122 · v4 · 128-bit
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="m-0 font-mono text-[11px] tracking-[0.15em] text-[var(--on-faint)]">
              MORE GENERATED
            </p>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={clearHistory}
              disabled={history.length === 0}
              aria-label="Clear generated UUID history"
            >
              <Trash2 aria-hidden="true" />
              Clear
            </Button>
          </div>

          {previousValues.length > 0 ? (
            <ul className="m-0 grid list-none gap-1.5 p-0">
              {previousValues.map((value) => (
                <li
                  key={value}
                  className="flex min-w-0 items-center gap-2.5 rounded-lg bg-[var(--bg-elevated)] px-3 py-1.5"
                >
                  <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-[var(--on-surface)]">
                    {value}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="h-[22px] px-2 text-[10px]"
                    onClick={() => void onCopy(value)}
                    aria-label={copiedValue === value ? "UUID copied" : `Copy ${value}`}
                  >
                    {copiedValue === value ? (
                      <CircleCheck aria-hidden="true" />
                    ) : (
                      <Copy aria-hidden="true" />
                    )}
                    {copiedValue === value ? "Copied" : "Copy"}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-[var(--on-muted)]">
              Previous UUIDs generated in this session will appear here.
            </p>
          )}
        </section>
      </section>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3 rounded-[9px] border border-[var(--outline)] bg-[var(--surface)] px-3">
      <dt className="text-[13px] text-[var(--on-muted)]">{label}</dt>
      <dd className="m-0 font-mono text-xs text-[var(--on-surface)]">{value}</dd>
    </div>
  );
}
