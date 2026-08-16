import { CodeEditorContext, type CodeEditorContextValue, type InjectedEditor } from "@kitland/ui";
import type { ReactNode } from "react";

// Keep CodeMirror out of the extension shell: it is fetched only when a tool
// renders a code pane, then receives the same static CSP-safe highlighting as
// the web host.
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
