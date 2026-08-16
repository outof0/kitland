import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { downloadText } from "../lib/clipboard";
import { Check, Copy, Download, type LucideIcon } from "lucide-react";
import { useCallback, useId, type ReactNode } from "react";

export type GeneratorResultProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  controls: ReactNode;
  output: string;
  outputLabel: string;
  outputMeta: string;
  error: string | null;
  languageLabel: string;
  onGenerate?: () => void;
};

/**
 * Design-system shell for all generate-pattern tools.
 * 100% aligned with design system tokens and contracts.
 */
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
}: GeneratorResultProps) {
  const headingId = useId();
  const { isCopied, copy } = useCopyFeedback();

  const onDownload = useCallback(() => {
    if (!output) return;
    downloadText(`${title.toLowerCase().replace(/\s+/g, "-")}-output.txt`, output);
  }, [output, title]);

  const outputLines = output ? output.split("\n") : [];
  const numLines = Math.max(outputLines.length, 8);
  const gutterLines = Array.from({ length: numLines }, (_, i) => i + 1);

  const status = error ? "Error" : output ? "Generated" : "Ready";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <div className="size-11 bg-primary-soft border border-primary/30 rounded-[11px] text-primary flex items-center justify-center shrink-0">
            <Icon className="size-5" />
          </div>
          <div>
            <h2
              id={headingId}
              className="text-[20px] font-bold font-display text-on-surface tracking-[-0.02em] m-0"
            >
              {title}
            </h2>
            <p className="text-[13px] text-on-muted m-0 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="bg-danger-soft border border-danger/40 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
        >
          {error}
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="tool-editor-stage grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        {/* Controls Card */}
        <div className="bg-surface-low border border-outline rounded-[12px] p-5 flex flex-col justify-between">
          {controls}
        </div>

        {/* Output Card */}
        <section
          aria-label={outputLabel}
          className="flex flex-col bg-surface-low border border-outline rounded-[12px] overflow-hidden focus-within:border-primary transition-all"
        >
          <div className="h-[45.5px] bg-surface border-b border-outline px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success" />
              <span className="text-[13px] font-medium text-on-surface">{outputLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void copy("output", output)}
                disabled={!output}
                title={isCopied("output") ? `Copied ${outputLabel}` : `Copy ${outputLabel}`}
                aria-label={isCopied("output") ? `Copied ${outputLabel}` : `Copy ${outputLabel}`}
                className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 ${
                  isCopied("output")
                    ? "bg-success-soft text-success border border-success/40"
                    : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                }`}
              >
                {isCopied("output") ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onDownload}
                disabled={!output}
                title={`Download ${outputLabel}`}
                aria-label={`Download ${outputLabel}`}
                className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface disabled:opacity-30 cursor-pointer transition-colors"
              >
                <Download className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-[280px] overflow-hidden bg-transparent">
            {/* Gutter */}
            <div className="w-[44px] bg-surface py-[14px] pr-[8px] text-right font-mono text-[13px] leading-[20px] text-on-muted select-none shrink-0 overflow-hidden border-r border-outline">
              {gutterLines.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>
            {/* Output code area */}
            <div
              className="flex-1 overflow-y-auto p-[14px_16px] font-mono text-[13px] leading-[20px] text-success break-all whitespace-pre-wrap select-text"
              // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable region must be keyboard-focusable (axe scrollable-region-focusable)
              tabIndex={0}
            >
              {output ? (
                <code>{output}</code>
              ) : (
                <span className="text-on-muted italic">Generate a value to see it here.</span>
              )}
            </div>
          </div>

          {outputMeta && (
            <div className="h-[32px] bg-surface/60 border-t border-outline px-4 flex items-center text-[11px] text-on-muted shrink-0 font-mono">
              {outputMeta}
            </div>
          )}
        </section>
      </div>

      {/* Status Bar */}
      <div className="h-[36px] bg-surface border border-outline rounded-[8px] px-3.5 flex items-center justify-between text-[12px] shrink-0 font-ui">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              status === "Generated"
                ? "bg-success-soft text-success"
                : status === "Error"
                  ? "bg-danger-soft text-danger"
                  : "bg-surface text-on-muted"
            }`}
          >
            {status}
          </span>
          <span className="text-on-muted">
            {output
              ? `${outputLines.length} ${outputLines.length === 1 ? "line" : "lines"} · ${output.length} chars`
              : "Awaiting generation"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary-strong font-mono text-[11px] font-semibold">
            &lt;&gt; {languageLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
