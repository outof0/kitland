/**
 * Tool metadata shared by the vanilla mount and the React tool components:
 * icon glyphs and sample inputs. Data only — no core or runtime imports, so
 * bundlers never pull tool implementations through this module.
 */
import type { ToolUiPattern } from "@kitland/tools";

export const ICONS = {
  braces:
    '<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>',
  type: '<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>',
  lock: '<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  globe:
    '<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  clock:
    '<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  sparkles:
    '<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>',
  palette:
    '<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10z"/></svg>',
  database:
    '<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>',
  code: '<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  calculator:
    '<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>',
  sample:
    '<svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>',
  clear:
    '<svg class="size-3.5 text-rose-300" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>',
  copy: '<svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
  check:
    '<svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
  circleCheck:
    '<svg class="size-3.5 text-success" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  circleAlert:
    '<svg class="size-4.5 text-destructive shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
  info: '<svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  play: '<svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  wand: '<svg class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="m15 4-2 4-4 2 4 2 2 4 2-4 4-2-4-2-2-4Z"/><path d="M9 18l-1 2-2 1 2 1 1 2 1-2 2-1-2-1-1-2Z"/></svg>',
  spinner:
    '<svg class="size-3.5 animate-spin" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  file: '<svg class="size-3 text-primary" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
};

function icon(paths: string): string {
  return `<svg class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${paths}</svg>`;
}

const TOOL_ICONS: Record<string, string> = {
  "beautify-minify": icon('<path d="m16 3-4 8 6-2-4 8"/><path d="M8 21h8"/><path d="M12 17v4"/>'),
  "json-diff": icon(
    '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/>',
  ),
  "json-formatter": ICONS.braces,
  "json-to-yaml": icon(
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/>',
  ),
  "yaml-to-json": ICONS.braces,
  "json-to-csv": icon(
    '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
  ),
  "json-to-toml": icon(
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
  ),
  "xml-formatter": ICONS.code,
  "sql-formatter": ICONS.database,
  "markdown-preview": icon(
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>',
  ),
  base64: icon(
    '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01"/><path d="M10 10h.01"/><path d="M14 10h.01"/><path d="M18 10h.01"/><path d="M8 14h8"/>',
  ),
  "url-encode": icon(
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  ),
  "html-entities": ICONS.code,
  "hex-text": icon('<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>'),
  "unicode-converter": ICONS.type,
  "binary-text": icon(
    '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h4"/><path d="M6 14h2"/><path d="M14 10h4"/><path d="M14 14h2"/>',
  ),
  "rot13-caesar": icon(
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  ),
  "morse-code": icon(
    '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
  ),
  "sha-hash": icon(
    '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
  ),
  "hmac-generator": icon(
    '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  ),
  "aes-cipher": ICONS.lock,
  "bcrypt-hash": icon(
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  ),
  "jwt-decoder": icon(
    '<circle cx="8" cy="15" r="4"/><path d="m10.85 12.15 8.3-8.3a1.5 1.5 0 0 1 2.12 0l.73.73a1.5 1.5 0 0 1 0 2.12l-8.3 8.3"/>',
  ),
  "token-generator": icon(
    '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  ),
  "rsa-key-pair": icon(
    '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  ),
  "uuid-id": ICONS.sparkles,
  "url-parser": ICONS.globe,
  "http-status-codes": icon(
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  ),
  "mime-types": icon(
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  ),
  "user-agent-parser": icon(
    '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  ),
  "basic-auth-header": icon('<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>'),
  "curl-converter": icon(
    '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  ),
  "cron-parser": icon(
    '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/>',
  ),
  "ip-subnet-calculator": icon(
    '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
  ),
  "text-stats": icon(
    '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16v-5"/><path d="M12 16V8"/><path d="M17 16v-3"/>',
  ),
  "text-diff": icon(
    '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  ),
  "case-converter": ICONS.type,
  "sort-lines": icon(
    '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
  ),
  "dedupe-lines": icon('<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>'),
  "lorem-ipsum": icon('<path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/>'),
  "text-reverser": icon(
    '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  ),
  "regex-tester": icon(
    '<path d="M17 3v10"/><path d="m12.67 5.5 8.66 5"/><path d="m12.67 10.5 8.66-5"/><path d="M9 17a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2z"/>',
  ),
  "password-generator": ICONS.lock,
  "nanoid-generator": ICONS.sparkles,
  "ulid-generator": ICONS.sparkles,
  "objectid-generator": icon(
    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
  ),
  "mock-data": icon(
    '<rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/>',
  ),
  "random-port": icon(
    '<path d="M5 20a2 2 0 0 1-2-2V6.5a2 2 0 0 1 .4-1.2"/><path d="M10 20a2 2 0 0 0 2-2V8.5"/><path d="M15 20a2 2 0 0 0 2-2V9"/><path d="M8 8.5V7"/><path d="M13 8.5V4"/><path d="M18 9V3"/>',
  ),
  "random-number": icon(
    '<rect width="12" height="12" x="2" y="10" rx="2" ry="2"/><path d="m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6"/><path d="M6 18h.01"/><path d="M10 14h.01"/><path d="M15 6h.01"/><path d="M18 9h.01"/>',
  ),
  "qr-code": icon(
    '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  ),
  "unix-timestamp": ICONS.clock,
  "date-calculator": icon(
    '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  ),
  "timezone-converter": ICONS.globe,
  "duration-formatter": icon(
    '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
  ),
  "number-base": ICONS.calculator,
  "color-converter": ICONS.palette,
  temperature: icon('<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>'),
  "data-size": icon(
    '<line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" x2="6.01" y1="16" y2="16"/><line x1="10" x2="10.01" y1="16" y2="16"/>',
  ),
  "age-calculator": icon(
    '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',
  ),
  "json-to-typescript": icon(
    '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  ),
  "json-to-js-const": ICONS.code,
  "html-to-jsx": icon(
    '<path d="M8 6h8"/><path d="M6 10h12"/><path d="M9 14h6"/><rect width="18" height="18" x="3" y="3" rx="2"/>',
  ),
  "json-escape": icon(
    '<path d="m7 7 10 10"/><path d="M17 7 7 17"/><rect width="18" height="18" x="3" y="3" rx="2"/>',
  ),
  "split-to-newlines": icon('<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/>'),
  "join-lines": icon(
    '<path d="m8 6 4-4 4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22"/><path d="m20 22-5-5"/>',
  ),
};

export function toolIconFor(slug: string): string {
  return TOOL_ICONS[slug] ?? ICONS.braces;
}

const TOOL_SAMPLES: Record<string, string> = {
  "beautify-minify":
    '{\n  "name": "kitland",\n  "version": "1.0.0",\n  "features": ["local", "private", "fast"]\n}',
  "json-diff":
    '{\n  "id": 1,\n  "name": "Widget",\n  "price": 9.99,\n  "tags": ["tools", "dev"]\n}',
  "json-formatter":
    '{\n  "user": "erik",\n  "roles": ["admin", "developer"],\n  "settings": { "dark": true }\n}',
  "json-to-yaml": '{\n  "server": "api.kitland.dev",\n  "port": 8080,\n  "ssl": true\n}',
  "yaml-to-json":
    "server: api.kitland.dev\nport: 8080\nssl: true\ntags:\n  - production\n  - global",
  "json-to-csv":
    '[\n  {"name": "Alice", "role": "Engineer", "age": 28},\n  {"name": "Bob", "role": "Designer", "age": 32}\n]',
  "json-to-toml": '{\n  "title": "Kitland TOML Example",\n  "owner": {\n    "name": "Erik"\n  }\n}',
  "xml-formatter": '<root><user id="1"><name>Kitland</name><active>true</active></user></root>',
  "sql-formatter":
    "SELECT u.id, u.name, count(o.id) as orders_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.active = 1 GROUP BY u.id, u.name ORDER BY orders_count DESC LIMIT 10;",
  "markdown-preview":
    '# Kitland Tools\n\n- **Fast**: Runs entirely in memory.\n- **Private**: No network requests.\n\n```json\n{"ok": true}\n```',
  base64: "Kitland — offline developer tools",
  "url-encode": "kitland.dev/search?q=developer tools & category=utilities #intro",
  "html-entities": '<div class="card">Hello & Welcome to "Kitland" © 2026</div>',
  "hex-text": "Kitland",
  "unicode-converter": "Kitland 🚀 Tools",
  "binary-text": "Kit",
  "rot13-caesar": "Hello World! Tools out. Work on.",
  "morse-code": "KITLAND DEV TOOLS",
  "sha-hash": "Kitland offline payload",
  "hmac-generator": "Kitland HMAC payload",
  "aes-cipher": "Secret payload to encrypt with AES-GCM",
  "bcrypt-hash": "my-secure-password-2026",
  "jwt-decoder":
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkVyaWsiLCJpYXQiOjE1MTYyMzkwMjIsImFkbWluIjp0cnVlfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "token-generator": "32",
  "rsa-key-pair": "2048",
  "uuid-id": "5",
  "url-parser": "user:pass@kitland.dev:8080/explore/json-formatter?indent=2&mode=beautify#result",
  "http-status-codes": "404",
  "mime-types": "application/json",
  "user-agent-parser":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "basic-auth-header": "admin:secretpassword",
  "curl-converter":
    "curl -X POST '/v1/tools' -H 'Authorization: Bearer token123' -H 'Content-Type: application/json' -d '{\"name\":\"json-formatter\"}'",
  "cron-parser": "0 */2 * * 1-5",
  "ip-subnet-calculator": "192.168.1.100/24",
  "text-stats":
    "Kitland developer tools run locally on your device.\nNo server uploads, zero telemetry.\nFast, safe, and private.",
  "text-diff": 'const greeting = "Hello, world!";\nconsole.log(greeting);\nconst version = 1;',
  "case-converter": "hello_world_example_string",
  "sort-lines": "banana\napple\norange\ngrape\ncherry",
  "dedupe-lines": "apple\nbanana\napple\norange\nbanana\ngrape\napple",
  "lorem-ipsum": "3",
  "text-reverser": "The quick brown fox jumps over the lazy dog.",
  "regex-tester": "user@kitland.dev, support@example.com, invalid-email, hello@world.org",
  "password-generator": "16",
  "nanoid-generator": "21",
  "ulid-generator": "5",
  "objectid-generator": "5",
  "mock-data": "10",
  "random-port": "5",
  "random-number": "10",
  "qr-code": "kitland.dev",
  "unix-timestamp": "1718000000",
  "date-calculator": "2026-01-01",
  "timezone-converter": "2026-08-14T12:00:00Z",
  "duration-formatter": "3665",
  "number-base": "255",
  "color-converter": "#2563EB",
  temperature: "100",
  "data-size": "1073741824",
  "age-calculator": "2000-01-15",
  "json-to-typescript":
    '{\n  "id": 1,\n  "name": "Kitland",\n  "active": true,\n  "tags": ["tools", "offline"],\n  "config": {\n    "port": 8080\n  }\n}',
  "json-to-js-const": '{\n  "appName": "Kitland",\n  "version": 1,\n  "enabled": true\n}',
  "html-to-jsx":
    '<div class="container" style="background-color: #0b0c10; font-size: 14px;"><label for="input">Name:</label><input type="text" id="input" value="Kitland" readonly /></div>',
  "json-escape": '{\n  "message": "Hello \\"World\\" & \'Kitland\'\\nLine 2"\n}',
  "split-to-newlines": "apple,banana,orange,grape,cherry,mango",
  "join-lines": "apple\nbanana\norange\ngrape\ncherry\nmango",
};

const TOOL_SECONDARY_SAMPLES: Record<string, string> = {
  "json-diff":
    '{\n  "id": 1,\n  "name": "Widget Pro",\n  "price": 14.99,\n  "tags": ["tools", "dev", "v2"]\n}',
  "text-diff":
    'const greeting = "Hello, Kitland!";\nconsole.log(greeting);\nconst version = 2;\nconsole.log("Ready!");',
  "hmac-generator": "secret-key-12345",
  "aes-cipher": "my-super-secret-password",
  "regex-tester": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
  "date-calculator": "2026-08-14",
  "age-calculator": "2026-08-14",
  "split-to-newlines": ",",
  "join-lines": ",",
};

export function sampleFor(slug: string, pattern: ToolUiPattern, _isDiff: boolean): string {
  if (pattern === "generate" && !TOOL_SAMPLES[slug]) return "";
  return TOOL_SAMPLES[slug] ?? "Hello, Kitland!\nTools out. Work on.";
}

/** Secondary-pane sample for diff tools (used by the ktu mount). */
export function sampleSecondary(slug: string): string {
  return TOOL_SECONDARY_SAMPLES[slug] ?? "Hello, Kitland!\nChanged line.";
}
