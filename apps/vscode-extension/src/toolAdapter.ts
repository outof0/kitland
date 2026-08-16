import type { JsonInspection, ToolResult } from "@kitland/core";
import type { RegistryTool } from "@kitland/tools";

export type ToolChoice = { id: string; label: string };
export type ToolOperation = ToolChoice & { actionLabel: string };

export type TextTransformRenderer = {
  kind: "text-transform";
  operations: readonly ToolOperation[];
  options: readonly ToolChoice[];
  optionLabel: string;
  defaultOperationId: string;
  defaultOptionId: string;
};

export type TextInspectRenderer = {
  kind: "text-inspect";
  operations: readonly ToolOperation[];
  options: readonly ToolChoice[];
  optionLabel: string;
  defaultOperationId: string;
  defaultOptionId: string;
};

export type ToolDescriptor = {
  id: string;
  title: string;
  description: string;
  renderer: TextTransformRenderer | TextInspectRenderer;
};

export type TextTransformRequest = {
  operationId: string;
  optionId: string;
  input: string;
  secondaryInput?: string;
};
export type TextInspectRequest = { operationId: string; optionId: string; input: string };
export type SelectionCommand = { commandId: string; operationId: string; optionId: string };

type BaseToolAdapter = {
  readonly registryTool: RegistryTool;
  readonly descriptor: ToolDescriptor;
  readonly maxOutputChars: number;
  readonly maxSelectionChars: number;
};

export type TextTransformAdapter = BaseToolAdapter & {
  readonly descriptor: ToolDescriptor & { renderer: TextTransformRenderer };
  readonly selectionCommands: readonly SelectionCommand[];
  inputLimit(operationId: string): number | undefined;
  transform(request: TextTransformRequest): ToolResult<string> | Promise<ToolResult<string>>;
};

export type TextInspectAdapter = BaseToolAdapter & {
  readonly descriptor: ToolDescriptor & { renderer: TextInspectRenderer };
  readonly selectionCommands: readonly [];
  readonly maxInputChars: number;
  inspect(request: TextInspectRequest): ToolResult<JsonInspection>;
};

export type ToolAdapter = TextTransformAdapter | TextInspectAdapter;
