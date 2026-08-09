import type { LucideIcon } from "lucide-react";
import { Braces, Clock3, Dices, Regex, ShieldCheck, Shuffle } from "lucide-react";
import { CATALOG_RELEASE_POLICY } from "@kitland/tool-catalog";

export type CatalogFamily = {
  id: string;
  index: string;
  name: string;
  description: string;
  motif: string;
  motifColor: string;
  icon: LucideIcon;
  /** Design-export examples only; never use these as the release inventory. */
  examples: readonly [string, string, string, string];
};

export const CATALOG_FAMILIES = [
  {
    id: "json-markup",
    index: "01",
    name: "JSON & Markup",
    description:
      "Format, convert, validate, and compare structured data without a server round-trip.",
    motif: '{ "ok": true, "format": "json" }',
    motifColor: "#60A5FA",
    icon: Braces,
    examples: ["JSON Formatter", "JSON → TypeScript", "YAML ↔ JSON", "JSON Diff"],
  },
  {
    id: "encoding-text",
    index: "02",
    name: "Encoding & Text",
    description: "Move safely between transport formats, escaped text, bytes, and Unicode.",
    motif: "UTF-8 ⇄ Base64 ⇄ URL ⇄ HEX",
    motifColor: "#2563EB",
    icon: Shuffle,
    examples: ["Base64", "URL Encode", "HTML Entities", "Unicode"],
  },
  {
    id: "generators",
    index: "03",
    name: "Generators",
    description: "Create identifiers, secrets, fixtures, and placeholder content on demand.",
    motif: "9f1c-4ab3 · C7nVx2 · 01J…",
    motifColor: "#C4B5FD",
    icon: Dices,
    examples: ["UUID", "NanoID", "Password", "Lorem Ipsum"],
  },
  {
    id: "hash-crypto",
    index: "04",
    name: "Hash & Crypto",
    description: "Hash, inspect, sign, and verify values with explicit security boundaries.",
    motif: "sha256 · hmac · jwt · aes",
    motifColor: "#BEF264",
    icon: ShieldCheck,
    examples: ["SHA Hash", "HMAC", "JWT Decode", "AES"],
  },
  {
    id: "text-regex",
    index: "05",
    name: "Text & Regex",
    description: "Compare, measure, normalize, and test text with precise local workflows.",
    motif: "/^kit(land)?$/gi → match",
    motifColor: "#FBBF24",
    icon: Regex,
    examples: ["Regex Tester", "Text Diff", "Case Convert", "Sort Lines"],
  },
  {
    id: "time-network",
    index: "06",
    name: "Time & Network",
    description: "Inspect timestamps, schedules, timezones, addresses, and network notation.",
    motif: "2026-08-09T07:00:00Z · /24",
    motifColor: "#2DD4BF",
    icon: Clock3,
    examples: ["Timestamp", "Timezone", "Cron", "CIDR"],
  },
] as const satisfies readonly CatalogFamily[];

export const STATS = [
  { value: String(CATALOG_RELEASE_POLICY.targetToolCount), label: "release target" },
  { value: "6", label: "tool families" },
  { value: "3", label: "product surfaces" },
  { value: "0", label: "payload uploads" },
] as const;

export const PRINCIPLES = [
  {
    index: "01",
    title: "Local by default",
    description:
      "Tool inputs are processed on the current device. Payloads never need to cross the network.",
    chip: "NO UPLOAD",
  },
  {
    index: "02",
    title: "One step, one result",
    description: "Open a tool, paste, copy. No wizards, onboarding, or artificial waiting.",
    chip: "1-STEP",
  },
  {
    index: "03",
    title: "One tested core",
    description:
      "Web, browser extension, and VS Code reuse the same typed rules, limits, errors, and test vectors.",
    chip: "3 SURFACES",
  },
] as const;
