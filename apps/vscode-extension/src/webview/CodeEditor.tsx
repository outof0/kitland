import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { search, searchKeymap } from "@codemirror/search";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder, ViewPlugin } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import ReactCodeMirror, {
  type ReactCodeMirrorProps,
  type ReactCodeMirrorRef,
} from "@uiw/react-codemirror";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { createKitlandSearchPanel } from "./CodeEditorSearchPanel";

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
  const cmRef = useRef<ReactCodeMirrorRef>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      cmRef.current?.view?.focus();
    },
    getEditorView: () => cmRef.current?.view,
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
      EditorState.tabSize.of(indentSize === "tab" ? 4 : indentSize),
      search({
        top: true,
        createPanel: createKitlandSearchPanel,
      }),
      keymap.of(searchKeymap),
    ];

    if (readOnly) {
      exts.push(EditorState.readOnly.of(true));
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

    if (onKeyDown) {
      exts.push(
        EditorView.domEventHandlers({
          keydown: (event) => {
            onKeyDown(event);
            return false;
          },
        }),
      );
    }

    const langExt = getLanguageExtension(language);
    if (langExt) {
      exts.push(langExt);
    }

    if (placeholder) {
      exts.push(cmPlaceholder(placeholder));
    }

    if (onSubmit) {
      exts.push(
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              onSubmit();
              return true;
            },
          },
        ]),
      );
    }

    return exts;
  }, [
    indentSize,
    language,
    placeholder,
    onSubmit,
    id,
    finalAriaLabel,
    finalAriaLabelledBy,
    finalAriaDescribedBy,
    finalAriaInvalid,
    onKeyDown,
    readOnly,
  ]);

  const props: ReactCodeMirrorProps = {
    value,
    extensions,
    editable: true,
    readOnly: false,
    // The theme is fully static in codemirror.css (dark and light variants
    // follow [data-theme]), so no theme extension is needed.
    theme: "none",
    basicSetup: {
      lineNumbers,
      foldGutter,
      dropCursor: true,
      allowMultipleSelections: true,
      indentOnInput: true,
      bracketMatching: true,
      closeBrackets: !readOnly,
      // Default styles are style-mod based, which the CSP blocks; the
      // static kitlandHighlight above is the only highlighter in use.
      syntaxHighlighting: false,
      autocompletion: false,
      rectangularSelection: true,
      crosshairCursor: true,
      highlightActiveLine: !readOnly,
      highlightSelectionMatches: true,
      closeBracketsKeymap: !readOnly,
      defaultKeymap: true,
      searchKeymap: true,
      historyKeymap: true,
      foldKeymap: true,
      completionKeymap: false,
      lintKeymap: false,
    },
    autoFocus,
    indentWithTab,
    // Flex chain fills the pane and caps the editor height; see
    // codemirror.css for the .cm-editor fill/max-height rules.
    className: "kitland-cm flex-1 min-h-0 w-full flex flex-col",
  };

  if (onChange) props.onChange = onChange;
  if (onFocus) props.onFocus = onFocus;
  if (onBlur) props.onBlur = onBlur;

  return (
    <div
      className={`relative w-full h-full min-h-0 overflow-hidden flex-1 flex flex-col ${className}`}
    >
      <ReactCodeMirror ref={cmRef} {...props} />
    </div>
  );
});
