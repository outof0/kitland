import { err, ok, type ToolResult } from "../result";

export const MIME_TYPES_MAX_QUERY_CHARS = 255;

export type MimeTypeSource = "IANA" | "Apache" | "nginx" | "W3C" | "Standard" | "Vendor";

export type MimeCategory =
  | "application"
  | "text"
  | "image"
  | "audio"
  | "video"
  | "font"
  | "model"
  | "multipart";

export type MimeType = {
  mime: string;
  type: string;
  subtype: string;
  category: MimeCategory;
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

type MimeDefinition = Omit<MimeType, "type" | "subtype" | "category">;

function mediaType(definition: MimeDefinition): MimeType {
  const [type, subtype] = definition.mime.split("/", 2);
  if (!type || !subtype) throw new Error(`Invalid MIME type: ${definition.mime}`);
  const category = (
    ["application", "text", "image", "audio", "video", "font", "model", "multipart"].includes(type)
      ? type
      : "application"
  ) as MimeCategory;
  return { ...definition, type, subtype, category };
}

const iana = "IANA" as const;
const apache = "Apache" as const;
const nginx = "nginx" as const;
const w3c = "W3C" as const;
const std = "Standard" as const;
const vendor = "Vendor" as const;

/**
 * Curated, browser-safe MIME registry for developer, web, and system assets.
 * The list stores extensions without a leading dot.
 */
export const MIME_TYPES: readonly MimeType[] = [
  // --- APPLICATION ---
  mediaType({
    mime: "application/json",
    extensions: ["json", "map"],
    description: "JavaScript Object Notation document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/ld+json",
    extensions: ["jsonld"],
    description: "JSON Linked Data document",
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
    description: "Adobe Portable Document Format",
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
    extensions: ["gz", "gzip"],
    description: "Gzip archive",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/x-7z-compressed",
    extensions: ["7z"],
    description: "7-Zip compressed archive",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "application/x-rar-compressed",
    extensions: ["rar"],
    description: "RAR compressed archive",
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
    mime: "application/x-bzip2",
    extensions: ["bz2", "bz"],
    description: "Bzip2 compressed archive",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "application/zstd",
    extensions: ["zst"],
    description: "Zstandard compressed file",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/wasm",
    extensions: ["wasm"],
    description: "WebAssembly binary module",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/octet-stream",
    extensions: ["bin", "exe", "dll", "dmg", "iso", "so", "dylib"],
    description: "Generic binary data stream",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/sql",
    extensions: ["sql"],
    description: "Structured Query Language script",
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
    description: "Electronic Publication ebook",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.ms-excel",
    extensions: ["xls"],
    description: "Microsoft Excel spreadsheet (legacy)",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: ["xlsx"],
    description: "Microsoft Excel OpenXML spreadsheet",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.ms-powerpoint",
    extensions: ["ppt"],
    description: "Microsoft PowerPoint presentation (legacy)",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extensions: ["pptx"],
    description: "Microsoft PowerPoint OpenXML presentation",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/msword",
    extensions: ["doc", "dot"],
    description: "Microsoft Word document (legacy)",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: ["docx"],
    description: "Microsoft Word OpenXML document",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.oasis.opendocument.text",
    extensions: ["odt"],
    description: "OpenDocument text document",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.oasis.opendocument.spreadsheet",
    extensions: ["ods"],
    description: "OpenDocument spreadsheet",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.oasis.opendocument.presentation",
    extensions: ["odp"],
    description: "OpenDocument presentation",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/x-httpd-php",
    extensions: ["php", "phtml"],
    description: "PHP Hypertext Preprocessor script",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),
  mediaType({
    mime: "application/x-sh",
    extensions: ["sh", "bash"],
    description: "Shell command script",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),
  mediaType({
    mime: "application/x-yaml",
    extensions: ["yaml", "yml"],
    description: "YAML data serialization format",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),
  mediaType({
    mime: "application/toml",
    extensions: ["toml"],
    description: "Tom's Obvious Minimal Language document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/graphql-response+json",
    extensions: ["graphql", "gql"],
    description: "GraphQL response payload",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.api+json",
    extensions: ["api.json"],
    description: "JSON:API standard resource document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/manifest+json",
    extensions: ["webmanifest"],
    description: "Web Application Manifest",
    charset: "UTF-8",
    compressible: true,
    source: w3c,
  }),
  mediaType({
    mime: "application/rss+xml",
    extensions: ["rss"],
    description: "Really Simple Syndication feed",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/atom+xml",
    extensions: ["atom"],
    description: "Atom Syndication Format feed",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/jwt",
    extensions: ["jwt"],
    description: "JSON Web Token",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "application/x-ndjson",
    extensions: ["ndjson", "jsonl"],
    description: "Newline Delimited JSON stream",
    charset: "UTF-8",
    compressible: true,
    source: std,
  }),
  mediaType({
    mime: "application/vnd.android.package-archive",
    extensions: ["apk"],
    description: "Android Application Package",
    compressible: false,
    source: vendor,
  }),
  mediaType({
    mime: "application/x-apple-diskimage",
    extensions: ["dmg"],
    description: "Apple Disk Image",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "application/x-iso9660-image",
    extensions: ["iso"],
    description: "ISO 9660 CD/DVD disc image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/vnd.debian.binary-package",
    extensions: ["deb"],
    description: "Debian software package",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/x-rpm",
    extensions: ["rpm"],
    description: "Red Hat Package Manager archive",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "application/vnd.ms-fontobject",
    extensions: ["eot"],
    description: "Embedded OpenType font",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "application/x-font-ttf",
    extensions: ["ttf"],
    description: "TrueType Font (legacy application registration)",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "application/font-woff",
    extensions: ["woff"],
    description: "Web Open Font Format (legacy application registration)",
    compressible: false,
    source: apache,
  }),

  // --- TEXT ---
  mediaType({
    mime: "text/plain",
    extensions: ["txt", "text", "log", "ini", "env", "conf"],
    description: "Plain unformatted text",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/html",
    extensions: ["html", "htm", "shtml"],
    description: "HyperText Markup Language document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/css",
    extensions: ["css", "scss", "sass", "less"],
    description: "Cascading Style Sheet",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/csv",
    extensions: ["csv"],
    description: "Comma-Separated Values table",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/tab-separated-values",
    extensions: ["tsv"],
    description: "Tab-Separated Values table",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/javascript",
    extensions: ["js", "mjs", "cjs"],
    description: "JavaScript ECMAScript program source",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/typescript",
    extensions: ["ts", "mts", "cts"],
    description: "TypeScript source code",
    charset: "UTF-8",
    compressible: true,
    source: std,
  }),
  mediaType({
    mime: "text/jsx",
    extensions: ["jsx"],
    description: "React JavaScript XML source",
    charset: "UTF-8",
    compressible: true,
    source: std,
  }),
  mediaType({
    mime: "text/tsx",
    extensions: ["tsx"],
    description: "React TypeScript XML source",
    charset: "UTF-8",
    compressible: true,
    source: std,
  }),
  mediaType({
    mime: "text/vue",
    extensions: ["vue"],
    description: "Vue.js single file component",
    charset: "UTF-8",
    compressible: true,
    source: std,
  }),
  mediaType({
    mime: "text/svelte",
    extensions: ["svelte"],
    description: "Svelte single file component",
    charset: "UTF-8",
    compressible: true,
    source: std,
  }),
  mediaType({
    mime: "text/xml",
    extensions: ["xml"],
    description: "Extensible Markup Language text",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/markdown",
    extensions: ["md", "markdown", "mdown"],
    description: "Markdown formatted text document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/yaml",
    extensions: ["yaml", "yml"],
    description: "YAML text document",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/event-stream",
    extensions: ["event-stream"],
    description: "Server-Sent Events (SSE) stream",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/vtt",
    extensions: ["vtt"],
    description: "Web Video Text Tracks subtitle format",
    charset: "UTF-8",
    compressible: true,
    source: w3c,
  }),
  mediaType({
    mime: "text/calendar",
    extensions: ["ics", "ifb"],
    description: "iCalendar scheduling event data",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "text/x-python",
    extensions: ["py", "pyw"],
    description: "Python script source code",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),
  mediaType({
    mime: "text/x-rust",
    extensions: ["rs"],
    description: "Rust programming language source",
    charset: "UTF-8",
    compressible: true,
    source: std,
  }),
  mediaType({
    mime: "text/x-go",
    extensions: ["go"],
    description: "Go programming language source",
    charset: "UTF-8",
    compressible: true,
    source: std,
  }),
  mediaType({
    mime: "text/x-c",
    extensions: ["c", "h"],
    description: "C programming language source or header",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),
  mediaType({
    mime: "text/x-c++",
    extensions: ["cpp", "cxx", "cc", "hpp", "hxx"],
    description: "C++ programming language source or header",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),
  mediaType({
    mime: "text/x-java-source",
    extensions: ["java"],
    description: "Java programming language source",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),
  mediaType({
    mime: "text/x-csharp",
    extensions: ["cs"],
    description: "C# programming language source",
    charset: "UTF-8",
    compressible: true,
    source: std,
  }),
  mediaType({
    mime: "text/x-ruby",
    extensions: ["rb"],
    description: "Ruby programming language source",
    charset: "UTF-8",
    compressible: true,
    source: apache,
  }),

  // --- IMAGE ---
  mediaType({
    mime: "image/jpeg",
    extensions: ["jpg", "jpeg", "jpe"],
    description: "JPEG photographic image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/png",
    extensions: ["png"],
    description: "Portable Network Graphics lossless image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/gif",
    extensions: ["gif"],
    description: "Graphics Interchange Format animated image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/webp",
    extensions: ["webp"],
    description: "WebP modern web bitmap image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/avif",
    extensions: ["avif"],
    description: "AV1 Image File Format next-gen image",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/svg+xml",
    extensions: ["svg", "svgz"],
    description: "Scalable Vector Graphics XML image",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "image/x-icon",
    extensions: ["ico"],
    description: "Windows icon resource format",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "image/vnd.microsoft.icon",
    extensions: ["ico"],
    description: "Microsoft Icon format (standard IANA)",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/bmp",
    extensions: ["bmp"],
    description: "Windows Bitmap image",
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
    mime: "image/heic",
    extensions: ["heic"],
    description: "High Efficiency Image Container",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/heif",
    extensions: ["heif"],
    description: "High Efficiency Image File Format",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/vnd.adobe.photoshop",
    extensions: ["psd"],
    description: "Adobe Photoshop document",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "image/jxl",
    extensions: ["jxl"],
    description: "JPEG XL next-generation image",
    compressible: false,
    source: iana,
  }),

  // --- AUDIO ---
  mediaType({
    mime: "audio/mpeg",
    extensions: ["mp3"],
    description: "MPEG-1 Audio Layer III",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/ogg",
    extensions: ["oga", "ogg", "opus"],
    description: "Ogg Vorbis / Opus audio stream",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/wav",
    extensions: ["wav"],
    description: "Waveform Audio File Format",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/webm",
    extensions: ["weba"],
    description: "WebM audio stream",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/aac",
    extensions: ["aac"],
    description: "Advanced Audio Coding stream",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/flac",
    extensions: ["flac"],
    description: "Free Lossless Audio Codec",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/midi",
    extensions: ["mid", "midi"],
    description: "Musical Instrument Digital Interface",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/mp4",
    extensions: ["m4a", "mp4a"],
    description: "MPEG-4 Audio container",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "audio/x-aiff",
    extensions: ["aif", "aiff", "aifc"],
    description: "Audio Interchange File Format",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "audio/x-ms-wma",
    extensions: ["wma"],
    description: "Windows Media Audio",
    compressible: false,
    source: apache,
  }),

  // --- VIDEO ---
  mediaType({
    mime: "video/mp4",
    extensions: ["mp4", "m4v"],
    description: "MPEG-4 Part 14 video container",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "video/webm",
    extensions: ["webm"],
    description: "WebM open video format",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "video/ogg",
    extensions: ["ogv"],
    description: "Ogg Theora video",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "video/x-matroska",
    extensions: ["mkv"],
    description: "Matroska multimedia video container",
    compressible: false,
    source: nginx,
  }),
  mediaType({
    mime: "video/quicktime",
    extensions: ["mov", "qt"],
    description: "Apple QuickTime movie",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "video/x-msvideo",
    extensions: ["avi"],
    description: "Audio Video Interleave container",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "video/mpeg",
    extensions: ["mpg", "mpeg", "mpe"],
    description: "MPEG-1 / MPEG-2 video",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "video/3gpp",
    extensions: ["3gp"],
    description: "3GPP mobile video container",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "video/mp2t",
    extensions: ["ts"],
    description: "MPEG-2 Transport Stream (HLS segment)",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "video/x-ms-wmv",
    extensions: ["wmv"],
    description: "Windows Media Video",
    compressible: false,
    source: apache,
  }),
  mediaType({
    mime: "video/x-flv",
    extensions: ["flv"],
    description: "Adobe Flash Video",
    compressible: false,
    source: apache,
  }),

  // --- FONT ---
  mediaType({
    mime: "font/woff2",
    extensions: ["woff2"],
    description: "Web Open Font Format 2.0 (Brotli compressed)",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "font/woff",
    extensions: ["woff"],
    description: "Web Open Font Format 1.0 (standard font/*)",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "font/ttf",
    extensions: ["ttf"],
    description: "TrueType Font (standard font/*)",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "font/otf",
    extensions: ["otf"],
    description: "OpenType Font (standard font/*)",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "font/collection",
    extensions: ["ttc"],
    description: "OpenType / TrueType Font Collection",
    compressible: false,
    source: iana,
  }),

  // --- MODEL (3D) ---
  mediaType({
    mime: "model/gltf+json",
    extensions: ["gltf"],
    description: "GL Transmission Format JSON 3D scene",
    charset: "UTF-8",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "model/gltf-binary",
    extensions: ["glb"],
    description: "GL Transmission Format binary 3D container",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "model/obj",
    extensions: ["obj"],
    description: "Wavefront 3D object geometry",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "model/stl",
    extensions: ["stl"],
    description: "Stereolithography 3D geometry file",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "model/3mf",
    extensions: ["3mf"],
    description: "3D Manufacturing Format package",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "model/vnd.usdz+zip",
    extensions: ["usdz"],
    description: "Universal Scene Description zipped package (AR)",
    compressible: false,
    source: iana,
  }),
  mediaType({
    mime: "model/step",
    extensions: ["step", "stp"],
    description: "Standard for the Exchange of Product model data",
    compressible: true,
    source: iana,
  }),

  // --- MULTIPART ---
  mediaType({
    mime: "multipart/form-data",
    extensions: ["form-data"],
    description: "Multipart HTTP Form submission payload",
    compressible: true,
    source: iana,
  }),
  mediaType({
    mime: "multipart/byteranges",
    extensions: ["byteranges"],
    description: "Multipart byte range payload for partial responses",
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
    [entry.mime, entry.description, entry.type, entry.subtype, ...entry.extensions].some((value) =>
      value.toLowerCase().includes(normalized),
    ),
  );
  return ok({ query: normalized, kind: "search", matches: searchMatches });
}
