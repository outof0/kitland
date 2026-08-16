import { CodeEditorContext, type CodeEditorContextValue, type InjectedEditor } from "@kitland/ui";
import type { ReactNode } from "react";

/**
 * Web host adapter: injects the shared CodeMirror editor into the
 * @kitland/ui TextTransformEditor panes. The loader is lazy so the
 * ToolWorkspace island chunk stays small.
 */
const loadEditor = (): Promise<{ default: InjectedEditor }> =>
  import("@kitland/ui/code-editor").then((module) => ({
    default: module.CodeEditor as unknown as InjectedEditor,
  }));

const CONTEXT_VALUE: CodeEditorContextValue = {
  loadEditor,
  editableOutput: true,
};

export function CodeEditorProvider({ children }: { readonly children: ReactNode }) {
  return <CodeEditorContext.Provider value={CONTEXT_VALUE}>{children}</CodeEditorContext.Provider>;
}
