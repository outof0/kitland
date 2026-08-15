import { CodeEditorContext, type CodeEditorContextValue, type InjectedEditor } from "@kitland/ui";
import type { ReactNode } from "react";

/**
 * Web-only host adapter: injects the CodeMirror editor into the shared
 * @kitland/ui TextTransformEditor panes. The loader is lazy so the
 * ToolWorkspace island chunk stays small; CodeMirror lands in an unbudgeted
 * per-tool/shared chunk. Extension and VS Code hosts render no editor here
 * (textarea fallback) because their bundles are budget-capped.
 */
const loadEditor = (): Promise<{ default: InjectedEditor }> =>
  import("@/components/ui/CodeEditor").then((module) => ({
    default: module.CodeEditor as unknown as InjectedEditor,
  }));

const CONTEXT_VALUE: CodeEditorContextValue = {
  loadEditor,
  editableOutput: true,
};

export function CodeEditorProvider({ children }: { readonly children: ReactNode }) {
  return <CodeEditorContext.Provider value={CONTEXT_VALUE}>{children}</CodeEditorContext.Provider>;
}
