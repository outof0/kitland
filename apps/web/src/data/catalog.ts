import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  Braces,
  Lock,
  Shuffle,
  Sparkles,
  Terminal,
} from "lucide-react";

export type CatalogFamily = {
  id: string;
  index: string;
  name: string;
  description: string;
  motif: string;
  motifColor: string;
  icon: LucideIcon;
  tools: readonly [string, string, string, string];
};

export const CATALOG_FAMILIES: readonly CatalogFamily[] = [
  {
    id: "json-markup",
    index: "01",
    name: "JSON & Markup",
    description:
      "Format, convert, type, and diff structured data without a server round-trip.",
    motif: '{ "ok": true, "format": "json" }',
    motifColor: "#65A30D",
    icon: Braces,
    tools: ["JSON → TS", "JSON → YAML", "JSON Diff", "XML / SQL"],
  },
  {
    id: "encoding-text",
    index: "02",
    name: "Encoding & Text",
    description: "Base64, URL, HTML, hex, Unicode — clear in both directions.",
    motif: "base64 ⇄ hex ⇄ unicode ⇄ url",
    motifColor: "#2563EB",
    icon: Shuffle,
    tools: ["Base64", "URL Encode", "Hex Text", "Unicode"],
  },
  {
    id: "generators",
    index: "03",
    name: "Generators",
    description: "UUIDs, passwords, NanoID, tokens and mock data on demand.",
    motif: "9f1c-4ab3-bd2b · 1 17 d07b3dcb9bdd",
    motifColor: "#7C3AED",
    icon: Sparkles,
    tools: ["UUID", "Password", "NanoID", "Lorem"],
  },
  {
    id: "hash-crypto",
    index: "04",
    name: "Hash & Crypto",
    description: "Sign, verify and encrypt with library-standard tooling.",
    motif: "e3b0c44298fc1c14 · 6aefbf4c8996fb92",
    motifColor: "#D97706",
    icon: Lock,
    tools: ["HMAC", "JWT Decode", "AES / bcrypt", "RSA Pair"],
  },
  {
    id: "text-regex",
    index: "05",
    name: "Text & Regex",
    description: "Measure, sort, diff and rewrite any text with precision.",
    motif: "/^kit(land)?[a-z]+$/gi  →  matches",
    motifColor: "#DC2626",
    icon: Terminal,
    tools: ["Regex", "Text Diff", "Sort Lines", "Stats"],
  },
  {
    id: "time-network",
    index: "06",
    name: "Time & Network",
    description: "Timestamps, timezones, cron and the bits in between.",
    motif: "2024-08-08T15:04:05Z · UTC+2",
    motifColor: "#0284C7",
    icon: AlarmClock,
    tools: ["Timestamp", "Timezone", "Cron", "IP Subnet"],
  },
] as const;

export const TOOL_RAIL_ITEMS = [
  "JSON → TS",
  "BASE64",
  "UUID v4",
  "SHA-256",
  "bcrypt",
  "JWT",
  "NanoID",
  "Cron",
  "TZ ↗",
  "TOML",
  "Morse",
  "ROT13",
] as const;

export const STATS = [
  { value: "60+", label: "focused utilities" },
  { value: "0", label: "files uploaded" },
  { value: "0", label: "accounts required" },
  { value: "100%", label: "browser-local" },
] as const;

export const PRINCIPLES = [
  {
    index: "01",
    title: "In your browser",
    description:
      "Nothing is uploaded. Every conversion and hash runs locally — your payloads never cross the wire.",
    chip: "NO UPLOAD",
  },
  {
    index: "02",
    title: "One step, one result",
    description:
      "Open a tool, paste, copy. No wizards, onboarding, or artificial waiting.",
    chip: "1-STEP",
  },
  {
    index: "03",
    title: "Open and offline-capable",
    description:
      "Ship the page, use it from a downloaded copy, wire your own hosting. It's just code.",
    chip: "0 SETUP",
  },
] as const;
