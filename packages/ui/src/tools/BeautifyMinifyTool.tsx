import { TextTransformEditor } from "../components/TextTransformEditor";
import {
  BEAUTIFY_MINIFY_MAX_INPUT_CHARS,
  detectCodeLanguage,
  formatCode,
  type BeautifyMinifyLanguage,
  type BeautifyMinifyMode,
} from "@kitland/core";
import { Check, Code, FoldVertical, UnfoldVertical } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import {
  useDeferredTextTransform,
  type DeferredTextTransformState,
  type TextTransformResult,
} from "../hooks/useDeferredTextTransform";
import { IndentMenu } from "./json-formatter/IndentMenu";

export type BeautifyMinifyShareState = {
  mode: BeautifyMinifyMode;
  indent: 2 | 4;
  language: BeautifyMinifyLanguage;
  input: string;
};

export type BeautifyMinifyTransformHook = (
  source: string,
  mode: BeautifyMinifyMode,
  indent: 2 | 4,
  language: BeautifyMinifyLanguage,
) => DeferredTextTransformState;

const EMPTY_RESULT: TextTransformResult = { ok: true, value: "" };

const LANGUAGE_SAMPLES: Record<BeautifyMinifyLanguage, string> = {
  auto: '{\n  "name": "Kitland",\n  "features": ["local", "fast"],\n  "enabled": true\n}',
  json: '{\n  "name": "Kitland",\n  "version": "1.0.0",\n  "tags": ["developer", "tools", "offline"],\n  "settings": { "theme": "dark", "autoFormat": true }\n}',
  html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n<title>Kitland</title>\n</head>\n<body>\n<main class="hero">\n<h1>Fast & Private Tools</h1>\n<p>No telemetry, 100% in-browser processing.</p>\n<button type="button" class="btn">Get Started</button>\n</main>\n</body>\n</html>',
  css: ":root {\n  --primary: #2563eb;\n  --bg-surface: #15171c;\n}\n\n.card-container {\n  display: flex;\n  flex-direction: column;\n  padding: 1.5rem;\n  border-radius: 12px;\n  background: var(--bg-surface);\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);\n}",
  javascript:
    'function calculateInvoice(items, taxRate = 0.08) {\n  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);\n  const tax = subtotal * taxRate;\n  return {\n    subtotal,\n    tax,\n    total: subtotal + tax\n  };\n}\n\nconst invoice = calculateInvoice([{ name: "Tool Subscription", price: 29, quantity: 2 }]);\nconsole.log(invoice);',
  sql: 'SELECT u.id, u.username, u.email, COUNT(o.id) AS total_orders, SUM(o.amount) AS total_revenue FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = "active" AND u.created_at >= "2026-01-01" GROUP BY u.id, u.username, u.email HAVING total_orders > 0 ORDER BY total_revenue DESC LIMIT 25;',
  xml: '<?xml version="1.0" encoding="UTF-8"?>\n<workbench status="ready">\n  <category id="code">\n    <tool slug="beautify-minify">\n      <name>Universal Beautifier</name>\n      <modes>beautify,minify</modes>\n    </tool>\n  </category>\n</workbench>',
};

const LANGUAGE_LABELS: Array<{ id: BeautifyMinifyLanguage; label: string }> = [
  { id: "auto", label: "Auto-Detect" },
  { id: "json", label: "JSON" },
  { id: "html", label: "HTML / XML" },
  { id: "css", label: "CSS" },
  { id: "javascript", label: "JavaScript" },
  { id: "sql", label: "SQL" },
];

function LanguageMenu({
  value,
  onChange,
}: {
  value: BeautifyMinifyLanguage;
  onChange: (next: BeautifyMinifyLanguage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
    setPosition(rect ? { top: rect.bottom + 6, left: Math.max(8, rect.left - 48) } : null);
    setOpen(true);
  };

  const shortLabel = useMemo(() => {
    switch (value) {
      case "auto":
        return "Auto";
      case "javascript":
        return "JS";
      case "html":
        return "HTML";
      case "css":
        return "CSS";
      case "sql":
        return "SQL";
      case "json":
        return "JSON";
      default:
        return "Lang";
    }
  }, [value]);

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Language: ${value}. Click to change.`}
          title={`Language: ${value}. Click to change.`}
          onClick={toggle}
          className="flex size-[40px] items-center justify-center rounded-[10px] border border-outline bg-surface-low text-on-muted transition-colors cursor-pointer hover:bg-surface hover:text-on-surface hover:border-outline-strong active:bg-primary-soft active:text-primary shadow-xs"
        >
          <Code className="size-[18px]" />
        </button>
        <span className="text-[11px] font-medium text-on-muted text-center max-lg:hidden">
          {shortLabel}
        </span>
      </div>

      {open && position
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              aria-label="Select language"
              className="fixed z-50 min-w-[150px] rounded-lg border border-outline bg-surface p-1 shadow-xl flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
              style={{ top: position.top, left: position.left }}
            >
              {LANGUAGE_LABELS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  aria-checked={value === item.id}
                  onClick={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer text-left ${
                    value === item.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-on-surface hover:bg-surface-high"
                  }`}
                >
                  <span>{item.label}</span>
                  {value === item.id && <Check className="size-3.5" />}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function useSyncBeautifyMinify(
  source: string,
  mode: BeautifyMinifyMode,
  indent: 2 | 4,
  language: BeautifyMinifyLanguage,
): DeferredTextTransformState {
  const transform = useCallback(
    (input: string): TextTransformResult => {
      if (input.trim().length === 0) return EMPTY_RESULT;
      const res = formatCode(input, language, mode, { indent });
      if (!res.ok) return res as unknown as TextTransformResult;
      return { ok: true, value: res.value.output };
    },
    [language, mode, indent],
  );
  return useDeferredTextTransform(source, `${language}:${mode}:${indent}`, transform);
}

export type BeautifyMinifyToolProps = {
  readonly useTransform?: BeautifyMinifyTransformHook;
  readonly share?: {
    readonly readState?: () => BeautifyMinifyShareState | null;
    readonly createUrl: (state: BeautifyMinifyShareState) => Promise<string | void> | string | void;
  };
  readonly capabilities?: ToolCapabilities;
  readonly initialInput?: string;
};

/** Universal Code Beautifier & Minifier matching json-diff workflow pattern. */
export function BeautifyMinifyTool({
  useTransform = useSyncBeautifyMinify,
  share,
  capabilities = LOCAL_ONLY_CAPABILITIES,
  initialInput,
}: BeautifyMinifyToolProps = {}) {
  const [source, setSource] = useState(initialInput ?? "");
  const [mode, setMode] = useState<BeautifyMinifyMode>("beautify");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [language, setLanguage] = useState<BeautifyMinifyLanguage>("auto");

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

  useEffect(() => {
    if (!share?.readState) return;
    const shared = share.readState();
    if (shared) {
      setMode(shared.mode);
      setIndent(shared.indent);
      setLanguage(shared.language || "auto");
      setSource(shared.input);
    }
  }, [share]);

  const state = useTransform(source, mode, indent, language);

  const effectiveLang = useMemo(() => {
    if (language !== "auto") return language;
    return detectCodeLanguage(source);
  }, [language, source]);

  const editorLanguage = useMemo(() => {
    switch (effectiveLang) {
      case "json":
        return "json";
      case "html":
      case "xml":
        return "html";
      case "css":
        return "css";
      case "sql":
        return "sql";
      case "javascript":
      default:
        return "javascript";
    }
  }, [effectiveLang]);

  const langDisplayName = useMemo(() => {
    switch (effectiveLang) {
      case "json":
        return "JSON";
      case "html":
        return "HTML";
      case "xml":
        return "XML";
      case "css":
        return "CSS";
      case "sql":
        return "SQL";
      case "javascript":
        return "JS";
      default:
        return "CODE";
    }
  }, [effectiveLang]);

  return (
    <TextTransformEditor
      icon={UnfoldVertical}
      title="Beautify / Minify"
      description="Pretty-print or compress code and structured text across multiple languages"
      inputLabel={`${langDisplayName} input`}
      outputLabel={
        mode === "beautify" ? `Formatted ${langDisplayName}` : `Minified ${langDisplayName}`
      }
      placeholder={`Paste ${langDisplayName} code to format or minify…`}
      source={source}
      onSourceChange={setSource}
      onSample={() => setSource(LANGUAGE_SAMPLES[language])}
      maxInputChars={BEAUTIFY_MINIFY_MAX_INPUT_CHARS}
      state={state}
      langTag={language === "auto" ? `AUTO (${langDisplayName})` : langDisplayName}
      inputLanguage={editorLanguage}
      outputLanguage={editorLanguage}
      indentSize={indent}
      actionLabel={mode === "beautify" ? "Beautify" : "Minify"}
      actionIcon={mode === "beautify" ? UnfoldVertical : FoldVertical}
      outputExtension={effectiveLang === "javascript" ? "js" : effectiveLang}
      outputMimeType="text/plain"
      indentLabel={mode === "beautify" ? `${indent} spaces indent` : "minified"}
      validLabel={langDisplayName}
      showUpload={capabilities.fileOpen ?? false}
      showDownload={capabilities.fileSave ?? false}
      showShare={Boolean(share)}
      {...(share
        ? {
            onShare: () => {
              return share.createUrl({ mode, indent, language, input: source });
            },
          }
        : {})}
      onSwap={() => {
        const nextInput = state.result.ok ? state.result.value : "";
        setSource(nextInput);
      }}
      swapLabel="Swap"
      extraRailActions={<LanguageMenu value={language} onChange={setLanguage} />}
      options={
        <div className="flex items-center justify-between flex-wrap gap-2.5 min-h-[36px] px-1 w-full">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Mode Seg (Beautify / Minify) */}
            <div
              role="group"
              aria-label="Format mode"
              className="flex h-[32px] items-center gap-[2px] rounded-[8px] border border-outline bg-surface-low p-[2px]"
            >
              <button
                type="button"
                aria-pressed={mode === "beautify"}
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer capitalize ${
                  mode === "beautify"
                    ? "bg-surface text-on-surface shadow-xs border border-outline/60"
                    : "text-on-muted hover:text-on-surface hover:bg-surface/50 border border-transparent"
                }`}
                onClick={() => setMode("beautify")}
              >
                Beautify
              </button>
              <button
                type="button"
                aria-pressed={mode === "minify"}
                className={`h-[26px] px-[10px] rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer capitalize ${
                  mode === "minify"
                    ? "bg-surface text-on-surface shadow-xs border border-outline/60"
                    : "text-on-muted hover:text-on-surface hover:bg-surface/50 border border-transparent"
                }`}
                onClick={() => setMode("minify")}
              >
                Minify
              </button>
            </div>

            {/* Indent Menu matching design.pen */}
            {mode === "beautify" && (
              <IndentMenu value={indent} onChange={setIndent} triggerLabel="Indent" />
            )}
          </div>
        </div>
      }
    />
  );
}
