import { Check, Copy } from "lucide-react";

export type CopyButtonProps = {
  isCopied: boolean;
  onCopy: () => void;
  disabled?: boolean;
  label?: string;
  copiedLabel?: string;
  variant?: "outline" | "ghost" | "icon";
  size?: "sm" | "md";
  className?: string;
};

/**
 * Standard unified Copy button matching Kitland design system.
 * Follows Base64 / Design tokens:
 * - Idle: subtle outline/ghost with Copy icon
 * - Copied: changes icon to Check, switches color to success green tone (success-soft bg + success text).
 */
export function CopyButton({
  isCopied,
  onCopy,
  disabled = false,
  label = "Copy",
  copiedLabel = "Copy",
  variant = "outline",
  size = "md",
  className = "",
}: CopyButtonProps) {
  const isIconOnly = variant === "icon";

  const sizeClasses =
    size === "sm"
      ? isIconOnly
        ? "size-7 rounded-[6px]"
        : "h-[28px] px-2.5 text-[11px] gap-1.5 rounded-[7px]"
      : isIconOnly
        ? "size-8 rounded-[8px]"
        : "h-[32px] px-3 text-[12px] gap-1.5 rounded-[8px]";

  const stateClasses = isCopied
    ? "border-success/40 bg-success-soft text-success shadow-none"
    : variant === "ghost"
      ? "border-transparent bg-transparent text-on-muted hover:text-on-surface hover:bg-surface"
      : "border-outline bg-surface-low text-on-muted hover:border-outline-strong hover:bg-surface hover:text-on-surface";

  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled}
      title={isCopied ? copiedLabel : label}
      aria-label={isCopied ? copiedLabel : label}
      className={`inline-flex items-center justify-center font-medium border font-ui transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none ${sizeClasses} ${stateClasses} ${className}`}
    >
      {isCopied ? (
        <Check
          className={
            size === "sm" ? "size-3 text-success shrink-0" : "size-3.5 text-success shrink-0"
          }
        />
      ) : (
        <Copy className={size === "sm" ? "size-3 shrink-0" : "size-3.5 shrink-0"} />
      )}
      {!isIconOnly && <span>{isCopied ? copiedLabel : label}</span>}
    </button>
  );
}
