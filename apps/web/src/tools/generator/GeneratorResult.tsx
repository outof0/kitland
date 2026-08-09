import { Button } from "@/components/ui/button";
import { copyText, downloadText } from "@/lib/clipboard";
import { CircleCheck, Copy, Download, FileCode, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const COPY_CONFIRMATION_MS = 900;

export function GeneratorResult({
  icon: Icon,
  title,
  subtitle,
  controls,
  output,
  outputLabel,
  outputMeta,
  error,
  languageLabel,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  controls: ReactNode;
  output: string;
  outputLabel: string;
  outputMeta: string;
  error: string | null;
  languageLabel: string;
}) {
  const timer = useRef<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const feedback = error ?? copyError;

  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current);
    },
    [],
  );

  const onCopy = useCallback(async () => {
    const result = await copyText(output);
    if (!result.ok) {
      setCopyError(result.message);
      setCopied(false);
      return;
    }
    setCopyError("");
    setCopied(true);
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCopied(false);
      timer.current = undefined;
    }, COPY_CONFIRMATION_MS);
  }, [output]);

  const onDownload = useCallback(() => {
    if (!output) {
      setCopyError("Generate a value before downloading it.");
      return;
    }
    downloadText("kitland-generated.txt", output);
    setCopyError("");
  }, [output]);

  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <Icon />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">{title}</h2>
          <p className="tool-header__subtitle">{subtitle}</p>
        </div>
      </div>
      <output
        className={feedback ? "tool-feedback tool-feedback--error" : "tool-feedback"}
        role={feedback ? "alert" : undefined}
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback}
      </output>
      <div className="generator-layout">
        <section className="generator-controls">{controls}</section>
        <section className="generator-output" aria-label={outputLabel}>
          <div className="generator-output__header">
            <div>
              <h3 className="generator-output__title">{outputLabel}</h3>
              <p className="generator-output__subtitle">Generated locally on this device</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => void onCopy()}
                disabled={!output}
                aria-label={copied ? `${outputLabel} copied` : `Copy ${outputLabel}`}
              >
                {copied ? <CircleCheck aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={onDownload}
                disabled={!output}
                aria-label={`Download ${outputLabel}`}
                title="Download result as a text file"
              >
                <Download aria-hidden="true" />
              </Button>
            </div>
          </div>
          <code className="generator-output__code">
            {output || "Generate a value to see it here."}
          </code>
          <p className="generator-output__meta">{outputMeta}</p>
        </section>
      </div>
      <div className="tool-status">
        <span
          className={
            output && !feedback ? "tool-status__chip" : "tool-status__chip tool-status__chip--ready"
          }
        >
          {output && !feedback ? <CircleCheck aria-hidden="true" /> : null}
          {feedback ? "Error" : output ? "Generated" : "Ready"}
        </span>
        <span className="tool-status__lang">
          <FileCode aria-hidden="true" />
          {languageLabel}
        </span>
      </div>
    </>
  );
}
