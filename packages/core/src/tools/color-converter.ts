import { err, ok, type ToolResult } from "../result";

export const COLOR_CONVERTER_MAX_INPUT_CHARS = 64;
export type ColorResult = {
  hex: string;
  rgb: string;
  hsl: string;
  r: number;
  g: number;
  b: number;
};

export function convertColor(input: string): ToolResult<ColorResult> {
  if (input.length > COLOR_CONVERTER_MAX_INPUT_CHARS)
    return err("INPUT_TOO_LARGE", "Color text exceeds the limit.");
  const raw = input.trim();
  if (!raw) return err("EMPTY_INPUT", "Enter a hex or rgb() color.");
  let r: number, g: number, b: number;
  const hex = raw.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hex?.[1]) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    const rgb = raw.match(
      /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i,
    );
    if (!rgb) return err("INVALID_COLOR", "Use #RGB, #RRGGBB, or rgb(r,g,b).");
    r = Number(rgb[1]);
    g = Number(rgb[2]);
    b = Number(rgb[3]);
    if ([r, g, b].some((v) => v > 255)) return err("INVALID_COLOR", "RGB channels must be 0–255.");
  }
  const hexOut = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  const { h, s, l } = rgbToHsl(r, g, b);
  return ok({
    hex: hexOut.toLowerCase(),
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
    r,
    g,
    b,
  });
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
