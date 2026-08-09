export { FULL_CAPABILITIES, LOCAL_ONLY_CAPABILITIES, type ToolCapabilities } from "./capabilities";

// Shared React tool UI (design.pen-aligned). Hosts mount these components and
// inject their transform engine; share-link stays a Web-only injected feature.
// Tool components that are code-split via dynamic registries are NOT re-exported
// here — import them directly from "./tools/<Tool>" to keep lazy chunks effective.
export { TextTransformEditor } from "./components/TextTransformEditor";
export { HostCodeEditor, type HostCodeEditorProps } from "./components/HostCodeEditor";
export {
  CodeEditorContext,
  useCodeEditorContext,
  resolveEditorLanguage,
  type CodeEditorContextValue,
  type InjectedEditor,
  type InjectedEditorLanguage,
  type InjectedEditorProps,
  type InjectedEditorRef,
} from "./components/CodeEditorContext";
export { WorkspaceShell, type WorkspaceShellProps } from "./components/WorkspaceShell";
export {
  EncodingTransformWorkspace,
  type EncodingTransformWorkspaceProps,
} from "./components/EncodingTransformWorkspace";
export { GeneratorResult, type GeneratorResultProps } from "./components/GeneratorResult";
export { CopyButton, type CopyButtonProps } from "./components/CopyButton";
export {
  ToolPageHeader,
  ToolOptionsBar,
  ToolFieldNote,
  ToolStatusBar,
  ToolEditorPane,
  toolSegmentGroupClass,
  toolSegmentClass,
  toolIconButtonClass,
  toolHeaderActionClass,
  toolClearActionClass,
  type ToolStatusTone,
} from "./components/ToolChrome";

// Worker protocol shared by web and extension base64 runtimes.
export {
  countBase64InputLines,
  isBase64WorkerRequest,
  isBase64WorkerResponse,
  type Base64WorkerRequest,
  type Base64WorkerResponse,
} from "./lib/base64-worker-protocol";
