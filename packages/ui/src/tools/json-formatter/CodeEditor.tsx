import { HostCodeEditor } from "../../components/HostCodeEditor";
import { useRef, type RefObject } from "react";
import type { InjectedEditorRef } from "../../components/CodeEditorContext";

export function CodeEditor({
  value,
  id,
  label,
  describedBy,
  placeholder,
  ariaInvalid,
  onChange,
  onFocus,
  onBlur,
  readOnly = false,
  textareaRef,
}: {
  value: string;
  minLines?: number | undefined;
  id?: string | undefined;
  label?: string | undefined;
  describedBy?: string | undefined;
  placeholder?: string | undefined;
  ariaInvalid?: boolean | undefined;
  onChange?: ((value: string) => void) | undefined;
  onFocus?: (() => void) | undefined;
  onBlur?: (() => void) | undefined;
  readOnly?: boolean | undefined;
  textareaRef?: RefObject<InjectedEditorRef | HTMLTextAreaElement | null> | undefined;
}) {
  const internalRef = useRef<InjectedEditorRef>(null);
  const targetRef = textareaRef ?? internalRef;

  return (
    <HostCodeEditor
      ref={targetRef as RefObject<InjectedEditorRef>}
      id={id}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      language="json"
      readOnly={readOnly}
      placeholder={placeholder}
      ariaLabel={label}
      ariaDescribedBy={describedBy}
      ariaInvalid={ariaInvalid}
    />
  );
}
