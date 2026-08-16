import { createContext, useContext, type FunctionComponent, type Ref } from "react";

export type InjectedEditorLanguage =
  | "json"
  | "yaml"
  | "xml"
  | "sql"
  | "typescript"
  | "javascript"
  | "markdown"
  | "html"
  | "text";

export type InjectedEditorProps = {
  readonly value: string;
  readonly onChange?: ((value: string) => void) | undefined;
  readonly language?: InjectedEditorLanguage | undefined;
  readonly readOnly?: boolean | undefined;
  readonly placeholder?: string | undefined;
  readonly ariaLabel?: string | undefined;
  readonly ariaDescribedBy?: string | undefined;
  readonly ariaInvalid?: boolean | undefined;
  readonly indentSize?: 2 | 4 | "tab" | undefined;
  readonly onSubmit?: (() => void) | undefined;
  readonly id?: string | undefined;
  readonly onFocus?: (() => void) | undefined;
  readonly onBlur?: (() => void) | undefined;
};

export type InjectedEditorRef = {
  focus: () => void;
};

export type InjectedEditor = FunctionComponent<
  InjectedEditorProps & { ref?: Ref<InjectedEditorRef> }
>;

export type CodeEditorContextValue = {
  /** Lazy loader for the host's syntax-highlighting editor; absent on textarea-only hosts. */
  readonly loadEditor: () => Promise<{ default: InjectedEditor }>;
  /** When true the result pane is editable in place on this host. */
  readonly editableOutput?: boolean;
};

export const CodeEditorContext = createContext<CodeEditorContextValue | null>(null);

export function useCodeEditorContext(): CodeEditorContextValue | null {
  return useContext(CodeEditorContext);
}

/** Resolve a display langTag (or an explicit pane language) to an editor language id. */
export function resolveEditorLanguage(
  langTag: string | undefined,
  explicit?: string,
): InjectedEditorLanguage | null {
  const id = explicit ?? langTag;
  switch ((id ?? "").toUpperCase()) {
    case "JSON":
      return "json";
    case "JAVASCRIPT":
      return "javascript";
    case "TYPESCRIPT":
      return "typescript";
    case "JSX":
      return "javascript";
    case "YAML":
      return "yaml";
    case "XML":
      return "xml";
    case "SQL":
      return "sql";
    case "HTML":
      return "html";
    case "MARKDOWN":
      return "markdown";
    case "TEXT":
      return "text";
    default:
      return "text";
  }
}
