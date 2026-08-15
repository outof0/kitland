import { RefreshCw } from "lucide-react";

export type AutoTransformToggleProps = {
  readonly autoFormat: boolean;
  readonly onToggle: () => void;
  readonly noun?: "transform" | "format";
};

export function AutoTransformToggle({
  autoFormat,
  onToggle,
  noun = "transform",
}: AutoTransformToggleProps) {
  const detail = autoFormat
    ? `Updates the result as you type. Click to switch to manual.`
    : `Manual mode. Click to update live, or use the action button.`;
  const label = autoFormat ? `Auto-${noun} on` : `Auto-${noun} off`;

  return (
    <div className="group relative flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={autoFormat}
        aria-label={`${label}. ${detail}`}
        title={detail}
        className={`flex size-[40px] items-center justify-center rounded-[10px] border transition-all cursor-pointer ${
          autoFormat
            ? "border-primary/40 bg-primary-soft text-primary-strong shadow-xs hover:border-primary/60"
            : "border-outline bg-surface-low text-on-muted hover:bg-surface hover:text-on-surface hover:border-outline-strong"
        }`}
      >
        <RefreshCw className="size-[17px]" aria-hidden="true" />
      </button>
      <span
        className={`text-[11px] font-medium text-center max-lg:hidden ${
          autoFormat ? "text-primary-strong font-semibold" : "text-on-muted"
        }`}
      >
        Auto
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 w-[11.5rem] -translate-x-1/2 rounded-md border border-outline bg-bg-elevated px-2 py-1.5 text-center text-[10px] leading-snug text-on-muted opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-lg:hidden"
      >
        {detail}
      </span>
    </div>
  );
}
