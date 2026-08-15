import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

function cn(...classes: readonly (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Design-system chrome shared by every tool pattern across Web, Extension, and other hosts.
 *
 * Metrics match design.pen tool frames (Base64 Z1RWQB / JSON Formatter FdGX5):
 * 44×44 icon tile, 20px Manrope title, 13px muted subtitle, compact status chip.
 */

export function ToolPageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  titleId,
  className,
}: {
  readonly icon: LucideIcon | ((props: { className?: string }) => ReactNode);
  readonly title: string;
  readonly subtitle: string;
  readonly actions?: ReactNode;
  readonly titleId?: string;
  readonly className?: string;
}) {
  return (
    <header
      className={cn("flex min-h-11 sm:min-h-12 shrink-0 items-center gap-3 sm:gap-3.5", className)}
    >
      <div
        className="relative size-10 sm:size-11 shrink-0 rounded-[10px] sm:rounded-[11px] border border-primary/40 bg-primary/15 flex items-center justify-center text-primary overflow-hidden shadow-xs"
        aria-hidden="true"
      >
        <Icon className="size-5 sm:size-[22px] text-primary" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2
          id={titleId}
          className="m-0 font-heading text-lg sm:text-xl leading-tight font-bold tracking-tight text-on-surface truncate"
        >
          {title}
        </h2>
        <p className="m-0 text-[13px] leading-snug text-on-muted max-sm:hidden">{subtitle}</p>
      </div>
      {actions ? (
        <div className="ml-auto flex shrink-0 items-center gap-2 max-sm:gap-1.5">{actions}</div>
      ) : null}
    </header>
  );
}

export function ToolOptionsBar({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly "aria-label"?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-12 shrink-0 flex-wrap items-center gap-3 rounded-lg border border-outline bg-surface-low/50 px-3 py-1.5 max-sm:justify-center",
        className,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export function ToolFieldNote({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <p className={cn("m-0 shrink-0 text-[11px] leading-4 font-medium text-on-muted", className)}>
      {children}
    </p>
  );
}

export type ToolStatusTone = "ready" | "error" | "processing" | "neutral";

const STATUS_TONE_CLASS: Record<ToolStatusTone, string> = {
  ready: "bg-success-soft text-success border-transparent",
  error: "bg-danger-soft text-danger border-transparent",
  processing: "bg-primary-soft text-primary-strong border-transparent",
  neutral: "bg-surface text-on-muted border-outline",
};

export function ToolStatusBar({
  status,
  tone = "neutral",
  languageLabel,
  languageIcon,
  detail,
  className,
  "aria-label": ariaLabel,
}: {
  readonly status: string;
  readonly tone?: ToolStatusTone;
  readonly languageLabel: string;
  readonly languageIcon?: ReactNode;
  readonly detail?: ReactNode;
  readonly className?: string;
  readonly "aria-label"?: string;
}) {
  return (
    <footer
      className={cn(
        "flex min-h-11 shrink-0 items-center justify-between gap-3 text-xs max-sm:min-h-12 border border-outline rounded-lg bg-surface-low/50 px-3.5",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "inline-flex min-h-[26px] items-center justify-center rounded-md border px-2.5 py-0.5 font-sans text-[11.5px] font-semibold",
            STATUS_TONE_CLASS[tone],
          )}
        >
          {status}
        </span>
        {detail ? (
          <span className="min-w-0 truncate text-on-muted text-[11px] font-mono">{detail}</span>
        ) : null}
      </div>
      <span className="flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-outline text-[11px] font-semibold text-primary-strong font-mono">
        {languageIcon}
        {languageLabel}
      </span>
    </footer>
  );
}

/** Shared segment control styling from design option rails. */
export const toolSegmentGroupClass =
  "m-0 flex min-h-8 min-w-0 max-w-full flex-wrap items-center gap-1 rounded-lg border border-outline bg-surface p-1";

export const toolSegmentClass =
  "h-7 min-w-fit rounded-md border-0 bg-transparent px-2.5 text-xs font-semibold text-on-muted transition-colors cursor-pointer hover:bg-surface-low hover:text-on-surface active:bg-primary-soft active:text-primary-strong aria-pressed:text-primary-strong";

/** Quiet icon rail button — highlight only on hover / press. */
export const toolIconButtonClass =
  "flex size-[40px] items-center justify-center rounded-[10px] border border-outline bg-surface-low text-on-muted transition-colors cursor-pointer hover:bg-surface hover:text-on-surface hover:border-outline-strong active:bg-primary-soft active:text-primary active:border-primary/50 disabled:opacity-40";

/** Outline sample/clear/header action matching design.pen tool chrome. */
export const toolHeaderActionClass =
  "h-9 gap-1.5 rounded-lg border-outline bg-surface px-3 text-xs font-semibold text-on-surface hover:bg-surface-low shadow-2xs transition-colors cursor-pointer [&_svg]:size-4 [&_svg]:text-on-muted max-sm:h-10 max-sm:min-w-10 max-sm:justify-center";

export const toolClearActionClass =
  "h-9 gap-1.5 rounded-lg border-red-900/60 bg-red-950/40 px-3 text-xs font-semibold text-red-200 hover:bg-red-950/70 shadow-2xs transition-colors cursor-pointer [&_svg]:size-4 [&_svg]:text-red-300 max-sm:h-10 max-sm:min-w-10 max-sm:justify-center";

/** Two-pane editor card shell used by transform tools. */
export function ToolEditorPane({
  label,
  dotTone = "primary",
  toolbar,
  children,
  footer,
  error,
  className,
  labelledBy,
}: {
  readonly label: string;
  readonly dotTone?: "primary" | "success" | "warning";
  readonly toolbar?: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly error?: ReactNode;
  readonly className?: string;
  readonly labelledBy?: string;
}) {
  const dotColor =
    dotTone === "success" ? "bg-success" : dotTone === "warning" ? "bg-warning" : "bg-primary";

  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-outline bg-surface shadow-xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all",
        className,
      )}
      aria-labelledby={labelledBy}
    >
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-outline bg-surface-low px-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", dotColor)} aria-hidden="true" />
          <h3
            id={labelledBy}
            className="m-0 text-xs font-bold tracking-wide text-on-surface uppercase"
          >
            {label}
          </h3>
        </div>
        {toolbar ? <div className="flex shrink-0 items-center gap-1.5">{toolbar}</div> : null}
      </div>
      {children}
      {error}
      {footer ? (
        <div className="flex h-8 shrink-0 items-center border-t border-outline bg-surface-low/50 px-3.5 text-[11px] font-mono text-on-muted">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
