import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { Check, Copy, Download, FileInput, QrCode as QrIcon, Upload } from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FieldLabel,
  FormPanel,
  ResultCard,
  ResultHead,
  ResultPanel,
  ToolHeader,
} from "../components/tool-form";

const SAMPLE = "kitland.test/explore";

const LEVELS = [
  { id: "L", label: "L 7%" },
  { id: "M", label: "M 15%" },
  { id: "Q", label: "Q 25%" },
  { id: "H", label: "H 30%" },
] as const;

const LEVEL_RECOVERY: Record<string, string> = {
  L: "Level L recovers up to 7% damage.",
  M: "Level M recovers up to 15% damage.",
  Q: "Level Q recovers up to 25% damage.",
  H: "Level H recovers up to 30% damage.",
};

const DEBOUNCE_MS = 150;

export function QrCodeTool() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(SAMPLE);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [debouncedValue, setDebouncedValue] = useState(SAMPLE);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState(25);
  const { isCopied, copy } = useCopyFeedback();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!debouncedValue.trim()) {
      setError("Enter text or a URL to generate a QR code.");
      return;
    }
    if (debouncedValue.length > 2953) {
      setError("QR input exceeds maximum supported size (2,953 characters).");
      return;
    }
    try {
      setModules(QRCode.create(debouncedValue, { errorCorrectionLevel: level }).modules.size);
    } catch {
      setError("This value cannot fit in a standard QR code.");
      return;
    }
    void QRCode.toCanvas(canvas, debouncedValue, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: level,
      color: { dark: "#0B0C10", light: "#FFFFFF" },
    })
      .then(() => setError(null))
      .catch(() => setError("This value cannot fit in a standard QR code."));
  }, [debouncedValue, level]);

  const onDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "kitland-qrcode.png";
    a.click();
  }, []);

  const onFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === "string") setValue(content);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const status = !debouncedValue.trim() ? "Waiting" : error ? "Error" : "Generated";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={QrIcon}
        title="QR Code"
        subtitle="Encode text into a scannable QR code locally"
        actions={
          <button
            type="button"
            onClick={() => setValue(SAMPLE)}
            className="flex h-[34px] cursor-pointer items-center gap-[7px] rounded-[8px] border border-outline bg-surface-low px-3 text-[13px] font-semibold text-on-surface transition-colors hover:bg-surface hover:border-outline-strong"
          >
            <FileInput className="size-[15px] text-on-muted" />
            <span>Sample</span>
          </button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={340}>
          <FieldLabel>PAYLOAD</FieldLabel>
          <div className="box-border flex w-full flex-col rounded-[10px] border border-outline bg-surface p-3 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-on-faint">Text or URL</span>
              <div className="flex items-center gap-1">
                <input ref={fileInputRef} type="file" className="hidden" onChange={onFileUpload} accept="*/*" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload file"
                  className="size-7 rounded-[5px] flex items-center justify-center text-on-faint hover:text-on-surface hover:bg-surface cursor-pointer transition-colors"
                >
                  <Upload className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void copy("input", value)}
                  disabled={!value}
                  title={isCopied("input") ? "Copied input" : "Copy input"}
                  aria-label={isCopied("input") ? "Copied input" : "Copy input"}
                  className={`size-7 rounded-[5px] flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer ${
                    isCopied("input")
                      ? "bg-success-soft text-success border border-success/40"
                      : "text-on-faint hover:text-on-surface hover:bg-surface"
                  }`}
                >
                  {isCopied("input") ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>
            <textarea
              aria-label="Payload"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter text or URL to encode as QR code…"
              rows={5}
              className="w-full resize-none bg-transparent font-mono text-[13px] leading-[20px] text-on-surface outline-none placeholder:text-on-faint"
              spellCheck={false}
            />
          </div>

          <FieldLabel>ERROR CORRECTION</FieldLabel>
          <div className="flex items-center gap-1 bg-surface border border-outline rounded-[8px] p-[3px] w-fit">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setLevel(lvl.id)}
                aria-pressed={level === lvl.id}
                className={`px-[10px] py-[5px] rounded-[6px] text-[11px] font-semibold transition-colors cursor-pointer ${
                  level === lvl.id ? "bg-primary text-primary-foreground" : "bg-surface-high text-on-muted hover:text-on-surface"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
          <p className="m-0 text-[11px] leading-relaxed text-on-faint">{LEVEL_RECOVERY[level]}</p>
        </FormPanel>

        <ResultPanel>
          <ResultHead
            title="QR Preview"
            subtitle={status === "Generated" ? `${value.length} chars · ${level} · ${modules}×${modules}` : status}
            onCopy={() => void copy("payload", value)}
            copied={isCopied("payload")}
            copyLabel="Copy"
          />
          <ResultCard>
            {error ? (
              <div className="font-mono text-[13px] text-error" role="alert">
                {error}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-2">
                <div className="p-3 bg-white rounded-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                  <canvas ref={canvasRef} className="block" width={240} height={240} />
                </div>
                <button
                  type="button"
                  onClick={onDownload}
                  disabled={status !== "Generated"}
                  className="flex h-[32px] items-center gap-1.5 rounded-[8px] bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary-strong disabled:opacity-30 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="size-3.5" />
                  Download PNG
                </button>
              </div>
            )}
            <div className="select-none font-mono text-[12px] text-on-faint text-center">
              {status === "Generated" ? `${modules}×${modules} • ECC ${level} • PNG 240×240` : "Updates automatically as you type"}
            </div>
          </ResultCard>
        </ResultPanel>
      </div>

      <div className="flex items-center justify-between h-[36px] bg-surface-low border border-outline rounded-[8px] px-3.5 text-[12px] shrink-0 font-ui">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${status === "Generated" ? "bg-success-soft text-success" : status === "Error" ? "bg-danger-soft text-error" : "bg-surface-high text-on-muted"}`}>
            {status}
          </span>
          <span className="text-on-faint">{status === "Generated" ? `${modules}×${modules}` : "—"}</span>
          <span className="text-on-faint hidden sm:inline">{status === "Generated" ? "PNG" : "—"}</span>
        </div>
        <span className="text-primary-strong font-mono text-[11px] font-semibold">&lt;&gt; QR</span>
      </div>
    </div>
  );
}
