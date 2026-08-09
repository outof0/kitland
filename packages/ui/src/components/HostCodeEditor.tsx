import { forwardRef, lazy, Suspense, useImperativeHandle, useMemo, useRef, type Ref } from "react";
import {
  useCodeEditorContext,
  type InjectedEditorLanguage,
  type InjectedEditorRef,
} from "./CodeEditorContext";

export type HostCodeEditorProps = {
  readonly value: string;
  readonly onChange?: ((value: string) => void) | undefined;
  readonly language?: InjectedEditorLanguage | undefined;
  readonly readOnly?: boolean | undefined;
  readonly placeholder?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly ariaDescribedBy?: string | undefined;
  readonly ariaInvalid?: boolean | undefined;
  readonly indentSize?: 2 | 4 | undefined;
  readonly onSubmit?: (() => void) | undefined;
  readonly onFocus?: (() => void) | undefined;
  readonly onBlur?: (() => void) | undefined;
  readonly id?: string | undefined;
  readonly maxChars?: number | undefined;
};

/**
 * Host-aware editor pane. Web injects CodeMirror through CodeEditorContext;
 * extension and VS Code keep the textarea + gutter fallback.
 */
export const HostCodeEditor = forwardRef<InjectedEditorRef, HostCodeEditorProps>(
  function HostCodeEditor(
    {
      value,
      onChange,
      language = "text",
      readOnly,
      placeholder,
      ariaLabel,
      ariaDescribedBy,
      ariaInvalid,
      indentSize,
      onSubmit,
      onFocus,
      onBlur,
      id,
      maxChars,
    },
    ref,
  ) {
    const editorContext = useCodeEditorContext();
    const Editor = useMemo(() => {
      if (!editorContext?.loadEditor) return null;
      return lazy(editorContext.loadEditor);
    }, [editorContext?.loadEditor]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const injectedRef = useRef<InjectedEditorRef>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const linesCount = useMemo(() => Math.max(10, value.split("\n").length), [value]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        injectedRef.current?.focus();
        textareaRef.current?.focus();
      },
    }));

    if (Editor) {
      return (
        <Suspense
          fallback={<div className="min-h-0 min-w-0 flex-1 bg-surface" aria-hidden="true" />}
        >
          <Editor
            ref={injectedRef as Ref<InjectedEditorRef>}
            value={value}
            onChange={
              readOnly
                ? undefined
                : (next) =>
                    onChange?.(typeof maxChars === "number" ? next.slice(0, maxChars) : next)
            }
            language={language}
            readOnly={readOnly}
            placeholder={placeholder}
            ariaLabel={ariaLabel}
            ariaDescribedBy={ariaDescribedBy}
            ariaInvalid={ariaInvalid}
            indentSize={indentSize}
            onSubmit={onSubmit}
            id={id}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </Suspense>
      );
    }

    return (
      <div className="flex min-h-0 min-w-0 flex-1">
        <div
          ref={gutterRef}
          className="flex w-[44px] shrink-0 flex-col items-end overflow-hidden border-r border-outline bg-surface-low py-[14px] pr-[8px] select-none"
          aria-hidden="true"
        >
          {Array.from({ length: linesCount }, (_, i) => (
            <div key={i} className="text-right font-mono text-[13px] leading-[20px] text-on-muted">
              {i + 1}
            </div>
          ))}
        </div>
        {id && ariaLabel ? (
          <label htmlFor={id} className="sr-only">
            {ariaLabel}
          </label>
        ) : null}
        <textarea
          ref={textareaRef}
          id={id}
          aria-label={ariaLabel}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          onFocus={onFocus}
          onBlur={onBlur}
          onScroll={(event) => {
            if (gutterRef.current) {
              gutterRef.current.scrollTop = event.currentTarget.scrollTop;
            }
          }}
          spellCheck={false}
          placeholder={placeholder}
          maxLength={maxChars}
          readOnly={readOnly}
          aria-invalid={ariaInvalid ? true : undefined}
          aria-describedby={ariaDescribedBy}
          className="min-h-0 min-w-0 flex-1 resize-none overflow-auto border-0 bg-transparent p-[14px_16px] font-mono text-[13px] leading-[20px] text-on-surface shadow-none outline-none placeholder:text-on-muted/60 focus:border-0 focus:ring-0 focus:outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none"
        />
      </div>
    );
  },
);
