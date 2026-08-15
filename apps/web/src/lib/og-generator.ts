import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const require = createRequire(import.meta.url);

const fontBoldPath = resolve(
  require.resolve("@fontsource/inter/files/inter-latin-700-normal.woff"),
);
const fontRegularPath = resolve(
  require.resolve("@fontsource/inter/files/inter-latin-400-normal.woff"),
);

const fontBoldBuffer = readFileSync(fontBoldPath);
const fontRegularBuffer = readFileSync(fontRegularPath);

export type OgImageOptions = {
  readonly title: string;
  readonly description: string;
  readonly family?: string;
  readonly badge?: string;
};

const FAMILY_THEMES: Readonly<
  Record<
    string,
    {
      readonly label: string;
      readonly accent: string;
      readonly bg: string;
      readonly border: string;
      readonly glow: string;
    }
  >
> = {
  "json-markup": {
    label: "JSON & MARKUP",
    accent: "#4ade80",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.35)",
    glow: "rgba(34, 197, 94, 0.15)",
  },
  "encoding-text": {
    label: "ENCODING & TEXT",
    accent: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.35)",
    glow: "rgba(56, 189, 248, 0.15)",
  },
  "hash-crypto": {
    label: "HASH & CRYPTO",
    accent: "#c084fc",
    bg: "rgba(192, 132, 252, 0.12)",
    border: "rgba(192, 132, 252, 0.35)",
    glow: "rgba(192, 132, 252, 0.15)",
  },
  generators: {
    label: "GENERATORS",
    accent: "#fbbf24",
    bg: "rgba(251, 191, 36, 0.12)",
    border: "rgba(251, 191, 36, 0.35)",
    glow: "rgba(251, 191, 36, 0.15)",
  },
  "time-network": {
    label: "TIME & NETWORK",
    accent: "#60a5fa",
    bg: "rgba(96, 165, 250, 0.12)",
    border: "rgba(96, 165, 250, 0.35)",
    glow: "rgba(96, 165, 250, 0.15)",
  },
};

const DEFAULT_THEME = {
  label: "DEVELOPER TOOLS",
  accent: "#4ade80",
  bg: "rgba(34, 197, 94, 0.12)",
  border: "rgba(34, 197, 94, 0.35)",
  glow: "rgba(34, 197, 94, 0.15)",
};

export async function generateOgImage(options: OgImageOptions): Promise<Uint8Array> {
  const theme = (options.family && FAMILY_THEMES[options.family]) || DEFAULT_THEME;
  const badgeText = options.badge || theme.label;

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#080c14",
          backgroundImage: `radial-gradient(circle at 12% 18%, ${theme.glow}, transparent 45%), radial-gradient(circle at 88% 82%, rgba(59, 130, 246, 0.10), transparent 45%)`,
          padding: "60px 80px",
          fontFamily: "Inter",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            backgroundColor: "#22c55e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#080c14",
                            fontWeight: 700,
                            fontSize: "20px",
                          },
                          children: "K",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            color: "#ffffff",
                            fontSize: "26px",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                          },
                          children: "Kitland",
                        },
                      },
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      backgroundColor: theme.bg,
                      border: `1px solid ${theme.border}`,
                      color: theme.accent,
                      padding: "6px 16px",
                      borderRadius: "9999px",
                      fontSize: "14px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                    },
                    children: badgeText,
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      color: "#ffffff",
                      fontSize: options.title.length > 25 ? "50px" : "58px",
                      fontWeight: 700,
                      letterSpacing: "-0.035em",
                      lineHeight: 1.1,
                    },
                    children: options.title,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      color: "#94a3b8",
                      fontSize: "24px",
                      lineHeight: 1.45,
                      maxWidth: "1000px",
                    },
                    children: options.description,
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "24px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      color: "#64748b",
                      fontSize: "16px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                    },
                    children: "LOCAL-FIRST · 0 UPLOADS · 100% PRIVATE",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      color: "#4ade80",
                      fontSize: "18px",
                      fontWeight: 700,
                    },
                    children: "Tools out. Work on. →",
                  },
                },
              ],
            },
          },
        ],
      },
    } as any,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: fontBoldBuffer,
          weight: 700,
          style: "normal",
        },
        {
          name: "Inter",
          data: fontRegularBuffer,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}
