import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { Download, FileInput, QrCode as QrIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
const sample = "https://kitland.dev/explore";
export function QrCodeTool() {
  const [value, setValue] = useState(sample),
    canvas = useRef<HTMLCanvasElement>(null),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!value.trim()) {
      setError("Enter text or a URL.");
      return;
    }
    if (value.length > 2953) {
      setError("QR input exceeds 2,953 characters.");
      return;
    }
    const node = canvas.current;
    if (!node) return;
    void QRCode.toCanvas(node, value, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0b0f19", light: "#ffffff" },
    })
      .then(() => setError(null))
      .catch(() => setError("This value cannot fit in a QR code."));
  }, [value]);
  function download() {
    const n = canvas.current;
    if (!n) return;
    const a = document.createElement("a");
    a.href = n.toDataURL("image/png");
    a.download = "kitland-qr.png";
    a.click();
  }
  return (
    <>
      <div className="tool-header">
        <div className="tool-header__icon">
          <QrIcon />
        </div>
        <div className="tool-header__texts">
          <h2 className="tool-header__title">QR Code</h2>
          <p className="tool-header__subtitle">Generate a QR code locally from text or a URL.</p>
        </div>
        <div className="tool-header__actions">
          <Button variant="ghost" size="sm" onClick={() => setValue(sample)}>
            <FileInput />
            Sample
          </Button>
        </div>
      </div>
      <output className={error ? "tool-feedback tool-feedback--error" : "tool-feedback"}>
        {error ?? "QR generation stays in your browser."}
      </output>
      <section className="grid flex-1 gap-4 lg:grid-cols-2">
        <label className="grid gap-2 rounded-[14px] border border-[var(--outline)] bg-[var(--bg-elevated)] p-[18px] text-sm">
          Text or URL
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-64 rounded-lg border border-input bg-transparent p-3 font-mono text-sm"
          />
        </label>
        <section className="grid content-start justify-items-center gap-3 rounded-[14px] border border-[var(--outline)] bg-[var(--surface)] p-[18px]">
          <canvas ref={canvas} className="max-w-full rounded-xl bg-white p-3" />
          <Button disabled={!!error} onClick={download}>
            <Download />
            Download PNG
          </Button>
        </section>
      </section>
    </>
  );
}
