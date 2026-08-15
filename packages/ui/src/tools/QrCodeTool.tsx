import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { Check, Copy, Download, FileInput, QrCode as QrIcon, Upload } from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useEffect, useId, useRef, useState } from "react";

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

export function QrCodeTool() {
  const headingId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(SAMPLE);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [runId, setRunId] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState(25);
  const { isCopied, copy } = useCopyFeedback();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!value.trim()) {
      setError("Enter text or a URL to generate a QR code.");
      return;
    }
    if (value.length > 2953) {
      setError("QR input exceeds maximum supported size (2,953 characters).");
      return;
    }
    try {
      setModules(QRCode.create(value, { errorCorrectionLevel: level }).modules.size);
    } catch {
      setError("This value cannot fit in a standard QR code.");
      return;
    }
    void QRCode.toCanvas(canvas, value, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: level,
      color: { dark: "#0B0C10", light: "#FFFFFF" },
    })
      .then(() => setError(null))
      .catch(() => setError("This value cannot fit in a standard QR code."));
  }, [value, level, runId]);

  const onGenerate = useCallback(() => {
    setRunId((id) => id + 1);
  }, []);

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

  const status = !value.trim() ? "Waiting" : error ? "Error" : "Generated";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-[Inter,system-ui,sans-serif]">
      {/* Tool Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] bg-primary-soft rounded-[11px] text-primary flex items-center justify-center shrink-0">
            <QrIcon className="size-5" />
          </div>
          <div>
            <h2
              id={headingId}
              className="text-[20px] font-bold font-[Manrope,system-ui,sans-serif] text-on-surface tracking-[-0.02em] m-0"
            >
              QR Code
            </h2>
            <p className="text-[13px] text-on-muted m-0 mt-0.5">
              Encode text into a scannable QR code locally.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setValue(SAMPLE);
              setRunId((id) => id + 1);
            }}
            className="h-[32px] px-[12px] bg-surface-low border border-outline rounded-[8px] text-[12px] font-medium text-on-surface hover:bg-surface-high transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileInput className="size-3.5 text-on-muted" />
            Sample
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="bg-danger-soft border border-danger/50 rounded-[10px] px-3.5 py-2 text-[12px] text-error"
        >
          {error}
        </div>
      )}

      {/* Generate Form */}
      <form
        className="bg-bg-elevated border border-outline rounded-[12px] p-4 flex flex-col gap-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          onGenerate();
        }}
      >
        <div className="flex items-center justify-between">
          <label
            htmlFor="qr-lookup"
            className="text-[10px] font-semibold text-on-faint uppercase tracking-wider"
          >
            Payload
          </label>
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={onFileUpload}
              accept="*/*"
            />
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
              {isCopied("input") ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>
        <textarea
          id="qr-lookup"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter text or URL to encode as QR code…"
          rows={3}
          className="rounded-[8px] border border-outline bg-surface px-3 py-2.5 font-mono text-[13px] leading-[20px] text-on-surface outline-none transition focus:border-primary resize-none"
          spellCheck={false}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold text-on-faint uppercase tracking-wider">
            Error Correction
          </span>
          <div className="flex items-center gap-1 bg-surface border border-outline rounded-[8px] p-[3px] w-fit">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setLevel(lvl.id)}
                aria-pressed={level === lvl.id}
                className={`px-[10px] py-[5px] rounded-[6px] text-[11px] font-semibold transition-colors cursor-pointer ${
                  level === lvl.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-high text-on-muted hover:text-on-surface"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-on-faint">{LEVEL_RECOVERY[level]}</span>
          <button
            type="submit"
            className="h-[44px] px-5 rounded-[8px] bg-primary text-primary-foreground font-medium text-[14px] hover:bg-primary-strong transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
          >
            <QrIcon className="size-4" />
            Generate QR
          </button>
        </div>
      </form>

      {/* Result */}
      <section
        aria-label="QR Code"
        className="flex flex-col bg-surface border border-outline rounded-[12px] overflow-hidden flex-1 min-h-[280px]"
      >
        <div className="h-[45.5px] bg-surface-low border-b border-outline px-4 flex items-center justify-between shrink-0">
          <div className="flex flex-col justify-center">
            <span className="text-[13px] font-medium text-on-surface leading-tight">QR Code</span>
            <span className="text-[11px] text-on-muted leading-tight">
              {status === "Generated"
                ? `${value.length} chars · level ${level} · ${modules}×${modules}`
                : "generate to preview"}
            </span>
          </div>
          <button
            type="button"
            onClick={onDownload}
            disabled={status !== "Generated"}
            title="Download QR code as PNG image"
            className="h-[32px] px-3 rounded-[8px] bg-primary text-primary-foreground text-[12px] font-medium hover:bg-primary-strong disabled:opacity-30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="size-3.5" />
            Download
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 bg-surface-low">
          <div className="p-3 bg-white rounded-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            <canvas ref={canvasRef} className="block" />
          </div>
          <div className="w-full max-w-[320px] bg-bg-elevated border border-outline rounded-[8px] px-3.5 py-2.5 flex items-center justify-between gap-3">
            <span className="text-[10px] font-semibold text-on-faint uppercase tracking-wider shrink-0">
              Payload
            </span>
            <span className="font-mono text-[12px] text-on-surface truncate text-right">
              {value || "—"}
            </span>
          </div>
        </div>
      </section>

      {/* Status Bar */}
      <div className="h-[36px] bg-surface-low border border-outline rounded-[8px] px-3.5 flex items-center justify-between text-[12px] shrink-0 font-[Inter,system-ui,sans-serif]">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              status === "Generated"
                ? "bg-success-soft text-success"
                : status === "Error"
                  ? "bg-danger-soft text-error"
                  : "bg-surface-high text-on-muted"
            }`}
          >
            {status}
          </span>
          <span className="text-on-faint">
            {status === "Generated" ? `${modules}×${modules}` : "—"}
          </span>
          <span className="text-on-faint hidden sm:inline">
            {status === "Generated" ? "PNG" : "—"}
          </span>
          <span className="text-on-faint hidden md:inline">
            {status === "Generated" ? `ECC ${level}` : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary-strong font-['JetBrains_Mono',monospace] text-[11px] font-semibold">
            &lt;&gt; QR
          </span>
        </div>
      </div>
    </div>
  );
}
