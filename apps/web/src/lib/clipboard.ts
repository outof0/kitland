export type CopyTextResult = { ok: true } | { ok: false; message: string };

export type PickTextFileOptions = {
  /** File-picker filter. Validation is still performed after selection. */
  accept?: string;
  /** Reject a file before reading it into memory. */
  maxBytes?: number;
  /** Reject decoded text that exceeds the tool's character contract. */
  maxChars?: number;
};

export type PickTextFileResult =
  | {
      ok: true;
      text: string;
      fileName: string;
      size: number;
    }
  | {
      ok: false;
      code:
        | "CANCELLED"
        | "FILE_TOO_LARGE"
        | "UNSUPPORTED_FILE_TYPE"
        | "INVALID_UTF8"
        | "TEXT_TOO_LONG"
        | "READ_FAILED";
      message: string;
    };

const DEFAULT_TEXT_FILE_ACCEPT = "text/*,.txt,.text,.b64,.base64,.json,.csv,.md,.xml";
const DEFAULT_TEXT_FILE_EXTENSIONS = new Set([
  "txt",
  "text",
  "b64",
  "base64",
  "json",
  "csv",
  "md",
  "xml",
]);
const CLIPBOARD_WRITE_TIMEOUT_MS = 1_500;

type LegacyCopyDocument = {
  execCommand?: (commandId: string) => boolean;
};

type ClipboardNavigator = Omit<Navigator, "clipboard"> & {
  clipboard?: Clipboard;
};

/** Copy text and return a user-safe failure message when access is unavailable. */
export async function copyText(text: string): Promise<CopyTextResult> {
  if (!text) {
    return { ok: false, message: "There is no text to copy yet." };
  }

  try {
    // Clipboard is absent in some older or non-secure browser contexts even
    // though modern DOM typings model it as always present.
    const clipboard = (navigator as ClipboardNavigator).clipboard;
    if (clipboard) {
      await writeClipboardTextWithTimeout(clipboard, text);
      return { ok: true };
    }
  } catch {
    // Fall through to the legacy copy path for browsers without Clipboard access.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.className = "kitland-clipboard-fallback";
    document.body.appendChild(textarea);
    let copied = false;
    try {
      textarea.select();
      // Clipboard API is the primary path. This narrow cast keeps the legacy
      // compatibility fallback isolated from the DOM type's deprecated API.
      copied = (document as unknown as LegacyCopyDocument).execCommand?.("copy") ?? false;
    } finally {
      textarea.remove();
    }

    if (copied) return { ok: true };
  } catch {
    // Return the same action users can take whether the fallback throws or fails.
  }

  return {
    ok: false,
    message: "Couldn’t access your clipboard. Select the text and copy it manually.",
  };
}

/**
 * Clipboard permission implementations occasionally leave `writeText()`
 * pending (notably in embedded or backgrounded browser contexts). Bound the
 * attempt so a Copy or Share control always reaches an actionable state.
 */
async function writeClipboardTextWithTimeout(clipboard: Clipboard, text: string): Promise<void> {
  let timeout: number | undefined;
  try {
    await Promise.race([
      clipboard.writeText(text),
      new Promise<void>((_, reject) => {
        timeout = window.setTimeout(
          () => reject(new Error("Clipboard write timed out.")),
          CLIPBOARD_WRITE_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeout !== undefined) window.clearTimeout(timeout);
  }
}

/** Download a text blob as a file. */
export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Pick and safely read a small UTF-8 text file.
 *
 * The file is checked for a text MIME type / known text extension and size before
 * its bytes are read. UTF-8 is decoded in fatal mode so binary or corrupted files
 * do not silently turn into replacement characters.
 */
export function pickTextFile(options: PickTextFileOptions = {}): Promise<PickTextFileResult> {
  const { accept = DEFAULT_TEXT_FILE_ACCEPT, maxBytes, maxChars } = options;

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.className = "kitland-file-picker";

    let settled = false;
    let cancelTimer: number | undefined;

    const cleanup = () => {
      if (cancelTimer !== undefined) window.clearTimeout(cancelTimer);
      window.removeEventListener("focus", onWindowFocus);
      input.remove();
    };

    const finish = (result: PickTextFileResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const onWindowFocus = () => {
      // The picker restores window focus both after selecting and cancelling.
      // Let the change event win before treating an empty selection as cancel.
      cancelTimer = window.setTimeout(() => {
        if (!input.files?.length) {
          finish({ ok: false, code: "CANCELLED", message: "File selection cancelled." });
        }
      }, 300);
    };

    const onChange = () => {
      const file = input.files?.[0];
      if (!file) {
        finish({ ok: false, code: "CANCELLED", message: "File selection cancelled." });
        return;
      }

      void readPickedTextFile(file, { maxBytes, maxChars }).then(finish);
    };

    input.addEventListener("change", onChange, { once: true });
    input.addEventListener(
      "cancel",
      () => finish({ ok: false, code: "CANCELLED", message: "File selection cancelled." }),
      { once: true },
    );
    window.addEventListener("focus", onWindowFocus, { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

async function readPickedTextFile(
  file: File,
  {
    maxBytes,
    maxChars,
  }: {
    maxBytes: number | undefined;
    maxChars: number | undefined;
  },
): Promise<PickTextFileResult> {
  if (!isTextFile(file)) {
    return {
      ok: false,
      code: "UNSUPPORTED_FILE_TYPE",
      message: "Choose a UTF-8 text file (for example .txt, .b64, or .json).",
    };
  }

  if (maxBytes !== undefined && file.size > maxBytes) {
    return {
      ok: false,
      code: "FILE_TOO_LARGE",
      message: `This file is larger than the ${formatBytes(maxBytes)} upload limit.`,
    };
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return {
      ok: false,
      code: "READ_FAILED",
      message: "The selected file could not be read. Please try again.",
    };
  }

  let text: string;
  try {
    text = decodeUtf8Text(buffer);
  } catch {
    return {
      ok: false,
      code: "INVALID_UTF8",
      message: "This file is not valid UTF-8 text. Binary files are not supported.",
    };
  }

  if (maxChars !== undefined && text.length > maxChars) {
    return {
      ok: false,
      code: "TEXT_TOO_LONG",
      message: `This file exceeds the ${maxChars.toLocaleString()} character input limit.`,
    };
  }

  return { ok: true, text, fileName: file.name, size: file.size };
}

/**
 * Decode file bytes as text without treating a leading U+FEFF as transport
 * metadata. The Base64 tool preserves it when pasted, so upload must preserve
 * it too for an exact text round-trip.
 */
export function decodeUtf8Text(buffer: ArrayBuffer): string {
  return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(buffer);
}

function isTextFile(file: File): boolean {
  if (file.type.startsWith("text/")) return true;

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension !== undefined && DEFAULT_TEXT_FILE_EXTENSIONS.has(extension);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
