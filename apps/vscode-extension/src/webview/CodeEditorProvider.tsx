import { CodeEditorContext, type CodeEditorContextValue, type InjectedEditor } from "@kitland/ui";
import type { ReactNode } from "react";

const loadEditor = (): Promise<{ default: InjectedEditor }> =>
  import("./CodeEditor").then((module) => ({
    default: module.CodeEditor as unknown as InjectedEditor,
  }));

const CONTEXT_VALUE: CodeEditorContextValue = {
  loadEditor,
  editableOutput: true,
};

export function CodeEditorProvider({ children }: { readonly children: ReactNode }) {
  return <CodeEditorContext.Provider value={CONTEXT_VALUE}>{children}</CodeEditorContext.Provider>;
}
