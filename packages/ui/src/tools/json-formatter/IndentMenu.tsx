import { Check, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

/** Floating indent-width picker; positions itself under its trigger. */
export function IndentMenu({
  value,
  onChange,
  disabled,
  compact = false,
  triggerLabel,
}: {
  value: 2 | 4 | "tab";
  onChange: (next: 2 | 4 | "tab") => void;
  disabled?: boolean;
  compact?: boolean;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; minWidth: number } | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLFieldSetElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeWithFocus = () => {
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeWithFocus();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", closeWithFocus, true);
    window.addEventListener("blur", closeWithFocus);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", closeWithFocus, true);
      window.removeEventListener("blur", closeWithFocus);
    };
  }, [open]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    setPosition(rect ? { top: rect.bottom + 6, left: rect.left, minWidth: rect.width } : null);
    setOpen(true);
  };

  const displayTrigger = value === "tab" ? "Tab" : compact ? `${value}sp` : value;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        title="Indent width"
        onClick={toggle}
        className={
          compact
            ? "flex h-7 shrink-0 items-center gap-1.5 rounded-[7px] border border-outline bg-surface-low px-1.5 text-[11px] font-semibold text-on-muted hover:bg-surface-high [&_svg]:size-3 [&_svg]:text-on-faint"
            : "flex h-[32px] shrink-0 items-center gap-1.5 rounded-[8px] border border-outline bg-surface-low px-[10px] text-[12px] font-semibold text-on-surface hover:bg-surface hover:border-outline-strong transition-colors cursor-pointer [&_svg]:size-3.5 [&_svg]:text-on-faint"
        }
      >
        {displayTrigger}
        <ChevronDown aria-hidden="true" />
      </button>
      {open && position
        ? createPortal(
            <fieldset
              ref={panelRef}
              aria-label="Indent options"
              className="absolute z-50 rounded-lg border border-outline bg-surface p-1 shadow-xl"
              style={{ top: position.top, left: position.left, minWidth: position.minWidth }}
            >
              {([2, 4, "tab"] as const).map((spaces) => (
                <button
                  key={spaces}
                  type="button"
                  disabled={disabled}
                  aria-pressed={value === spaces}
                  onClick={() => {
                    onChange(spaces);
                    setOpen(false);
                  }}
                  className="flex h-8 w-full items-center justify-between gap-2 rounded-md px-2.5 text-xs font-semibold whitespace-nowrap text-on-surface hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-40 aria-pressed:bg-primary-soft aria-pressed:text-primary-strong"
                >
                  {spaces === "tab" ? "Tab" : `${spaces} spaces`}
                  {value === spaces ? <Check className="size-3.5" aria-hidden="true" /> : null}
                </button>
              ))}
            </fieldset>,
            document.body,
          )
        : null}
    </>
  );
}
