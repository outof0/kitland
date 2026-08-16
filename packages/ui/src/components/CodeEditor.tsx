import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { search, searchKeymap } from "@codemirror/search";
import {
  HighlightStyle,
  bracketMatching,
  foldGutter as cmFoldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab as indentWithTabCommand,
} from "@codemirror/commands";
import { EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers as cmLineNumbers,
  placeholder as cmPlaceholder,
  rectangularSelection,
  ViewPlugin,
} from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { createKitlandSearchPanel } from "./CodeEditorSearchPanel";
import "./codemirror.css";

export type CodeEditorLanguage =
  | "json"
  | "yaml"
  | "xml"
  | "sql"
  | "typescript"
  | "javascript"
  | "markdown"
  | "text"
  | string;

export type CodeEditorProps = {
  value: string;
  onChange?: ((val: string) => void) | undefined;
  language?: CodeEditorLanguage | undefined;
  readOnly?: boolean | undefined;
  placeholder?: string | undefined;
  className?: string | undefined;
  indentWithTab?: boolean | undefined;
  indentSize?: 2 | 4 | "tab" | undefined;
  lineNumbers?: boolean | undefined;
  foldGutter?: boolean | undefined;
  onFocus?: (() => void) | undefined;
  onBlur?: (() => void) | undefined;
  onKeyDown?: ((event: React.KeyboardEvent | KeyboardEvent) => void) | undefined;
  onSubmit?: (() => void) | undefined; // Called on Cmd+Enter / Ctrl+Enter
  autoFocus?: boolean | undefined;
  id?: string | undefined;
  ariaLabel?: string | undefined;
  "aria-label"?: string | undefined;
  ariaLabelledBy?: string | undefined;
  "aria-labelledby"?: string | undefined;
  ariaDescribedBy?: string | undefined;
  "aria-describedby"?: string | undefined;
  ariaInvalid?: boolean | "grammar" | "spelling" | undefined;
  "aria-invalid"?: boolean | "grammar" | "spelling" | undefined;
};

export type CodeEditorRef = {
  focus: () => void;
  getEditorView: () => EditorView | undefined;
};

// The editor scrolls internally once the pane caps its height; CodeMirror
// marks the scroller tabindex="-1", so make it keyboard-focusable to satisfy
// axe's scrollable-region-focusable rule (its focusable-content check does
// not accept the contenteditable as focusable content).
const scrollableRegionFocusable = ViewPlugin.define((view) => {
  view.scrollDOM.tabIndex = 0;
  view.contentDOM.tabIndex = 0;
  return {};
});

// Static syntax classes. The site's CSP blocks runtime-injected <style>
// tags (style-mod), so colors are applied with static class names that
// codemirror.css styles; a `class` spec generates no styles at all.
const kitlandHighlight = HighlightStyle.define([
  { tag: t.propertyName, class: "kit-tok-propertyName" }, // blue key
  { tag: t.string, class: "kit-tok-string" }, // emerald string
  { tag: t.number, class: "kit-tok-number" }, // amber number
  { tag: t.bool, class: "kit-tok-bool" }, // pink boolean
  { tag: t.null, class: "kit-tok-null" }, // purple null
  { tag: t.keyword, class: "kit-tok-keyword" }, // indigo keyword
  { tag: t.comment, class: "kit-tok-comment" },
  { tag: t.punctuation, class: "kit-tok-punctuation" },
  { tag: t.bracket, class: "kit-tok-bracket" },
  { tag: t.operator, class: "kit-tok-operator" },
  { tag: t.tagName, class: "kit-tok-tagName" },
  { tag: t.attributeName, class: "kit-tok-attributeName" },
  { tag: t.attributeValue, class: "kit-tok-attributeValue" },
]);

function getLanguageExtension(lang?: CodeEditorLanguage): Extension | null {
  if (!lang) return null;
  const l = lang.toLowerCase();
  switch (l) {
    case "json":
      return json();
    case "yaml":
    case "yml":
      return yaml();
    case "xml":
    case "svg":
      return xml();
    case "sql":
      return sql();
    case "typescript":
    case "ts":
      return javascript({ typescript: true });
    case "javascript":
    case "js":
    case "jsx":
      return javascript({ jsx: true });
    case "markdown":
    case "md":
      return markdown();
    case "html":
      return html();
    default:
      return null;
  }
}

const attachViewToDOM = ViewPlugin.fromClass(
  class {
    constructor(view: EditorView) {
      (view.dom as HTMLElement & { cmEditorView?: EditorView }).cmEditorView = view;
      (view.contentDOM as HTMLElement & { cmEditorView?: EditorView }).cmEditorView = view;
    }
  },
);

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(function CodeEditor(
  {
    value,
    onChange,
    language = "text",
    readOnly = false,
    placeholder,
    className = "",
    indentWithTab = true,
    indentSize = 2,
    lineNumbers = true,
    foldGutter = true,
    onFocus,
    onBlur,
    onKeyDown,
    onSubmit,
    autoFocus = false,
    id,
    ariaLabel,
    "aria-label": rawAriaLabel,
    ariaLabelledBy,
    "aria-labelledby": rawAriaLabelledBy,
    ariaDescribedBy,
    "aria-describedby": rawAriaDescribedBy,
    ariaInvalid,
    "aria-invalid": rawAriaInvalid,
  },
  ref,
) {
  const editorHostRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const callbacksRef = useRef({ onBlur, onChange, onFocus, onKeyDown, onSubmit });
  callbacksRef.current = { onBlur, onChange, onFocus, onKeyDown, onSubmit };

  useImperativeHandle(ref, () => ({
    focus: () => {
      editorViewRef.current?.focus();
    },
    getEditorView: () => editorViewRef.current ?? undefined,
  }));

  const finalAriaLabel = ariaLabel ?? rawAriaLabel;
  const finalAriaLabelledBy = ariaLabelledBy ?? rawAriaLabelledBy;
  const finalAriaDescribedBy = ariaDescribedBy ?? rawAriaDescribedBy;
  const finalAriaInvalid = ariaInvalid ?? rawAriaInvalid;

  const extensions = useMemo(() => {
    const exts: Extension[] = [
      syntaxHighlighting(kitlandHighlight),
      scrollableRegionFocusable,
      attachViewToDOM,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) callbacksRef.current.onChange?.(update.state.doc.toString());
      }),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      rectangularSelection(),
      crosshairCursor(),
      history(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...(indentWithTab ? [indentWithTabCommand] : []),
        ...searchKeymap,
      ]),
      search({
        top: true,
        createPanel: createKitlandSearchPanel,
      }),
    ];

    if (lineNumbers) {
      exts.push(cmLineNumbers(), highlightActiveLineGutter());
    }
    if (foldGutter) exts.push(cmFoldGutter());
    if (!readOnly) exts.push(highlightActiveLine());

    if (readOnly) {
      exts.push(EditorState.readOnly.of(true), EditorView.editable.of(false));
    }

    const contentAttrs: Record<string, string> = {};
    if (id) contentAttrs.id = id;
    if (finalAriaLabel) contentAttrs["aria-label"] = finalAriaLabel;
    if (finalAriaLabelledBy) contentAttrs["aria-labelledby"] = finalAriaLabelledBy;
    if (finalAriaDescribedBy) contentAttrs["aria-describedby"] = finalAriaDescribedBy;
    if (finalAriaInvalid !== undefined) {
      contentAttrs["aria-invalid"] = String(finalAriaInvalid);
    }
    if (Object.keys(contentAttrs).length > 0) {
      exts.push(EditorView.contentAttributes.of(contentAttrs));
    }

    exts.push(
      EditorView.domEventHandlers({
        keydown: (event) => {
          callbacksRef.current.onKeyDown?.(event);
          return false;
        },
        focus: () => {
          callbacksRef.current.onFocus?.();
          return false;
        },
        blur: () => {
          callbacksRef.current.onBlur?.();
          return false;
        },
      }),
    );

    const langExt = getLanguageExtension(language);
    if (langExt) {
      exts.push(langExt);
    }

    if (placeholder) {
      exts.push(cmPlaceholder(placeholder));
    }

    exts.push(
      keymap.of([
        {
          key: "Mod-Enter",
          run: () => {
            callbacksRef.current.onSubmit?.();
            return true;
          },
        },
      ]),
    );

    return exts;
  }, [
    language,
    lineNumbers,
    foldGutter,
    indentWithTab,
    placeholder,
    id,
    finalAriaLabel,
    finalAriaLabelledBy,
    finalAriaDescribedBy,
    finalAriaInvalid,
    readOnly,
  ]);

  useEffect(() => {
    const host = editorHostRef.current;
    if (!host) return;
    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: host,
    });
    editorViewRef.current = view;
    if (autoFocus) view.focus();

    return () => {
      if (editorViewRef.current === view) editorViewRef.current = null;
      view.destroy();
    };
  }, [extensions]);

  useEffect(() => {
    const view = editorViewRef.current;
    if (!view || value === view.state.doc.toString()) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  return (
    <div
      className={`relative w-full h-full min-h-0 overflow-hidden flex-1 flex flex-col ${className}`}
    >
      <div
        ref={editorHostRef}
        className={`kitland-cm kitland-cm--indent-${indentSize} flex min-h-0 w-full flex-1 flex-col`}
      />
    </div>
  );
});
