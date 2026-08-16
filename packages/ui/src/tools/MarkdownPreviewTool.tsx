import { useCopyFeedback } from "../hooks/useCopyFeedback";
import { useMarkdownPreview } from "../hooks/useInspectHooks";
import { MARKDOWN_PREVIEW_MAX_INPUT_CHARS } from "@kitland/core";
import { HostCodeEditor } from "../components/HostCodeEditor";
import { Check, Copy, Eye, FileInput, Trash2 } from "lucide-react";
import { LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "../capabilities";
import { useEffect, useId, useRef, useState } from "react";

const SAMPLE = `# Kitland Developer Utilities\n\nBuild lightweight developer utilities that run **100% locally in your browser**.\n\n### Key Features\n- ⚡ **Zero latency**: Pure browser execution without API calls\n- 🔒 **Privacy-first**: Your payloads and secrets never leave your device\n- 📦 **64+ Tools**: Formatting, encoding, crypto, and network helpers\n\n\`\`\`typescript\ninterface ToolDefinition {\n  name: string;\n  pure: boolean;\n}\n\`\`\``;

export type MarkdownPreviewToolProps = {
  readonly initialInput?: string;
  readonly capabilities?: ToolCapabilities;
};

/** Markdown Preview. */
export function MarkdownPreviewTool({
  initialInput,
  capabilities: _capabilities = LOCAL_ONLY_CAPABILITIES,
}: MarkdownPreviewToolProps = {}) {
  void _capabilities;
  const headingId = useId();
  const inputId = useId();
  const [source, setSource] = useState(initialInput ?? SAMPLE);
  const { isCopied, copy } = useCopyFeedback();

  const lastInitialInputRef = useRef(initialInput);
  useEffect(() => {
    if (
      initialInput !== undefined &&
      initialInput !== "" &&
      initialInput !== lastInitialInputRef.current
    ) {
      lastInitialInputRef.current = initialInput;
      setSource(initialInput);
    }
  }, [initialInput]);

  const result = useMarkdownPreview(source);
  const preview = result.ok ? result.value : null;
  const error = !result.ok ? result.error.message : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 font-ui">
      {/* Tool Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] bg-primary-soft border border-outline rounded-[12px] text-primary flex items-center justify-center shrink-0">
            <Eye className="size-5" />
          </div>
          <div>
            <h2
              id={headingId}
              className="text-[20px] font-bold font-display text-on-surface tracking-[-0.02em] m-0"
            >
              Markdown Preview
            </h2>
            <p className="text-[13px] text-on-muted m-0 mt-0.5 max-sm:hidden">
              Write and render sanitized Markdown with syntax styling and live HTML preview locally.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSource(SAMPLE)}
            className="h-[32px] px-[12px] bg-surface-low border border-outline rounded-[8px] text-[12px] font-medium text-on-surface hover:bg-surface hover:border-outline-strong transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileInput className="size-3.5 text-on-muted" />
            <span>Sample</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          className="bg-danger-soft border border-danger/30 rounded-[10px] px-3.5 py-2 text-[12px] text-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Two-Column Editor Layout */}
      <div className="tool-editor-stage grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Input Card */}
        <div className="flex flex-col bg-surface border border-outline rounded-[12px] overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <div className="h-[45.5px] bg-surface-low border-b border-outline px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <label
                htmlFor={inputId}
                className="text-[13px] font-medium text-on-surface cursor-pointer"
              >
                Markdown Source
              </label>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void copy("source", source)}
                disabled={!source}
                title={isCopied("source") ? "Copied" : "Copy Markdown source"}
                aria-label={isCopied("source") ? "Copied" : "Copy Markdown source"}
                className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isCopied("source")
                    ? "bg-success-soft text-success border border-success/40"
                    : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                }`}
              >
                {isCopied("source") ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setSource("")}
                disabled={!source}
                title="Clear"
                className="size-8 rounded-[7px] flex items-center justify-center text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden bg-transparent">
            <HostCodeEditor
              id={inputId}
              value={source}
              onChange={setSource}
              language="markdown"
              placeholder="Type markdown content here…"
              ariaLabel="Markdown source"
              maxChars={MARKDOWN_PREVIEW_MAX_INPUT_CHARS}
            />
          </div>
        </div>

        {/* Output Card */}
        <div className="flex flex-col bg-surface border border-outline rounded-[12px] overflow-hidden">
          <div className="h-[45.5px] bg-surface-low border-b border-outline px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success" />
              <span className="text-[13px] font-medium text-on-surface">HTML Preview</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void copy("html", preview?.html ?? "")}
                disabled={!preview}
                title={isCopied("html") ? "Copied" : "Copy rendered HTML"}
                aria-label={isCopied("html") ? "Copied" : "Copy rendered HTML"}
                className={`size-8 rounded-[7px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                  isCopied("html")
                    ? "bg-success-soft text-success border border-success/40"
                    : "text-on-muted hover:text-on-surface hover:bg-surface border border-transparent hover:border-outline"
                }`}
              >
                {isCopied("html") ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div
            aria-label="Rendered Markdown preview"
            className="p-5 flex-1 min-h-0 overflow-y-auto bg-surface-low/50"
          >
            {preview ? (
              <div
                className="prose prose-invert max-w-none text-[14px] leading-relaxed text-on-surface [&_h1]:text-[20px] [&_h1]:font-bold [&_h1]:text-on-surface [&_h1]:mb-3 [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-on-surface [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:text-on-muted [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:text-on-muted [&_li]:mb-1 [&_strong]:text-success [&_strong]:font-semibold [&_code]:bg-surface [&_code]:border [&_code]:border-outline [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-[4px] [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-primary [&_pre]:bg-surface-low [&_pre]:border [&_pre]:border-outline [&_pre]:p-3 [&_pre]:rounded-[8px] [&_pre]:font-mono [&_pre]:text-[12px] [&_pre]:my-3"
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-[13px] text-on-faint py-12">
                Enter Markdown on the left to see live rendered preview.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-[36px] bg-surface-low border border-outline rounded-[8px] px-3.5 flex items-center justify-between text-[12px] shrink-0 font-ui">
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              result.ok
                ? "bg-success-soft text-success border border-success/30"
                : "bg-danger-soft text-danger border border-danger/30"
            }`}
          >
            {result.ok ? "Rendered" : "Error"}
          </span>
          <span className="text-on-muted">
            {preview ? `${preview.headings} headings · ${source.length} chars` : "Local preview"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono text-[11px] font-semibold">
            &lt;&gt; MARKDOWN
          </span>
        </div>
      </div>
    </div>
  );
}
