import type { LucideIcon } from "lucide-react";
import { Check, Copy, FileCode2 } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared design-system primitives for Kitland "form + result" tools,
 * matching the Time & Network frames in design/design.pen (Tool Header,
 * Form panel, Result panel, Status Bar).
 */

const formWidths: Record<number, string> = {
  280: "lg:w-[280px]",
  310: "lg:w-[310px]",
  320: "lg:w-[320px]",
  340: "lg:w-[340px]",
  360: "lg:w-[360px]",
  380: "lg:w-[380px]",
};

export function ToolHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="size-11 shrink-0 flex items-center justify-center rounded-[11px] bg-primary-soft border border-primary text-primary">
          <Icon className="size-[22px]" />
        </div>
        <div className="min-w-0">
          <h2 className="m-0 text-[20px] font-bold font-display text-on-surface tracking-[-0.02em]">
            {title}
          </h2>
          <p className="m-0 mt-0.5 text-[13px] text-on-muted">{subtitle}</p>
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SampleAction({
  onClick,
  label = "Sample",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[34px] px-[12px] bg-surface-low border border-outline rounded-[8px] flex items-center gap-[7px] cursor-pointer transition-colors hover:bg-surface"
    >
      <FileCode2 className="size-[15px] text-on-muted" />
      <span className="text-[13px] font-semibold text-on-surface">{label}</span>
    </button>
  );
}

export function FormPanel({
  width = 320,
  children,
}: {
  width?: keyof typeof formWidths;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex w-full shrink-0 flex-col gap-3 rounded-[14px] bg-bg-elevated p-[18px] ${
        formWidths[width] ?? formWidths[320]
      }`}
    >
      {children}
    </section>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11px] font-normal uppercase tracking-[1.5px] text-on-faint">
      {children}
    </span>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[46px] items-center gap-2 rounded-[9px] bg-surface px-3">{children}</div>
  );
}

export function ValueInput({
  value,
  onChange,
  ariaLabel,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      placeholder={placeholder}
      spellCheck={false}
      className={`min-w-0 flex-1 bg-transparent font-mono text-[20px] font-semibold text-on-surface outline-none placeholder:text-on-faint ${className}`}
    />
  );
}

export function UnitSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  ariaLabel: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className="h-[30px] shrink-0 rounded-[6px] bg-surface-high px-2 font-mono text-[13px] font-semibold text-on-surface outline-none cursor-pointer"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function Segmented({
  value,
  onChange,
  options,
  size = "md",
  boxed = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  size?: "sm" | "md";
  boxed?: boolean;
}) {
  const height = size === "sm" ? "h-[28px]" : "h-[30px]";
  return (
    <div
      className={`flex gap-1 ${boxed ? "gap-[2px] rounded-[9px] bg-surface-high p-[3px]" : ""}`}
      role="group"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`${height} flex-1 rounded-[7px] font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
              boxed ? "rounded-[6px]" : ""
            } ${
              active
                ? "bg-primary text-on-primary"
                : boxed
                  ? "bg-surface text-on-muted hover:text-on-surface"
                  : "bg-surface-high text-on-muted hover:text-on-surface"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function RunButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-[38px] w-full rounded-[8px] bg-primary text-primary-foreground font-medium text-[13px] hover:bg-primary-strong transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-1.5"
    >
      {children}
    </button>
  );
}

export function NoteText({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[11px] leading-relaxed text-on-muted">{children}</p>;
}

export function ResultPanel({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-3 rounded-[14px] border border-outline bg-surface p-5">
      {children}
    </section>
  );
}

export function ResultHead({
  title,
  subtitle,
  onCopy,
  copied,
  copyLabel,
}: {
  title: string;
  subtitle?: string;
  onCopy?: () => void;
  copied?: boolean;
  filled?: boolean;
  copyLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex flex-col gap-[3px]">
        <span className="truncate text-[16px] font-semibold text-on-surface">{title}</span>
        {subtitle ? <span className="truncate text-[12px] text-on-muted">{subtitle}</span> : null}
      </div>
      {onCopy ? (
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? `Copied ${copyLabel ?? title}` : `Copy ${copyLabel ?? title}`}
          title={copied ? `Copied ${copyLabel ?? title}` : `Copy ${copyLabel ?? title}`}
          className={`size-[32px] shrink-0 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer ${
            copied
              ? "bg-success-soft text-success border border-success/40"
              : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
          }`}
        >
          {copied ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
      ) : null}
    </div>
  );
}

export function ResultCard({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-1.5 rounded-[12px] bg-bg-elevated p-4">{children}</div>;
}

export function BigValue({ value, sub }: { value: string; sub?: string }) {
  return (
    <ResultCard>
      <span className="font-mono text-[26px] font-bold leading-tight break-all text-on-surface">
        {value}
      </span>
      {sub ? <span className="text-[12px] text-on-muted">{sub}</span> : null}
    </ResultCard>
  );
}

export function ResultRow({
  label,
  value,
  uppercase = true,
}: {
  label: string;
  value: string;
  uppercase?: boolean;
}) {
  return (
    <div className="flex h-[32px] items-center gap-2 rounded-[8px] border border-outline bg-bg-elevated px-3">
      <span
        className={`shrink-0 font-mono text-[11px] tracking-[1px] text-on-faint ${uppercase ? "uppercase" : ""}`}
      >
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-right font-mono text-[13px] text-on-surface">
        {value}
      </span>
    </div>
  );
}

export function StatusBar({
  label,
  chip,
  stats,
  lang,
}: {
  label: string;
  chip: { icon: LucideIcon; text: string };
  stats?: string[];
  lang?: string;
}) {
  return (
    <div
      aria-label={label}
      className="flex h-[44px] shrink-0 items-center justify-between gap-3 rounded-[10px] border border-outline bg-surface-low px-4"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex shrink-0 items-center gap-[5px] rounded-[6px] bg-success-soft px-[9px] py-[5px] text-[11px] font-medium text-success">
          <chip.icon className="size-3" />
          {chip.text}
        </span>
        {stats && stats.length > 0 ? (
          <span className="hidden min-w-0 items-center gap-4 text-[11px] text-on-faint sm:flex">
            {stats.map((stat) => (
              <span key={stat} className="truncate">
                {stat}
              </span>
            ))}
          </span>
        ) : null}
      </div>
      {lang ? (
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-primary-strong">
          <FileCode2 className="size-3" />
          {lang}
        </span>
      ) : null}
    </div>
  );
}
