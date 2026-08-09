import { err, ok, type ToolResult } from "../result";

export const MIME_TYPES_MAX_QUERY_CHARS = 255;

export type MimeTypeSource = "IANA" | "Apache" | "nginx";

export type MimeType = {
  mime: string;
  type: string;
  subtype: string;
  extensions: readonly string[];
  description: string;
  charset?: string;
  compressible: boolean;
  source: MimeTypeSource;
};

export type MimeLookupKind = "extension" | "mime" | "search";

export type MimeLookupResult = {
  query: string;
  kind: MimeLookupKind;
  matches: readonly MimeType[];
};

type MimeDefinition = Omit<MimeType, "type" | "subtype">;

function mediaType(definition: MimeDefinition): MimeType {
  const [type, subtype] = definition.mime.split("/", 2);
  if (!type || !subtype) throw new Error(`Invalid MIME type: ${definition.mime}`);
  return { ...definition, type, subtype };
}

const iana = "IANA" as const;
const apache = "Apache" as const;

/**
 * Curated, browser-safe MIME registry for common developer and web assets.
 * The list intentionally stores extensions without a leading dot.
 */
export const MIME_TYPES: readonly MimeType[] = [
  mediaType({
    mime: "application/json",
    extensions: ["json", "map"],
    description: "JSON document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/ld+json",
    extensions: ["jsonld"],
    description: "JSON-LD document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/xml",
    extensions: ["xml", "xsl", "xsd"],
    description: "XML document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/pdf",
    extensions: ["pdf"],
    description: "Portable Document Format",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/zip",
    extensions: ["zip"],
    description: "ZIP archive",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/gzip",
    extensions: ["gz"],
    description: "Gzip archive",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/x-7z-compressed",
    extensions: ["7z"],
    description: "7-Zip archive",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "application/x-rar-compressed",
    extensions: ["rar"],
    description: "RAR archive",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "application/x-tar",
    extensions: ["tar"],
    description: "Tape archive",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "application/wasm",
    extensions: ["wasm"],
    description: "WebAssembly binary",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/octet-stream",
    extensions: ["bin", "exe", "dll", "dmg", "iso"],
    description: "Generic binary data",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/sql",
    extensions: ["sql"],
    description: "SQL script",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/rtf",
    extensions: ["rtf"],
    description: "Rich Text Format document",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/epub+zip",
    extensions: ["epub"],
    description: "EPUB publication",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.ms-excel",
    extensions: ["xls"],
    description: "Microsoft Excel workbook",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: ["xlsx"],
    description: "Excel Open XML workbook",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.ms-powerpoint",
    extensions: ["ppt"],
    description: "Microsoft PowerPoint presentation",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extensions: ["pptx"],
    description: "PowerPoint Open XML presentation",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/msword",
    extensions: ["doc"],
    description: "Microsoft Word document",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: ["docx"],
    description: "Word Open XML document",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/x-httpd-php",
    extensions: ["php"],
    description: "PHP source",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),
  mediaType({
    mime: "application/x-sh",
    extensions: ["sh", "bash"],
    description: "Shell script",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),
  mediaType({
    mime: "application/x-yaml",
    extensions: ["yaml", "yml"],
    description: "YAML document",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),
  mediaType({
    mime: "application/graphql-response+json",
    extensions: ["graphql"],
    description: "GraphQL response document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.api+json",
    extensions: ["api.json"],
    description: "JSON:API document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/manifest+json",
    extensions: ["webmanifest"],
    description: "Web app manifest",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/rss+xml",
    extensions: ["rss"],
    description: "RSS feed",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/atom+xml",
    extensions: ["atom"],
    description: "Atom feed",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/x-font-ttf",
    extensions: ["ttf"],
    description: "TrueType font",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "application/font-woff",
    extensions: ["woff"],
    description: "Web Open Font Format",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "font/woff2",
    extensions: ["woff2"],
    description: "Web Open Font Format 2",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "text/plain",
    extensions: ["txt", "text", "log", "md"],
    description: "Plain text",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/html",
    extensions: ["html", "htm", "shtml"],
    description: "HTML document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/css",
    extensions: ["css"],
    description: "Cascading Style Sheet",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/csv",
    extensions: ["csv"],
    description: "Comma-separated values",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/javascript",
    extensions: ["js", "mjs", "cjs"],
    description: "JavaScript source",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/xml",
    extensions: ["xml"],
    description: "XML text document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/markdown",
    extensions: ["md", "markdown"],
    description: "Markdown document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/event-stream",
    extensions: ["event-stream"],
    description: "Server-sent events stream",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "image/jpeg",
    extensions: ["jpg", "jpeg", "jpe"],
    description: "JPEG image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/png",
    extensions: ["png"],
    description: "Portable Network Graphics image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/gif",
    extensions: ["gif"],
    description: "Graphics Interchange Format image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/webp",
    extensions: ["webp"],
    description: "WebP image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/avif",
    extensions: ["avif"],
    description: "AV1 Image File Format",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/svg+xml",
    extensions: ["svg", "svgz"],
    description: "SVG vector image",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "image/x-icon",
    extensions: ["ico"],
    description: "Windows icon",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "image/bmp",
    extensions: ["bmp"],
    description: "Bitmap image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/tiff",
    extensions: ["tif", "tiff"],
    description: "Tagged Image File Format",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/mpeg",
    extensions: ["mp3"],
    description: "MPEG audio",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/ogg",
    extensions: ["oga", "ogg", "opus"],
    description: "Ogg audio",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/wav",
    extensions: ["wav"],
    description: "Waveform audio",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/webm",
    extensions: ["weba"],
    description: "WebM audio",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "video/mp4",
    extensions: ["mp4", "m4v"],
    description: "MPEG-4 video",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "video/webm",
    extensions: ["webm"],
    description: "WebM video",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "video/ogg",
    extensions: ["ogv"],
    description: "Ogg video",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "multipart/form-data",
    extensions: [],
    description: "Multipart form submission",
    compressible: true,
    source: iana,
  }),
];

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().split(";", 1)[0]!.trim();
}

function extensionFromQuery(query: string): string | null {
  if (query.startsWith(".")) return query.slice(1);
  if (query.includes("/")) return null;
  const filenameExtension = query.match(/\.([a-z0-9][a-z0-9.+-]*)$/i)?.[1];
  return filenameExtension ?? query;
}

/** Looks up a MIME media type, a dotted/bare extension, or a filename extension. */
export function lookupMimeTypes(query: string): ToolResult<MimeLookupResult> {
  if (query.length > MIME_TYPES_MAX_QUERY_CHARS) {
    return err("INPUT_TOO_LONG", `Enter at most ${MIME_TYPES_MAX_QUERY_CHARS} characters.`);
  }

  const normalized = normalizeQuery(query);
  if (!normalized) return err("EMPTY_INPUT", "Enter a MIME type or file extension.");

  const directMimeMatches = MIME_TYPES.filter((entry) => entry.mime === normalized);
  if (directMimeMatches.length)
    return ok({ query: normalized, kind: "mime", matches: directMimeMatches });

  const extension = extensionFromQuery(normalized);
  if (extension) {
    const extensionMatches = MIME_TYPES.filter((entry) => entry.extensions.includes(extension));
    if (extensionMatches.length) {
      return ok({ query: normalized, kind: "extension", matches: extensionMatches });
    }
  }

  const searchMatches = MIME_TYPES.filter((entry) =>
    [entry.mime, entry.description, ...entry.extensions].some((value) =>
      value.includes(normalized),
    ),
  );
  return ok({ query: normalized, kind: "search", matches: searchMatches });
}
