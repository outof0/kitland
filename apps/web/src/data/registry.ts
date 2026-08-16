import type { LucideIcon } from "lucide-react";
import { Braces, Clock3, Dices, Regex, ShieldCheck, Shuffle } from "lucide-react";

export type RegistryFamily = {
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

export const REGISTRY_FAMILIES = [
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
] as const satisfies readonly RegistryFamily[];

export const PRINCIPLES = [
  {
    index: "01",
    title: "Enter the payload",
    description:
      "Paste text or import a file into an available workspace without creating an account.",
    chip: "YOUR INPUT",
  },
  {
    index: "02",
    title: "Process on this device",
    description:
      "Runnable tools perform their transformation in the current browser, not through a Kitland API.",
    chip: "NO UPLOAD",
  },
  {
    index: "03",
    title: "Copy the result",
    description:
      "Take the output and move on without onboarding, artificial waiting, or payload telemetry.",
    chip: "ONE RESULT",
  },
] as const;
