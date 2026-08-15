import { convertColor } from "@kitland/core";
import { Palette, Pipette } from "lucide-react";
import { useMemo, useState } from "react";
import { useCopyFeedback } from "../hooks/useCopyFeedback";
import {
  FieldLabel,
  FormPanel,
  NoteText,
  ResultHead,
  ResultPanel,
  ResultRow,
  RunButton,
  SampleAction,
  StatusBar,
  ToolHeader,
} from "../components/tool-form";

const SAMPLE = "#3B82F6";

const NAMED_COLORS: Record<string, string> = {
  "#f0f8ff": "Alice Blue",
  "#faebd7": "Antique White",
  "#000000": "Black",
  "#0000ff": "Blue",
  "#8a2be2": "Blue Violet",
  "#a52a2a": "Brown",
  "#dc143c": "Crimson",
  "#00ffff": "Cyan",
  "#00008b": "Dark Blue",
  "#a9a9a9": "Dark Gray",
  "#006400": "Dark Green",
  "#bdb76b": "Dark Khaki",
  "#8b008b": "Dark Magenta",
  "#556b2f": "Dark Olive Green",
  "#ff8c00": "Dark Orange",
  "#9932cc": "Dark Orchid",
  "#8b0000": "Dark Red",
  "#e9967a": "Dark Salmon",
  "#2f4f4f": "Dark Slate Gray",
  "#00ced1": "Dark Turquoise",
  "#9400d3": "Dark Violet",
  "#ff1493": "Deep Pink",
  "#00bfff": "Deep Sky Blue",
  "#1e90ff": "Dodger Blue",
  "#b22222": "Firebrick",
  "#ff69b4": "Hot Pink",
  "#4b0082": "Indigo",
  "#32cd32": "Lime Green",
  "#ff00ff": "Magenta",
  "#800000": "Maroon",
  "#000080": "Navy",
  "#808000": "Olive",
  "#ffa500": "Orange",
  "#ff4500": "Orange Red",
  "#da70d6": "Orchid",
  "#008000": "Green",
  "#ff0000": "Red",
  "#c0c0c0": "Silver",
  "#008080": "Teal",
  "#ffffff": "White",
  "#ffff00": "Yellow",
};

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function nearestName(hex: string): string {
  const exact = NAMED_COLORS[hex];
  if (exact) return exact;
  const [r, g, b] = hexToRgb(hex);
  let best: { name: string; dist: number } | null = null;
  for (const [named, name] of Object.entries(NAMED_COLORS)) {
    const [nr, ng, nb] = hexToRgb(named);
    const dist = (r - nr) ** 2 + (g - ng) ** 2 + (b - nb) ** 2;
    if (!best || dist < best.dist) best = { name, dist };
  }
  return best ? `${best.name} (approx)` : "custom";
}

function rgbToCmyk(r: number, g: number, b: number): string {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k === 1) return "c0 m0 y0 k100";
  const c = Math.round(((1 - rr - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gg - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bb - k) / (1 - k)) * 100);
  return `c${c} m${m} y${y} k${Math.round(k * 100)}`;
}

export function ColorConverterTool() {
  const [input, setInput] = useState(SAMPLE);
  const [alpha, setAlpha] = useState("100");
  const { isCopied, copy } = useCopyFeedback();

  const result = useMemo(() => convertColor(input), [input]);

  const alphaNum = Math.min(100, Math.max(0, Number(alpha) || 0));

  const rows = useMemo(() => {
    if (!result.ok) return null;
    const aHex = Math.round((alphaNum / 100) * 255)
      .toString(16)
      .padStart(2, "0");
    const hex = `${result.value.hex}${alphaNum < 100 ? aHex : ""}`;
    return [
      { label: "HEX", value: hex.toUpperCase() },
      { label: "RGB", value: result.value.rgb },
      { label: "HSL", value: result.value.hsl },
      { label: "CMYK", value: rgbToCmyk(result.value.r, result.value.g, result.value.b) },
      { label: "NAME", value: nearestName(result.value.hex) },
    ];
  }, [result, alphaNum]);

  const swatch = result.ok
    ? `${result.value.hex}${
        alphaNum < 100
          ? Math.round((alphaNum / 100) * 255)
              .toString(16)
              .padStart(2, "0")
          : ""
      }`
    : "#000000";

  const summary = result.ok ? (rows?.map((row) => row.value).join(" · ") ?? "") : "";
  const errorMessage = result.ok ? null : result.error.message;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      <ToolHeader
        icon={Palette}
        title="Color Converter"
        subtitle="Convert color formats"
        actions={<SampleAction onClick={() => setInput(SAMPLE)} />}
      />

      {!result.ok && (
        <div
          className="bg-danger-soft border border-danger/40 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
          role="alert"
        >
          {result.error.message}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <FormPanel width={320}>
          <FieldLabel>Color</FieldLabel>
          <div className="flex h-[40px] items-center gap-2 rounded-[9px] bg-surface px-3">
            <span className="shrink-0 text-[13px] text-on-muted">Hex</span>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-label="Hex color"
              placeholder="#3B82F6"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-right font-mono text-[15px] font-semibold text-on-surface outline-none placeholder:text-on-faint"
            />
            <label className="relative size-6 shrink-0 cursor-pointer overflow-hidden rounded-[6px] border border-outline">
              <input
                type="color"
                aria-label="Color picker"
                value={result.ok ? result.value.hex : "#000000"}
                onChange={(event) => setInput(event.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: result.ok ? result.value.hex : "transparent" }}
              />
              <Pipette className="absolute inset-0 m-auto size-3 text-white drop-shadow pointer-events-none mix-blend-difference" />
            </label>
          </div>
          <div className="flex h-[40px] items-center gap-2 rounded-[9px] bg-surface px-3">
            <span className="shrink-0 text-[13px] text-on-muted">Alpha</span>
            <input
              type="text"
              value={alpha}
              onChange={(event) => setAlpha(event.target.value)}
              aria-label="Alpha percent"
              placeholder="100"
              inputMode="numeric"
              className="min-w-0 flex-1 bg-transparent text-right font-mono text-[15px] font-semibold text-on-surface outline-none placeholder:text-on-faint"
            />
            <span className="shrink-0 text-[13px] text-on-muted">%</span>
          </div>
          <RunButton onClick={() => setInput(input.trim() || SAMPLE)}>Convert</RunButton>
          <NoteText>Accepts #hex, rgb(), hsl() and named colors.</NoteText>
        </FormPanel>

        <ResultPanel>
          {result.ok && rows ? (
            <>
              <ResultHead
                title={swatch.toUpperCase()}
                subtitle="translated to every color space"
                onCopy={() => void copy("all", summary)}
                copied={isCopied("all")}
                filled
              />
              <div
                className="h-[44px] w-full rounded-[8px] border border-white/10"
                style={{ backgroundColor: swatch }}
                aria-label="Color swatch"
              />
              <div className="flex flex-col gap-2">
                {rows.map((row) => (
                  <ResultRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-danger">
              {errorMessage}
            </div>
          )}
        </ResultPanel>
      </div>

      <StatusBar
        label="Color converter status"
        chip={{ icon: Palette, text: result.ok ? "HEX" : "Invalid color" }}
        stats={
          result.ok
            ? [`${result.value.hex}`, nearestName(result.value.hex), "CSS"]
            : ["Awaiting valid color"]
        }
        lang="COLOR"
      />
    </div>
  );
}
