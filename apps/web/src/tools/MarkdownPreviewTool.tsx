import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMarkdownPreview } from "@/hooks/useMarkdownPreview";
import { MARKDOWN_PREVIEW_MAX_INPUT_CHARS } from "@kitland/core";
import { FileInput, Eye, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";

const SAMPLE = `# Kitland\n\nBuild small tools that stay local.\n\n- Fast feedback\n- Private by default\n\n\`\`\`ts\nconst ready = true;\n\`\`\``;

export function MarkdownPreviewTool() {
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [source, setSource] = useState(SAMPLE);
  const result = useMarkdownPreview(source);
  const preview = result.ok ? result.value : null;
  const error = !result.ok ? result.error.message : null;

  return (
    <section
      className="flex min-h-0 flex-1 flex-col gap-4"
      aria-labelledby="markdown-preview-title"
    >
      <div className="tool-header">
        <div className="tool-header__icon" aria-hidden="true">
          <Eye />
        </div>
        <div className="tool-header__texts">
          <h2 id="markdown-preview-title" className="tool-header__title">
            Markdown Preview
          </h2>
          <p className="tool-header__subtitle">
            Preview a safe Markdown subset locally. Raw HTML is escaped.
          </p>
        </div>
        <div className="tool-header__actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setSource(SAMPLE);
              inputRef.current?.focus();
            }}
          >
            <FileInput aria-hidden="true" /> Sample
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="tool-btn"
            onClick={() => {
              setSource("");
              inputRef.current?.focus();
            }}
          >
            <Trash2 aria-hidden="true" /> Clear
          </Button>
        </div>
      </div>
      <p className="tool-field-note">
        Runs locally · up to {MARKDOWN_PREVIEW_MAX_INPUT_CHARS.toLocaleString()} characters · raw
        HTML is never executed
      </p>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <section className="tool-card tool-card--in" aria-labelledby={`${inputId}-label`}>
          <div className="tool-card__header">
            <span id={`${inputId}-label`} className="tool-card__label">
              Markdown
            </span>
            <span className="font-mono text-[11px] text-[var(--on-faint)]">
              {source.length.toLocaleString()} chars
            </span>
          </div>
          <div className="tool-card__body">
            <label htmlFor={inputId} className="sr-only">
              Markdown source
            </label>
            <Textarea
              ref={inputRef}
              id={inputId}
              className="tool-card__textarea min-h-[24rem]"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              spellCheck={false}
              maxLength={MARKDOWN_PREVIEW_MAX_INPUT_CHARS}
              aria-invalid={error ? true : undefined}
              placeholder="Write Markdown here…"
            />
            {error ? (
              <p className="tool-card__validation" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </section>
        <section className="tool-card" aria-label="Rendered Markdown preview" aria-live="polite">
          <div className="tool-card__header">
            <span className="tool-card__label">Preview</span>
            <span className="font-mono text-[11px] text-[var(--on-faint)]">
              {preview ? `${preview.headings} headings` : "—"}
            </span>
          </div>
          <div className="tool-card__body overflow-auto">
            {preview ? (
              <div
                className="prose prose-invert max-w-none text-sm leading-7"
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            ) : (
              <p className="text-sm text-[var(--on-muted)]">Enter Markdown to preview it.</p>
            )}
          </div>
        </section>
      </div>
      <div className="tool-status">
        <div className="tool-status__left">
          <span
            className={
              error
                ? "tool-status__chip tool-status__chip--error"
                : "tool-status__chip tool-status__chip--ready"
            }
          >
            {error ? "Fix Markdown" : "Ready"}
          </span>
        </div>
        <span className="tool-status__lang">Local only</span>
      </div>
    </section>
  );
}
