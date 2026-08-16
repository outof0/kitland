import { TextTransformEditor } from "../components/TextTransformEditor";
import {
  useDeferredTextTransform,
  type TextTransformResult,
} from "../hooks/useDeferredTextTransform";
import {
  joinLines,
  splitToNewlines,
  SPLIT_TO_NEWLINES_MAX_INPUT_CHARS,
  type SplitDelimiter,
} from "@kitland/core";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { ArrowRight, Check, Merge, Split } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

const SAMPLE_SPLIT = "apple, banana, orange, grape";
const SAMPLE_JOIN = "apple\nbanana\norange\ngrape";

export type SplitJoinMode = "split-to-newlines" | "join-lines";

const MODES: { value: SplitJoinMode; label: string }[] = [
  { value: "split-to-newlines", label: "Split → Newlines" },
  { value: "join-lines", label: "Join Lines" },
];

const DELIMITER_ITEMS: Array<{
  id: SplitDelimiter;
  label: string;
  glyph: string;
}> = [
  { id: "comma", label: "Comma (,)", glyph: "," },
  { id: "semicolon", label: "Semicolon (;)", glyph: ";" },
  { id: "whitespace", label: "Space / WS", glyph: "␣" },
  { id: "pipe", label: "Pipe (|)", glyph: "|" },
  { id: "custom", label: "Custom", glyph: "✎" },
];

function DelimiterMenu({
  value,
  onChange,
  customValue,
  onCustomChange,
}: {
  value: SplitDelimiter;
  onChange: (next: SplitDelimiter) => void;
  customValue: string;
  onCustomChange: (custom: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

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
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", closeWithFocus, true);
    window.addEventListener("blur", closeWithFocus);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", closeWithFocus, true);
      window.removeEventListener("blur", closeWithFocus);
    };
  }, [open]);

  useEffect(() => {
    if (!open || value === "custom") return;
    const selectedIndex = DELIMITER_ITEMS.findIndex((item) => item.id === value);
    itemRefs.current[selectedIndex]?.focus();
  }, [open, value]);

  const openMenu = () => {
    setOpen(true);
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    openMenu();
  };

  const moveFocus = (nextIndex: number) => {
    itemRefs.current[(nextIndex + DELIMITER_ITEMS.length) % DELIMITER_ITEMS.length]?.focus();
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const activeIndex = itemRefs.current.findIndex((item) => item === document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus((activeIndex < 0 ? 0 : activeIndex) + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus((activeIndex < 0 ? 0 : activeIndex) - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      itemRefs.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      itemRefs.current[DELIMITER_ITEMS.length - 1]?.focus();
    }
  };

  const currentItem =
    DELIMITER_ITEMS.find((d) => d.id === value) ??
    ({ id: "comma", label: "Comma (,)", glyph: "," } as const);
  const shortLabel =
    value === "comma"
      ? "Comma"
      : value === "semicolon"
        ? "Semicolon"
        : value === "whitespace"
          ? "Space"
          : value === "pipe"
            ? "Pipe"
            : "Custom";

  return (
    <div className="relative flex flex-col items-center gap-1">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Delimiter: ${currentItem.label}. Click to change.`}
        title={`Delimiter: ${currentItem.label}. Click to change.`}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu();
          }
        }}
        className="flex size-[40px] items-center justify-center rounded-[10px] border border-outline bg-surface-low text-on-muted transition-colors cursor-pointer hover:bg-surface hover:text-on-surface hover:border-outline-strong active:bg-primary-soft active:text-primary shadow-xs"
      >
        <span className="font-mono text-[16px] font-bold leading-none">{currentItem.glyph}</span>
      </button>
      <span className="text-[11px] font-medium text-on-muted text-center max-lg:hidden">
        {shortLabel}
      </span>
      {open && (
        <div
          ref={panelRef}
          id={menuId}
          role="menu"
          aria-label="Select delimiter"
          onKeyDown={handleMenuKeyDown}
          className="absolute z-50 top-full left-1/2 mt-1.5 flex min-w-[170px] -translate-x-1/2 flex-col gap-0.5 rounded-lg border border-outline bg-surface p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100"
        >
          {DELIMITER_ITEMS.map((item) => (
            <button
              key={item.id}
              ref={(element) => {
                itemRefs.current[DELIMITER_ITEMS.indexOf(item)] = element;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={value === item.id}
              onClick={() => {
                onChange(item.id);
                if (item.id !== "custom") {
                  setOpen(false);
                }
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer text-left ${
                value === item.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-on-surface hover:bg-surface-high"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="font-mono font-bold w-4 text-center">{item.glyph}</span>
                <span>{item.label}</span>
              </span>
              {value === item.id && <Check className="size-3.5" />}
            </button>
          ))}
          {value === "custom" && (
            <div className="p-1.5 border-t border-outline/50 mt-0.5">
              <input
                type="text"
                value={customValue}
                onChange={(e) => onCustomChange(e.target.value)}
                placeholder="Custom delimiter…"
                maxLength={32}
                aria-label="Custom delimiter in menu"
                autoFocus
                className="h-[28px] w-full px-2 rounded-[6px] text-[12px] font-mono bg-surface-low border border-outline text-on-surface placeholder:text-on-muted/60 outline-none focus:border-primary"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type SplitToNewlinesToolProps = {
  readonly initialMode?: SplitJoinMode | undefined;
  readonly onModeNavigate?: ((slug: SplitJoinMode) => void) | undefined;
  readonly initialInput?: string | undefined;
  readonly capabilities?: ToolCapabilities | undefined;
};

export function SplitToNewlinesTool({
  initialMode = "split-to-newlines",
  onModeNavigate,
  initialInput,
  capabilities = LOCAL_ONLY_CAPABILITIES,
}: SplitToNewlinesToolProps = {}) {
  const [mode, setMode] = useState<SplitJoinMode>(initialMode);
  const [delimiter, setDelimiter] = useState<SplitDelimiter>("comma");
  const [customDelimiter, setCustomDelimiter] = useState(",");
  const [trimItems, setTrimItems] = useState(true);
  const [dropEmpty, setDropEmpty] = useState(true);
  const [source, setSource] = useState(initialInput ?? "");

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setSource(initialInput);
    }
  }, [initialInput]);

  const transform = useCallback(
    (value: string): TextTransformResult => {
      const opts = {
        delimiter,
        customDelimiter,
        trimItems,
        dropEmpty,
      };
      if (mode === "split-to-newlines") {
        return splitToNewlines(value, opts);
      }
      return joinLines(value, opts);
    },
    [customDelimiter, delimiter, dropEmpty, mode, trimItems],
  );

  const operationKey = `${mode}-${delimiter}-${customDelimiter}-${trimItems}-${dropEmpty}`;
  const state = useDeferredTextTransform(source, operationKey, transform);

  const onSwap = useCallback(() => {
    if (state.isProcessing) return;
    const output = state.result.ok ? state.result.value : "";
    if (output) {
      setSource(output);
    }
    const nextMode = mode === "split-to-newlines" ? "join-lines" : "split-to-newlines";
    setMode(nextMode);
    onModeNavigate?.(nextMode);
  }, [mode, onModeNavigate, state.isProcessing, state.result]);

  const switchMode = useCallback(
    (nextMode: SplitJoinMode) => {
      if (nextMode === mode) return;
      const output = state.result.ok ? state.result.value : "";
      if (output) {
        setSource(output);
      }
      setMode(nextMode);
      onModeNavigate?.(nextMode);
    },
    [mode, onModeNavigate, state.result],
  );

  const onSample = useCallback(() => {
    setSource(mode === "split-to-newlines" ? SAMPLE_SPLIT : SAMPLE_JOIN);
  }, [mode]);

  const isSplit = mode === "split-to-newlines";

  return (
    <TextTransformEditor
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      icon={isSplit ? Split : Merge}
      title={isSplit ? "Split → Newlines" : "Join Lines"}
      description={
        isSplit
          ? "Split delimited text into one value per line locally."
          : "Join newline-separated lines into delimited text locally."
      }
      inputLabel={isSplit ? "Delimited text" : "Lines"}
      outputLabel={isSplit ? "Lines" : "Delimited text"}
      placeholder={
        isSplit ? "Paste delimited text (e.g. apple, banana, orange)…" : "Paste lines to join…"
      }
      source={source}
      onSourceChange={setSource}
      onSample={onSample}
      maxInputChars={SPLIT_TO_NEWLINES_MAX_INPUT_CHARS}
      state={state}
      langTag={isSplit ? "SPLIT" : "JOIN"}
      validLabel={isSplit ? "Split" : "Join"}
      actionLabel={isSplit ? "Split" : "Join"}
      actionIcon={ArrowRight}
      outputExtension="txt"
      outputMimeType="text/plain"
      onSwap={onSwap}
      swapLabel={isSplit ? "Swap to Join Lines" : "Swap to Split → Newlines"}
      copyOutputLabel={isSplit ? "Copy Lines" : "Copy Delimited Text"}
      extraRailActions={
        <DelimiterMenu
          value={delimiter}
          onChange={setDelimiter}
          customValue={customDelimiter}
          onCustomChange={setCustomDelimiter}
        />
      }
      options={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode switcher */}
          <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            {MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={mode === option.value}
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  mode === option.value
                    ? "text-primary-strong"
                    : "text-on-muted hover:text-on-surface"
                }`}
                onClick={() => switchMode(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Trim & Drop Empty toggles */}
          <div className="min-h-[32px] w-fit max-w-full flex items-center flex-wrap gap-[2px] p-[2px] bg-surface-low border border-outline rounded-[8px]">
            <button
              type="button"
              aria-pressed={trimItems}
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                trimItems ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => setTrimItems((v) => !v)}
            >
              Trim items
            </button>
            <button
              type="button"
              aria-pressed={dropEmpty}
              className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                dropEmpty ? "text-primary-strong" : "text-on-muted hover:text-on-surface"
              }`}
              onClick={() => setDropEmpty((v) => !v)}
            >
              Drop empty
            </button>
          </div>
        </div>
      }
    />
  );
}
